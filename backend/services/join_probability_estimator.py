"""Join Probability Estimator — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    Predicts the end-to-end conversion probability: "If I reach out and
    get a response, will this candidate ultimately join?"  This is the
    final gating question before a recruiter decides to invest pipeline
    capacity.

Signal Modeled:
    - Availability signal (Open To Work, notice period)
    - Responsiveness signal (response rate as a conversion proxy)
    - Market activity (platform presence → intent to move)
    - Salary alignment (is this role financially attractive?)
    - Offer acceptance history (will they actually accept?)

Architecture:
    Rule-based first, with explicit ML hook for Phase 12+.  The
    ``_apply_ml_override()`` method is a no-op stub that a future ML
    model (XGBoost/LightGBM) will override via dependency injection.

Phase 13 Ranking Usage:
    Returns ``join_probability`` and ``confidence`` scalars.  Consumed by
    BehavioralScoring (10% weight) and exported as
    ``behavioral_join_probability`` in the Phase 13 ranking feature
    vector.
"""

import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple

from models.candidate import Candidate
from models.availability_profile import AvailabilityProfile
from models.responsiveness_profile import ResponsivenessProfile

logger = logging.getLogger(__name__)


@dataclass
class JoinProbabilityResult:
    """Container for join probability output.

    Attributes:
        join_probability: Estimated probability [0.0, 1.0] candidate accepts offer.
        confidence: Signal-quality confidence [0.0, 1.0].
        evidence: Human-readable audit trail.
    """
    join_probability: float
    confidence: float
    evidence: List[str]


class JoinProbabilityEstimator:
    """Estimates the probability that a candidate will accept an offered role.

    Design philosophy:
        Join probability is a product of intent (want to move?) ×
        receptivity (willing to engage with this role?) × conversion
        (history of saying yes?).  Each factor is scored independently
        and combined multiplicatively to prevent any single signal from
        dominating unrealistically.

    ML Extension Point:
        Override ``_apply_ml_override()`` to inject a trained model.
        The rule-based score is passed as the default; the ML model
        can accept or adjust it.  This pattern prevents cold-start
        failures when the model is not yet trained.
    """

    # ── Component weights for rule-based score ─────────────────────────────────
    WEIGHT_AVAILABILITY: float = 0.30
    WEIGHT_RESPONSIVENESS: float = 0.25
    WEIGHT_MARKET_INTENT: float = 0.20
    WEIGHT_SALARY_ALIGNMENT: float = 0.15
    WEIGHT_OFFER_HISTORY: float = 0.10

    # ── Salary alignment ceiling (INR LPA) ─────────────────────────────────────
    JD_OFFER_BUDGET_LPA: float = 50.0   # Default budget; injectable per-role

    def _score_availability_signal(
        self,
        candidate: Candidate,
        availability_profile: Optional[AvailabilityProfile] = None,
    ) -> Tuple[float, List[str]]:
        """Extracts availability intent score as join-probability input.

        Prefers pre-computed AvailabilityProfile if provided, else
        falls back to raw Candidate signals.

        Args:
            candidate: Candidate aggregate.
            availability_profile: Pre-computed profile (optional).

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        evidence: List[str] = []

        if availability_profile is not None:
            score = availability_profile.availability_score
            evidence.append(
                f"Availability signal from pre-computed profile: {score:.3f}."
            )
        else:
            sig = candidate.redrob_signals
            score = 0.0
            if sig.open_to_work_flag:
                score += 0.60
                evidence.append("✅ Open To Work flag is active.")
            if sig.applications_submitted_30d > 0:
                score += min(0.30, sig.applications_submitted_30d / 10.0 * 0.30)
                evidence.append(f"✅ Active applications: {sig.applications_submitted_30d} in 30 days.")
            if sig.notice_period_days <= 30:
                score += 0.10
                evidence.append(f"✅ Short notice period: {sig.notice_period_days} days.")
            score = min(1.0, score)
            evidence.append(f"Availability signal (raw): {score:.3f}.")

        return round(score, 4), evidence

    def _score_responsiveness_signal(
        self,
        candidate: Candidate,
        responsiveness_profile: Optional[ResponsivenessProfile] = None,
    ) -> Tuple[float, List[str]]:
        """Extracts responsiveness as a conversion-rate proxy.

        A high response rate is the single best predictor that a
        candidate will say yes to further engagement.

        Args:
            candidate: Candidate aggregate.
            responsiveness_profile: Pre-computed profile (optional).

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        evidence: List[str] = []

        if responsiveness_profile is not None:
            score = responsiveness_profile.responsiveness_score
            evidence.append(
                f"Responsiveness signal from pre-computed profile: {score:.3f}."
            )
        else:
            score = candidate.redrob_signals.recruiter_response_rate
            evidence.append(
                f"Response rate (raw): {score:.0%}."
            )

        return round(score, 4), evidence

    def _score_market_intent(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores market-movement intent from platform activity signals.

        Combines search appearances and recruiter saves as passive
        demand, and applications + Open-To-Work as active intent.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        sig = candidate.redrob_signals
        evidence: List[str] = []

        passive = min(1.0, sig.saved_by_recruiters_30d / 10.0) * 0.40
        active = (1.0 if sig.open_to_work_flag else 0.0) * 0.40
        activity = min(1.0, sig.applications_submitted_30d / 10.0) * 0.20

        score = passive + active + activity

        evidence.append(
            f"Market intent: passive={passive:.2f}, active={active:.2f}, activity={activity:.2f}"
        )

        if score > 0.70:
            evidence.append("✅ Strong market movement intent detected.")
        elif score > 0.40:
            evidence.append("🟡 Moderate market movement intent.")
        else:
            evidence.append("🔴 Low market movement intent — candidate may be passively browsing.")

        return round(min(1.0, score), 4), evidence

    def _score_salary_alignment(
        self,
        candidate: Candidate,
        offer_budget_lpa: float,
    ) -> Tuple[float, List[str]]:
        """Scores whether the role's budget aligns with candidate's salary expectations.

        If the offer budget falls within the candidate's expected range
        (or above), the score is 1.0.  If below the min expectation,
        the score decays proportionally.

        Args:
            candidate: Candidate aggregate.
            offer_budget_lpa: Role's salary budget in INR LPA.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        exp = candidate.redrob_signals.expected_salary_range_inr_lpa
        evidence: List[str] = []

        if offer_budget_lpa >= exp.max:
            score = 1.0
            evidence.append(
                f"✅ Offer budget (₹{offer_budget_lpa}L) meets or exceeds candidate's max expectation (₹{exp.max}L)."
            )
        elif offer_budget_lpa >= exp.min:
            # Budget within range — partial score based on proximity to max
            ratio = (offer_budget_lpa - exp.min) / max(0.01, exp.max - exp.min)
            score = 0.60 + 0.40 * ratio
            evidence.append(
                f"🟡 Offer budget (₹{offer_budget_lpa}L) is within candidate's range "
                f"(₹{exp.min}L–₹{exp.max}L)."
            )
        else:
            # Below minimum — significant drop
            gap = exp.min - offer_budget_lpa
            penalty = min(1.0, gap / exp.min) if exp.min > 0 else 1.0
            score = max(0.0, 0.60 - 0.60 * penalty)
            evidence.append(
                f"🔴 Offer budget (₹{offer_budget_lpa}L) is below candidate's minimum "
                f"expectation (₹{exp.min}L). Gap: ₹{gap:.1f}L."
            )

        return round(min(1.0, max(0.0, score)), 4), evidence

    def _score_offer_history(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores historical offer-acceptance behavior.

        Offer acceptance rate of -1.0 means no history — treated neutrally.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        rate = candidate.redrob_signals.offer_acceptance_rate
        evidence: List[str] = []

        if rate < 0.0:
            score = 0.50
            evidence.append("⚪ No offer history available — defaulting to neutral (0.50).")
        elif rate == 0.0:
            score = 0.10
            evidence.append("🔴 Candidate has never accepted an offer — high conversion risk.")
        elif rate < 0.40:
            score = 0.30
            evidence.append(f"🔴 Low offer acceptance history: {rate:.0%}.")
        elif rate < 0.70:
            score = 0.65
            evidence.append(f"🟡 Moderate offer acceptance history: {rate:.0%}.")
        else:
            score = 0.90
            evidence.append(f"✅ Strong offer acceptance history: {rate:.0%}.")

        return round(score, 4), evidence

    def _apply_ml_override(
        self,
        rule_based_score: float,
        candidate: Candidate,
    ) -> float:
        """ML extension hook for future model injection.

        This is a no-op stub.  In Phase 12+, inject a trained binary
        classifier here (XGBoost, LightGBM) that accepts the candidate
        feature vector and returns a calibrated probability.

        Args:
            rule_based_score: Score computed by the rule-based engine.
            candidate: Candidate aggregate (for ML feature extraction).

        Returns:
            float: Adjusted score — currently returns rule_based_score unchanged.
        """
        # ML model injection point — Phase 12 integration
        return rule_based_score

    def estimate(
        self,
        candidate: Candidate,
        offer_budget_lpa: float = JD_OFFER_BUDGET_LPA,
        availability_profile: Optional[AvailabilityProfile] = None,
        responsiveness_profile: Optional[ResponsivenessProfile] = None,
    ) -> JoinProbabilityResult:
        """Computes the join probability for a candidate and role.

        Orchestrates all sub-scorers, applies configurable weights,
        and optionally invokes the ML override stub.

        Args:
            candidate: Candidate aggregate.
            offer_budget_lpa: Role's salary budget in INR LPA.
            availability_profile: Pre-computed availability sub-profile (optional).
            responsiveness_profile: Pre-computed responsiveness sub-profile (optional).

        Returns:
            JoinProbabilityResult: join_probability, confidence, evidence.
        """
        logger.debug(
            "Estimating join probability for %s | budget=₹%sL",
            candidate.candidate_id,
            offer_budget_lpa,
        )

        avail_score, avail_ev = self._score_availability_signal(
            candidate, availability_profile
        )
        resp_score, resp_ev = self._score_responsiveness_signal(
            candidate, responsiveness_profile
        )
        market_score, market_ev = self._score_market_intent(candidate)
        salary_score, salary_ev = self._score_salary_alignment(candidate, offer_budget_lpa)
        offer_score, offer_ev = self._score_offer_history(candidate)

        rule_based = (
            self.WEIGHT_AVAILABILITY * avail_score
            + self.WEIGHT_RESPONSIVENESS * resp_score
            + self.WEIGHT_MARKET_INTENT * market_score
            + self.WEIGHT_SALARY_ALIGNMENT * salary_score
            + self.WEIGHT_OFFER_HISTORY * offer_score
        )
        rule_based = round(min(1.0, max(0.0, rule_based)), 4)

        # Apply ML override (no-op until Phase 12 model is trained)
        final_probability = self._apply_ml_override(rule_based, candidate)
        final_probability = round(min(1.0, max(0.0, final_probability)), 4)

        # Confidence: fraction of sub-signals that were observable (non-neutral)
        non_neutral = sum(
            1
            for s in (avail_score, resp_score, market_score, salary_score, offer_score)
            if s != 0.50  # 0.50 is our neutral/unknown default
        )
        confidence = round(non_neutral / 5.0, 4)

        all_evidence = (
            avail_ev
            + resp_ev
            + market_ev
            + salary_ev
            + offer_ev
            + [
                f"📊 Rule-based join_probability = {rule_based:.3f}",
                f"📊 Final join_probability = {final_probability:.3f} (confidence: {confidence:.2f})",
            ]
        )

        logger.info(
            "Join probability for %s: %.3f (confidence: %.3f)",
            candidate.candidate_id,
            final_probability,
            confidence,
        )

        return JoinProbabilityResult(
            join_probability=final_probability,
            confidence=confidence,
            evidence=all_evidence,
        )
