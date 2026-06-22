"""Trust Engine — Phase 11: Behavioral Intelligence.

Recruiter Problem Solved:
    Validates whether a candidate profile is trustworthy enough to
    present to a hiring manager.  Answers: "Can I stake my reputation
    on this profile?" — not fraud detection, but signal-quality
    assessment.

Signal Modeled:
    - Profile completeness (is the data there?)
    - Verification score (email, phone, LinkedIn confirmed?)
    - Career narrative consistency (do tenure numbers add up?)
    - Identity confidence (verified touchpoints + platform seniority)
    - Profile quality (skill depth, endorsements, connections)

Phase 13 Ranking Usage:
    Returns TrustProfile with ``trust_score`` and ``confidence``.
    Trust is the highest-weighted behavioral signal (30% default) and
    is exported as ``behavioral_trust`` in the Phase 13 feature vector.
    Also drives hard-filter gates in the ranking pre-processor.
"""

import logging
from datetime import date
from typing import Any, Dict, List, Tuple

from models.trust_profile import TrustProfile
from models.candidate import Candidate

logger = logging.getLogger(__name__)

# ── Reference date ─────────────────────────────────────────────────────────────
_REFERENCE_DATE: date = date(2026, 6, 15)

# ── Normalisation ceilings ─────────────────────────────────────────────────────
_MAX_SKILLS: int = 20
_MAX_CONNECTIONS: int = 500
_MAX_ENDORSEMENTS: int = 100
_MAX_ASSESSMENTS: int = 10
_PLATFORM_SENIOR_DAYS: int = 365   # ≥1 year on platform = senior member


class TrustEngine:
    """Evaluates the trustworthiness and consistency of a candidate profile.

    Design philosophy:
        Trust is not about catching liars — it is about quantifying how
        confidently a recruiter can present this candidate.  A profile
        with verified contacts, a coherent career arc, and rich skills
        data is a *credible* profile.  Low trust simply means
        *insufficient signal*, never *suspected fraud*.

        All methods return (score, evidence_list) tuples to preserve
        the full audit trail.
    """

    # ── Weight constants ───────────────────────────────────────────────────────
    WEIGHT_COMPLETENESS: float = 0.25
    WEIGHT_VERIFICATION: float = 0.25
    WEIGHT_CAREER_CONSISTENCY: float = 0.20
    WEIGHT_IDENTITY: float = 0.15
    WEIGHT_QUALITY: float = 0.15

    def calculate_profile_completeness(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Normalises platform-provided completeness percentage to [0, 1].

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        pct = candidate.redrob_signals.profile_completeness_score  # 0–100
        score = min(1.0, pct / 100.0)
        evidence: List[str] = []

        if pct < 40:
            evidence.append(f"🔴 Profile is {pct:.0f}% complete — significant data gaps.")
        elif pct < 70:
            evidence.append(f"🟡 Profile is {pct:.0f}% complete — moderate completeness.")
        elif pct < 90:
            evidence.append(f"✅ Profile is {pct:.0f}% complete — good coverage.")
        else:
            evidence.append(f"✅ Profile is {pct:.0f}% complete — highly detailed.")

        return round(score, 4), evidence

    def calculate_verification_score(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores identity verification from email, phone, and LinkedIn signals.

        Email and phone verification are each worth 40%.
        LinkedIn connectivity is worth 20%.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        sig = candidate.redrob_signals
        score = 0.0
        evidence: List[str] = []

        if sig.verified_email:
            score += 0.40
            evidence.append("✅ Email address verified.")
        else:
            evidence.append("🔴 Email address not verified.")

        if sig.verified_phone:
            score += 0.40
            evidence.append("✅ Phone number verified.")
        else:
            evidence.append("🔴 Phone number not verified.")

        if sig.linkedin_connected:
            score += 0.20
            evidence.append("✅ LinkedIn profile connected.")
        else:
            evidence.append("⚪ LinkedIn profile not connected.")

        return round(min(1.0, score), 4), evidence

    def validate_consistency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Detects career-narrative consistency issues.

        Checks:
          1. Average tenure sanity (0.5–8 years is healthy)
          2. Skill-to-experience ratio (≥1 skill per 2 years)
          3. Assessment scores vs declared skills alignment

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (consistency_score in [0,1], evidence list).
        """
        evidence: List[str] = []
        consistency_penalties: float = 0.0

        # 1. Average tenure check
        avg_tenure = candidate.average_tenure
        if avg_tenure < 0.25:
            consistency_penalties += 0.30
            evidence.append(
                f"🔴 Very short average tenure ({avg_tenure:.1f} yrs) — possible instability pattern."
            )
        elif avg_tenure < 0.50:
            consistency_penalties += 0.15
            evidence.append(
                f"🟡 Short average tenure ({avg_tenure:.1f} yrs) — slightly below typical norms."
            )
        else:
            evidence.append(
                f"✅ Healthy average tenure ({avg_tenure:.1f} yrs)."
            )

        # 2. Skill depth vs experience ratio
        years_exp = candidate.total_years_experience
        skill_count = len(candidate.skills)
        expected_min_skills = max(1, int(years_exp / 2))

        if skill_count < expected_min_skills:
            consistency_penalties += 0.20
            evidence.append(
                f"🟡 Skill count ({skill_count}) is low relative to "
                f"{years_exp:.1f} years of experience (expected ≥{expected_min_skills})."
            )
        else:
            evidence.append(
                f"✅ Skill count ({skill_count}) is consistent with "
                f"{years_exp:.1f} years of experience."
            )

        # 3. Assessment score quality check
        assessments = candidate.redrob_signals.skill_assessment_scores
        if assessments:
            avg_assessment = sum(assessments.values()) / len(assessments)
            if avg_assessment < 30:
                consistency_penalties += 0.15
                evidence.append(
                    f"🔴 Low average skill assessment score ({avg_assessment:.1f}/100) "
                    "— skill claims may be overstated."
                )
            elif avg_assessment >= 70:
                evidence.append(
                    f"✅ Strong average skill assessment score ({avg_assessment:.1f}/100)."
                )
            else:
                evidence.append(
                    f"🟡 Moderate skill assessment scores ({avg_assessment:.1f}/100)."
                )
        else:
            evidence.append("⚪ No skill assessments completed.")

        score = max(0.0, 1.0 - consistency_penalties)
        return round(score, 4), evidence

    def calculate_career_consistency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores the coherence of the career history timeline.

        Evaluates:
          - Job-hopping frequency (>4 roles in <3 years is a flag)
          - Current role continuity (is there an active role?)
          - Career progression direction (roles exist and are detailed)

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        evidence: List[str] = []
        history = candidate.career_history
        score = 1.0

        # 1. Job-hopping check: how many roles lasted <12 months?
        short_tenures = [j for j in history if j.duration_months < 12]
        if len(short_tenures) > 3:
            score -= 0.30
            evidence.append(
                f"🔴 {len(short_tenures)} roles under 12 months — frequent job-hopping detected."
            )
        elif len(short_tenures) > 1:
            score -= 0.10
            evidence.append(
                f"🟡 {len(short_tenures)} short-tenure roles (<12 months) observed."
            )
        else:
            evidence.append("✅ Career history shows stable tenure patterns.")

        # 2. Current role continuity
        has_current = any(j.is_current for j in history)
        if has_current:
            evidence.append("✅ Candidate has an active current role.")
        else:
            score -= 0.10
            evidence.append("🟡 No current role marked — candidate may be between jobs.")

        # 3. Career richness: descriptions present
        described_roles = [j for j in history if j.description and len(j.description) > 30]
        if len(described_roles) < len(history) * 0.5:
            score -= 0.15
            evidence.append(
                f"🟡 Only {len(described_roles)}/{len(history)} roles have detailed descriptions."
            )
        else:
            evidence.append(
                f"✅ {len(described_roles)}/{len(history)} roles have sufficient descriptions."
            )

        return round(max(0.0, min(1.0, score)), 4), evidence

    def calculate_identity_confidence(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores overall identity confidence from verified touchpoints and platform seniority.

        Uses: verified contacts (0.50), LinkedIn (0.20), platform age (0.20),
        connection count richness (0.10).

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        sig = candidate.redrob_signals
        evidence: List[str] = []
        score = 0.0

        # Verified touchpoints
        verified_count = sum([sig.verified_email, sig.verified_phone])
        score += 0.50 * (verified_count / 2.0)
        evidence.append(f"{'✅' if verified_count == 2 else '🟡'} {verified_count}/2 contact points verified.")

        # LinkedIn connection
        if sig.linkedin_connected:
            score += 0.20
            evidence.append("✅ LinkedIn identity linked.")
        else:
            evidence.append("⚪ LinkedIn not linked — lower identity confidence.")

        # Platform seniority
        platform_age_days = (_REFERENCE_DATE - sig.signup_date).days
        if platform_age_days >= _PLATFORM_SENIOR_DAYS:
            score += 0.20
            evidence.append(
                f"✅ Platform member for {platform_age_days} days — established account."
            )
        elif platform_age_days >= 90:
            score += 0.10
            evidence.append(
                f"🟡 Platform member for {platform_age_days} days — relatively new account."
            )
        else:
            evidence.append(
                f"🔴 Platform member for only {platform_age_days} days — very new account."
            )

        # Connection richness
        connections = min(1.0, sig.connection_count / _MAX_CONNECTIONS)
        score += 0.10 * connections
        evidence.append(f"{'✅' if connections > 0.5 else '🟡'} {sig.connection_count} platform connections.")

        return round(min(1.0, score), 4), evidence

    def calculate_profile_quality(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores profile richness: skills, endorsements, assessments, connections.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        sig = candidate.redrob_signals
        evidence: List[str] = []

        skill_score = min(1.0, len(candidate.skills) / _MAX_SKILLS)
        endorse_score = min(1.0, sig.endorsements_received / _MAX_ENDORSEMENTS)
        assess_score = min(1.0, len(sig.skill_assessment_scores) / _MAX_ASSESSMENTS)
        conn_score = min(1.0, sig.connection_count / _MAX_CONNECTIONS)

        quality = (
            0.35 * skill_score
            + 0.25 * endorse_score
            + 0.25 * assess_score
            + 0.15 * conn_score
        )

        evidence.append(f"Skills: {len(candidate.skills)} declared (score: {skill_score:.2f})")
        evidence.append(f"Endorsements: {sig.endorsements_received} received (score: {endorse_score:.2f})")
        evidence.append(f"Assessments: {len(sig.skill_assessment_scores)} completed (score: {assess_score:.2f})")
        evidence.append(f"Connections: {sig.connection_count} (score: {conn_score:.2f})")

        return round(min(1.0, quality), 4), evidence

    def detect_anomalies(self, candidate: Candidate) -> List[str]:
        """Scans candidate data for anomalous patterns.

        Returns a list of human-readable anomaly descriptions.
        Empty list means no anomalies detected.

        Note:
            This is informational, not disqualifying.  Anomalies reduce
            confidence but do not remove candidates from ranking.

        Args:
            candidate: Candidate aggregate.

        Returns:
            List[str]: Anomaly descriptions (empty if none).
        """
        anomalies: List[str] = []
        sig = candidate.redrob_signals

        # Anomaly 1: High response rate but very high response time (contradictory)
        if sig.recruiter_response_rate > 0.80 and sig.avg_response_time_hours > 72:
            anomalies.append(
                "⚠️ High response rate but very slow response time — data may reflect bulk auto-responses."
            )

        # Anomaly 2: Open to work but no applications
        if sig.open_to_work_flag and sig.applications_submitted_30d == 0:
            anomalies.append(
                "⚠️ Open To Work enabled but zero applications submitted — passive signal only."
            )

        # Anomaly 3: 100% interview completion but 0% offer acceptance
        if sig.interview_completion_rate > 0.95 and sig.offer_acceptance_rate == 0.0:
            anomalies.append(
                "⚠️ Perfect interview completion with zero offer acceptance — may be using processes for market research."
            )

        # Anomaly 4: Profile < 30% complete but many endorsements
        if sig.profile_completeness_score < 30 and sig.endorsements_received > 20:
            anomalies.append(
                "⚠️ Low profile completeness but many endorsements — profile may have been truncated after receiving endorsements."
            )

        return anomalies

    def calculate_trust(self, candidate: Candidate) -> Tuple[float, float]:
        """Computes composite trust score and confidence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float]: (trust_score, confidence) in [0,1].
        """
        comp, _ = self.calculate_profile_completeness(candidate)
        verif, _ = self.calculate_verification_score(candidate)
        consist, _ = self.validate_consistency(candidate)
        career, _ = self.calculate_career_consistency(candidate)
        identity, _ = self.calculate_identity_confidence(candidate)
        quality, _ = self.calculate_profile_quality(candidate)

        # consistency_score in TrustProfile is the average of both consistency measures
        consistency_avg = (consist + career) / 2.0

        composite = (
            self.WEIGHT_COMPLETENESS * comp
            + self.WEIGHT_VERIFICATION * verif
            + self.WEIGHT_CAREER_CONSISTENCY * consistency_avg
            + self.WEIGHT_IDENTITY * identity
            + self.WEIGHT_QUALITY * quality
        )

        non_zero = sum(1 for s in (comp, verif, consistency_avg, identity, quality) if s > 0.0)
        confidence = non_zero / 5.0

        return round(min(1.0, composite), 4), round(confidence, 4)

    def generate_profile(self, candidate: Candidate) -> TrustProfile:
        """Orchestrates all trust sub-calculations and returns a complete TrustProfile.

        This is the primary public interface consumed by RecruiterTrustService.

        Args:
            candidate: Candidate aggregate.

        Returns:
            TrustProfile: Fully populated trust assessment with anomaly evidence.
        """
        logger.debug("Running trust engine for candidate %s", candidate.candidate_id)

        comp, comp_ev = self.calculate_profile_completeness(candidate)
        verif, verif_ev = self.calculate_verification_score(candidate)
        consist, consist_ev = self.validate_consistency(candidate)
        career, career_ev = self.calculate_career_consistency(candidate)
        identity, identity_ev = self.calculate_identity_confidence(candidate)
        quality, quality_ev = self.calculate_profile_quality(candidate)

        consistency_avg = round((consist + career) / 2.0, 4)

        composite = (
            self.WEIGHT_COMPLETENESS * comp
            + self.WEIGHT_VERIFICATION * verif
            + self.WEIGHT_CAREER_CONSISTENCY * consistency_avg
            + self.WEIGHT_IDENTITY * identity
            + self.WEIGHT_QUALITY * quality
        )
        composite = round(min(1.0, max(0.0, composite)), 4)

        non_zero = sum(1 for s in (comp, verif, consistency_avg, identity, quality) if s > 0.0)
        confidence = round(non_zero / 5.0, 4)

        anomalies = self.detect_anomalies(candidate)

        all_evidence = (
            comp_ev
            + verif_ev
            + consist_ev
            + career_ev
            + identity_ev
            + quality_ev
            + anomalies
            + [f"📊 Composite trust_score = {composite:.3f} (confidence: {confidence:.2f})"]
        )

        logger.info(
            "Trust profile built for %s | score=%.3f | confidence=%.3f | anomalies=%d",
            candidate.candidate_id,
            composite,
            confidence,
            len(anomalies),
        )

        return TrustProfile(
            profile_completeness=comp,
            verification_score=verif,
            consistency_score=consistency_avg,
            career_consistency=career,
            identity_confidence=identity,
            profile_quality=quality,
            trust_score=composite,
            confidence=confidence,
            evidence=all_evidence,
        )
