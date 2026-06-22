"""Responsiveness Analyzer — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    Predicts whether a candidate will actually reply to recruiter outreach
    and complete the interview process.  Answers: "Is this candidate
    worth spending outreach budget on?"

Signal Modeled:
    - Response rate (historical reply probability)
    - Average response time (communication speed)
    - Response consistency (interview completion as reliability proxy)
    - Communication reliability (offer-acceptance stability)

Phase 13 Ranking Usage:
    Returns ResponsivenessProfile with ``responsiveness_score`` and
    ``confidence``. Consumed by BehavioralScoring (20% weight) and
    exported as ``behavioral_responsiveness`` in the Phase 13 ranking
    feature vector.  High-responsiveness candidates are surfaced earlier
    in outreach queues to improve pipeline throughput.
"""

import logging
from typing import List, Tuple

from models.responsiveness_profile import ResponsivenessProfile
from models.candidate import Candidate

logger = logging.getLogger(__name__)


class ResponsivenessAnalyzer:
    """Estimates how reliably a candidate communicates with recruiters.

    Design philosophy:
        Communication reliability is a strong predictor of pipeline
        conversion.  A candidate with 95% response rate who replies in
        under 2 hours is nearly guaranteed to engage.  One with 20%
        response rate over 72 hours burns recruiter capacity.  This
        analyzer makes that signal explicit and actionable.
    """

    # ── Weight constants ───────────────────────────────────────────────────────
    WEIGHT_RESPONSE_RATE: float = 0.40
    WEIGHT_RESPONSE_TIME: float = 0.25
    WEIGHT_CONSISTENCY: float = 0.20
    WEIGHT_RELIABILITY: float = 0.15

    # ── Response-time thresholds (in hours) ───────────────────────────────────
    TIME_EXCELLENT: float = 2.0    # ≤ 2h → 1.00
    TIME_GOOD: float = 12.0        # ≤ 12h → 0.85
    TIME_ACCEPTABLE: float = 24.0  # ≤ 24h → 0.65
    TIME_SLOW: float = 72.0        # ≤ 72h → 0.35
    # > 72h → 0.10

    def calculate_response_rate(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores historical recruiter-message response rate directly.

        This is the single strongest predictor of recruiter engagement.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        rate = candidate.redrob_signals.recruiter_response_rate
        evidence: List[str] = []

        # Rate is already [0.0, 1.0] — use directly
        score = rate

        if rate == 0.0:
            evidence.append("🔴 Response rate is 0% — candidate has never replied to recruiter messages.")
        elif rate < 0.30:
            evidence.append(f"🔴 Low response rate: {rate:.0%} of recruiter messages answered.")
        elif rate < 0.60:
            evidence.append(f"🟡 Moderate response rate: {rate:.0%} of recruiter messages answered.")
        elif rate < 0.85:
            evidence.append(f"✅ Good response rate: {rate:.0%} of recruiter messages answered.")
        else:
            evidence.append(f"✅ Excellent response rate: {rate:.0%} — highly responsive candidate.")

        return round(score, 4), evidence

    def calculate_response_time(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores communication speed from average response time in hours.

        Faster is always better for recruiter pipeline velocity.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        hours = candidate.redrob_signals.avg_response_time_hours
        evidence: List[str] = []

        if hours <= self.TIME_EXCELLENT:
            score = 1.00
            evidence.append(f"✅ Excellent response speed: avg {hours:.1f}h — replies within 2 hours.")
        elif hours <= self.TIME_GOOD:
            score = 0.85
            evidence.append(f"✅ Good response speed: avg {hours:.1f}h — replies same day.")
        elif hours <= self.TIME_ACCEPTABLE:
            score = 0.65
            evidence.append(f"🟡 Acceptable response speed: avg {hours:.1f}h — replies within 24 hours.")
        elif hours <= self.TIME_SLOW:
            score = 0.35
            evidence.append(f"🟡 Slow response speed: avg {hours:.1f}h — takes up to 3 days.")
        else:
            score = 0.10
            evidence.append(f"🔴 Very slow response speed: avg {hours:.1f}h — risk of candidate going dark.")

        return round(score, 4), evidence

    def calculate_response_consistency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores communication consistency using interview-completion rate.

        Interview completion is the best available proxy for whether a
        candidate reliably follows through on commitments.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        completion_rate = candidate.redrob_signals.interview_completion_rate
        evidence: List[str] = []

        score = completion_rate  # Already [0.0, 1.0]

        if completion_rate == 0.0:
            evidence.append("🔴 Interview completion rate is 0% — candidate has not completed any interviews.")
        elif completion_rate < 0.40:
            evidence.append(f"🔴 Low interview completion: {completion_rate:.0%} — high no-show risk.")
        elif completion_rate < 0.70:
            evidence.append(f"🟡 Moderate interview completion: {completion_rate:.0%}.")
        elif completion_rate < 0.90:
            evidence.append(f"✅ Good interview completion: {completion_rate:.0%}.")
        else:
            evidence.append(f"✅ Excellent interview completion: {completion_rate:.0%} — highly reliable.")

        return round(score, 4), evidence

    def calculate_communication_reliability(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores end-to-end communication reliability combining response + offer behavior.

        Combines interview completion (0.60) and offer acceptance (0.40)
        into a single reliability index.  Offer acceptance rate can be -1.0
        (no history), which is treated neutrally.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        completion = candidate.redrob_signals.interview_completion_rate
        offer_rate = candidate.redrob_signals.offer_acceptance_rate
        evidence: List[str] = []

        # Handle unknown offer rate (-1.0)
        if offer_rate < 0.0:
            offer_score = 0.50  # Neutral — no history available
            evidence.append("⚪ No offer-acceptance history available — defaulting to neutral.")
        else:
            offer_score = offer_rate
            if offer_rate < 0.30:
                evidence.append(f"🔴 Low offer acceptance: {offer_rate:.0%} — may be using offers as leverage.")
            elif offer_rate < 0.60:
                evidence.append(f"🟡 Moderate offer acceptance: {offer_rate:.0%}.")
            else:
                evidence.append(f"✅ Strong offer acceptance: {offer_rate:.0%} — candidate converts well.")

        score = (0.60 * completion) + (0.40 * offer_score)

        return round(min(1.0, max(0.0, score)), 4), evidence

    def calculate_responsiveness(self, candidate: Candidate) -> Tuple[float, float]:
        """Computes composite responsiveness score and confidence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float]: (responsiveness_score, confidence) in [0,1].
        """
        rr, _ = self.calculate_response_rate(candidate)
        rt, _ = self.calculate_response_time(candidate)
        rc, _ = self.calculate_response_consistency(candidate)
        cr, _ = self.calculate_communication_reliability(candidate)

        composite = (
            self.WEIGHT_RESPONSE_RATE * rr
            + self.WEIGHT_RESPONSE_TIME * rt
            + self.WEIGHT_CONSISTENCY * rc
            + self.WEIGHT_RELIABILITY * cr
        )

        non_zero = sum(1 for s in (rr, rt, rc, cr) if s > 0.0)
        confidence = non_zero / 4.0

        return round(min(1.0, composite), 4), round(confidence, 4)

    def generate_profile(self, candidate: Candidate) -> ResponsivenessProfile:
        """Orchestrates all sub-calculations and returns a complete ResponsivenessProfile.

        This is the primary public interface consumed by RecruiterTrustService.

        Args:
            candidate: Candidate aggregate.

        Returns:
            ResponsivenessProfile: Fully populated responsiveness assessment.
        """
        logger.debug("Analyzing responsiveness for candidate %s", candidate.candidate_id)

        rr, rr_evidence = self.calculate_response_rate(candidate)
        rt, rt_evidence = self.calculate_response_time(candidate)
        rc, rc_evidence = self.calculate_response_consistency(candidate)
        cr, cr_evidence = self.calculate_communication_reliability(candidate)

        composite = (
            self.WEIGHT_RESPONSE_RATE * rr
            + self.WEIGHT_RESPONSE_TIME * rt
            + self.WEIGHT_CONSISTENCY * rc
            + self.WEIGHT_RELIABILITY * cr
        )
        composite = round(min(1.0, max(0.0, composite)), 4)

        non_zero = sum(1 for s in (rr, rt, rc, cr) if s > 0.0)
        confidence = round(non_zero / 4.0, 4)

        all_evidence = (
            rr_evidence
            + rt_evidence
            + rc_evidence
            + cr_evidence
            + [f"📊 Composite responsiveness_score = {composite:.3f} (confidence: {confidence:.2f})"]
        )

        logger.info(
            "Responsiveness profile built for %s | score=%.3f | confidence=%.3f",
            candidate.candidate_id,
            composite,
            confidence,
        )

        return ResponsivenessProfile(
            response_rate=rr,
            average_response_time=rt,
            response_consistency=rc,
            communication_reliability=cr,
            responsiveness_score=composite,
            confidence=confidence,
            evidence=all_evidence,
        )
