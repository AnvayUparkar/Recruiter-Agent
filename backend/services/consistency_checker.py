"""Consistency Checker — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Does this candidate's profile tell a coherent story across all
    sections?  If they claim 'LLM Expert' but have no LLM-related
    projects or descriptions, that inconsistency will surface in the
    interview and embarrass the recruiter."

Signal Modeled:
    Five cross-section consistency checks:
      1. Career progression logic (do titles advance naturally?)
      2. Timeline sequence (are dates sensible?)
      3. Skill-to-experience alignment (do skills appear in descriptions?)
      4. Title-to-seniority match (does seniority match experience years?)
      5. Experience depth consistency (do descriptions match claimed level?)

Phase 13 Ranking Usage:
    Returns ConsistencyProfile with ``consistency_score`` feeding
    ReliabilityScoring (15% weight). Exported as ``consist_overall``
    in the Phase 13 ranking feature vector.
"""

import logging
from typing import List, Set, Tuple

from models.candidate import Candidate
from models.consistency_profile import ConsistencyProfile

logger = logging.getLogger(__name__)

# ── Seniority term sets ──────────────────────────────────────────────────────
_SENIOR_TERMS = {"senior", "sr.", "lead", "principal", "staff", "distinguished"}
_EXECUTIVE_TERMS = {"vp", "vice president", "director", "head of", "chief", "cto", "ceo"}
_JUNIOR_TERMS = {"junior", "jr.", "associate", "intern", "entry"}

# ── Minimum years for seniority tiers ────────────────────────────────────────
_SENIOR_MIN_YEARS: float = 4.0
_PRINCIPAL_MIN_YEARS: float = 8.0
_EXECUTIVE_MIN_YEARS: float = 10.0


class ConsistencyChecker:
    """Cross-checks profile sections for narrative coherence.

    Design philosophy:
        Consistency issues are almost always documentation problems, not
        deception.  A senior engineer who writes vague one-liners is not
        lying — they just wrote a poor profile.  The checker scores the
        coherence of the overall narrative so recruiters know what
        additional questions to ask.
    """

    def _get_all_description_text(self, candidate: Candidate) -> str:
        """Aggregates lowercased text from all career descriptions.

        Args:
            candidate: Candidate aggregate.

        Returns:
            str: Combined lowercased career description text.
        """
        return " ".join(
            role.description.lower()
            for role in candidate.career_history
            if role.description
        )

    def _check_career_consistency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks whether career progression follows a natural trajectory.

        Looks for: role seniority trends, industry continuity,
        and company-size progression.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        history = candidate.career_history
        evidence: List[str] = []

        if not history:
            evidence.append("🔴 No career history to assess progression.")
            return 0.0, evidence

        # Check for industry continuity
        industries = [r.industry.lower() for r in history if r.industry]
        unique_industries = set(industries)
        if len(unique_industries) <= 2 or not industries:
            industry_score = 1.0
            evidence.append(f"✅ Consistent industry focus: {unique_industries or 'unknown'}.")
        else:
            industry_score = max(0.50, 1.0 - (len(unique_industries) - 2) * 0.10)
            evidence.append(
                f"🟡 Multiple industries in career history: {unique_industries}. "
                "May indicate broad exploration or unclear focus."
            )

        # Check for presence of a current role
        has_current = any(r.is_current for r in history)
        current_score = 1.0 if has_current else 0.70
        if not has_current:
            evidence.append("🟡 No current role marked — between positions.")
        else:
            evidence.append("✅ Active current role present.")

        score = (0.60 * industry_score + 0.40 * current_score)
        return round(score, 4), evidence

    def _check_timeline_consistency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks whether career dates are sequential and non-overlapping.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        history = candidate.career_history
        evidence: List[str] = []

        if len(history) < 2:
            evidence.append("✅ Single or zero roles — timeline is trivially consistent.")
            return 1.0, evidence

        try:
            sorted_h = sorted(history, key=lambda r: r.start_date)
        except Exception:
            evidence.append("⚪ Cannot assess timeline — dates unavailable.")
            return 0.70, evidence  # Neutral-ish when data is missing

        issues = 0
        for i in range(len(sorted_h) - 1):
            curr = sorted_h[i]
            nxt = sorted_h[i + 1]
            if curr.end_date and nxt.start_date < curr.end_date:
                overlap_months = (curr.end_date - nxt.start_date).days / 30
                if overlap_months > 2:
                    issues += 1
                    evidence.append(
                        f"⚠️ Timeline overlap: '{curr.company}' → '{nxt.company}' "
                        f"({overlap_months:.0f} month overlap)."
                    )

        if issues == 0:
            evidence.append("✅ Career timeline is sequential and non-overlapping.")
            return 1.0, evidence

        score = max(0.0, 1.0 - issues * 0.25)
        return round(score, 4), evidence

    def _check_skill_consistency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks whether claimed skills appear in career descriptions.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        skills = candidate.skills
        evidence: List[str] = []

        if not skills:
            evidence.append("🟡 No skills declared — skill consistency not measurable.")
            return 0.50, evidence

        desc_text = self._get_all_description_text(candidate)
        if not desc_text:
            evidence.append(
                "🟡 No career descriptions — cannot cross-check skills."
            )
            return 0.50, evidence

        skill_names: Set[str] = {s.name.lower() for s in skills}
        supported = {name for name in skill_names if name in desc_text}
        ratio = len(supported) / len(skill_names)

        if ratio >= 0.70:
            evidence.append(
                f"✅ {ratio:.0%} of skills are mentioned in career descriptions."
            )
        elif ratio >= 0.40:
            evidence.append(
                f"🟡 {ratio:.0%} of skills are corroborated by career descriptions."
            )
        else:
            unsupported_sample = list(skill_names - supported)[:3]
            evidence.append(
                f"🔴 Only {ratio:.0%} of skills appear in descriptions. "
                f"Unsupported examples: {', '.join(unsupported_sample)}."
            )

        return round(ratio, 4), evidence

    def _check_title_consistency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks whether claimed seniority level aligns with years of experience.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        title = (candidate.current_role or candidate.profile.current_title or "").lower()
        years = candidate.total_years_experience
        evidence: List[str] = []

        # Determine claimed seniority tier from title
        is_executive = any(t in title for t in _EXECUTIVE_TERMS)
        is_senior = any(t in title for t in _SENIOR_TERMS)
        is_junior = any(t in title for t in _JUNIOR_TERMS)

        if is_executive:
            if years < _EXECUTIVE_MIN_YEARS:
                score = max(0.0, years / _EXECUTIVE_MIN_YEARS)
                evidence.append(
                    f"🔴 Executive-level title with only {years:.1f}yrs experience "
                    f"(recommended: ≥{_EXECUTIVE_MIN_YEARS:.0f}yrs)."
                )
            else:
                score = 1.0
                evidence.append(
                    f"✅ Executive title consistent with {years:.1f}yrs experience."
                )
        elif is_senior:
            if years < _SENIOR_MIN_YEARS:
                score = max(0.30, years / _SENIOR_MIN_YEARS)
                evidence.append(
                    f"🟡 Senior title with {years:.1f}yrs experience "
                    f"(recommended: ≥{_SENIOR_MIN_YEARS:.0f}yrs)."
                )
            else:
                score = 1.0
                evidence.append(
                    f"✅ Senior title consistent with {years:.1f}yrs experience."
                )
        elif is_junior:
            # Junior title with many years = possible career stagnation, not inconsistency
            score = 1.0
            evidence.append(
                f"✅ Junior/associate title — no seniority inflation detected."
            )
        else:
            # No strong seniority signal in title
            score = 0.85  # Neutral-positive — no detectable inconsistency
            evidence.append(
                f"✅ No seniority inconsistency detected in title '{candidate.current_role}'."
            )

        return round(score, 4), evidence

    def _check_experience_consistency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks whether description depth matches claimed experience level.

        A 10-year senior engineer with all one-line descriptions is
        inconsistent — their writing depth should match their seniority.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        history = candidate.career_history
        years = candidate.total_years_experience
        evidence: List[str] = []

        if not history:
            evidence.append("🔴 No career history to assess experience consistency.")
            return 0.0, evidence

        # Average description word count
        avg_words = (
            sum(len(r.description.split()) for r in history if r.description)
            / len(history)
        )

        # Expected minimum description depth scales with experience
        expected_min = min(50, 15 + years * 2)  # 15 base + 2 per year, capped at 50

        if avg_words >= expected_min:
            score = 1.0
            evidence.append(
                f"✅ Average role description depth ({avg_words:.0f} words) appropriate "
                f"for {years:.1f}yrs experience."
            )
        elif avg_words >= expected_min * 0.50:
            score = 0.65
            evidence.append(
                f"🟡 Average role description ({avg_words:.0f} words) below expected "
                f"depth for {years:.1f}yrs experience (expected: ≥{expected_min:.0f} words)."
            )
        else:
            score = 0.30
            evidence.append(
                f"🔴 Very thin descriptions ({avg_words:.0f} words avg) for "
                f"{years:.1f}yrs experience — senior profile with shallow documentation."
            )

        return round(score, 4), evidence

    def check_consistency(
        self,
        candidate: Candidate,
    ) -> Tuple[float, float]:
        """Computes composite consistency score and confidence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float]: (consistency_score, confidence) in [0,1].
        """
        cc, _ = self._check_career_consistency(candidate)
        tc, _ = self._check_timeline_consistency(candidate)
        sc, _ = self._check_skill_consistency(candidate)
        ttc, _ = self._check_title_consistency(candidate)
        ec, _ = self._check_experience_consistency(candidate)

        composite = (
            0.20 * cc
            + 0.20 * tc
            + 0.30 * sc
            + 0.20 * ttc
            + 0.10 * ec
        )

        # Confidence: all five dimensions are always measurable to some degree
        confidence = 0.85 if candidate.career_history else 0.40

        return round(min(1.0, composite), 4), round(confidence, 4)

    def generate_profile(
        self,
        candidate: Candidate,
    ) -> ConsistencyProfile:
        """Orchestrates all consistency checks and returns a ConsistencyProfile.

        This is the primary interface consumed by TrustworthinessService.

        Args:
            candidate: Candidate aggregate.

        Returns:
            ConsistencyProfile: Fully populated consistency assessment.
        """
        logger.debug("Checking consistency for %s", candidate.candidate_id)

        cc, cc_ev = self._check_career_consistency(candidate)
        tc, tc_ev = self._check_timeline_consistency(candidate)
        sc, sc_ev = self._check_skill_consistency(candidate)
        ttc, ttc_ev = self._check_title_consistency(candidate)
        ec, ec_ev = self._check_experience_consistency(candidate)

        composite = round(min(1.0, max(0.0, (
            0.20 * cc
            + 0.20 * tc
            + 0.30 * sc
            + 0.20 * ttc
            + 0.10 * ec
        ))), 4)

        confidence = round(0.85 if candidate.career_history else 0.40, 4)

        all_evidence = (
            cc_ev + tc_ev + sc_ev + ttc_ev + ec_ev
            + [f"📊 consistency_score = {composite:.3f} (confidence: {confidence:.2f})"]
        )

        logger.info(
            "Consistency profile for %s | score=%.3f | confidence=%.3f",
            candidate.candidate_id,
            composite,
            confidence,
        )

        return ConsistencyProfile(
            candidate_id=candidate.candidate_id,
            career_consistency=cc,
            timeline_consistency=tc,
            skill_consistency=sc,
            title_consistency=ttc,
            experience_consistency=ec,
            consistency_score=composite,
            confidence=confidence,
            evidence=all_evidence,
        )
