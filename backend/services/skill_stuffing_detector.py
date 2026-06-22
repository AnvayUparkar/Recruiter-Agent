"""Skill Stuffing Detector — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Is this candidate padding their profile with dozens of skills to
    game keyword searches, or are these skills genuinely supported by
    their career experience?"  Skill stuffing is one of the most
    common forms of profile inflation on professional networks.

Signal Modeled:
    Detects skill inflation through three lenses:
      1. Volume check: raw skill count vs. years of experience ratio
      2. Support check: what fraction of skills appear in job descriptions?
      3. Evidence check: are claimed skills backed by assessments/endorsements?

Phase 13 Ranking Usage:
    Returns ``skill_stuffing_risk`` to FraudProfile (one of five risk
    dimensions). Exported as ``fraud_skill_stuffing`` in Phase 13 feature
    vector. High stuffing risk reduces reliability_score via fraud_penalty.
"""

import logging
from typing import List, Set, Tuple

from models.candidate import Candidate

logger = logging.getLogger(__name__)

# ── Thresholds ──────────────────────────────────────────────────────────────
_MAX_SKILLS_PER_YEAR: float = 5.0    # >5 new skills/year is suspicious
_HIGH_STUFFING_COUNT: int = 40       # raw count threshold
_MEDIUM_STUFFING_COUNT: int = 25
_MIN_SUPPORT_RATIO: float = 0.50     # <50% skill-to-description coverage = risk
_ENDORSEMENT_THRESHOLD: int = 5      # endorsed skills are more credible


class SkillStuffingDetector:
    """Detects unrealistic skill inflation in candidate profiles.

    Design philosophy:
        A candidate with 6 years of experience listing 50 advanced skills
        is almost certainly stuffing.  The detector uses the ratio of
        skills-to-experience-years as the primary signal, then cross-
        references skill names against role descriptions as supporting
        evidence.
    """

    def _extract_description_text(self, candidate: Candidate) -> str:
        """Aggregates all career description text for skill cross-referencing.

        Args:
            candidate: Candidate aggregate.

        Returns:
            str: Lowercased combined text of all role descriptions.
        """
        texts = [
            role.description.lower()
            for role in candidate.career_history
            if role.description
        ]
        return " ".join(texts)

    def _get_skill_names_lower(self, candidate: Candidate) -> Set[str]:
        """Returns a set of lowercased skill names.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Set[str]: Lowercased skill name set.
        """
        return {s.name.lower() for s in candidate.skills}

    def _check_volume_ratio(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks if skill count is proportional to years of experience.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (risk in [0,1], evidence list).
        """
        skill_count = len(candidate.skills)
        years_exp = max(0.5, candidate.total_years_experience)  # avoid div/0
        ratio = skill_count / years_exp
        evidence: List[str] = []

        if skill_count >= _HIGH_STUFFING_COUNT:
            risk = min(1.0, (skill_count - _HIGH_STUFFING_COUNT) / 20.0 + 0.60)
            evidence.append(
                f"🔴 Very high skill count: {skill_count} skills for {years_exp:.1f} years "
                f"exp ({ratio:.1f} skills/year — threshold: ≤{_MAX_SKILLS_PER_YEAR:.0f})."
            )
        elif skill_count >= _MEDIUM_STUFFING_COUNT:
            risk = 0.35
            evidence.append(
                f"🟡 Elevated skill count: {skill_count} skills for {years_exp:.1f} years "
                f"exp ({ratio:.1f} skills/year)."
            )
        elif ratio > _MAX_SKILLS_PER_YEAR:
            risk = 0.20
            evidence.append(
                f"🟡 Skill-to-experience ratio slightly elevated: "
                f"{skill_count} skills / {years_exp:.1f} years = {ratio:.1f}."
            )
        else:
            risk = 0.0
            evidence.append(
                f"✅ Skill count ({skill_count}) is proportional to "
                f"{years_exp:.1f} years of experience ({ratio:.1f} skills/year)."
            )

        return round(min(1.0, risk), 4), evidence

    def _check_description_support(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks what fraction of claimed skills appear in role descriptions.

        A skill claimed but never mentioned in any job description has
        no supporting evidence and contributes to stuffing risk.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (risk in [0,1], evidence list).
        """
        skills = candidate.skills
        evidence: List[str] = []

        if not skills:
            evidence.append("⚪ No skills to cross-reference against descriptions.")
            return 0.0, evidence

        desc_text = self._extract_description_text(candidate)
        if not desc_text:
            # No descriptions at all — all skills are unsupported
            evidence.append(
                f"🔴 {len(skills)} skills claimed but zero career descriptions to support them."
            )
            return 0.80, evidence

        skill_names = self._get_skill_names_lower(candidate)
        supported = {name for name in skill_names if name in desc_text}
        unsupported = skill_names - supported
        support_ratio = len(supported) / len(skill_names)

        if support_ratio < _MIN_SUPPORT_RATIO:
            risk = 1.0 - support_ratio
            evidence.append(
                f"🔴 Only {len(supported)}/{len(skill_names)} skills appear in "
                f"career descriptions ({support_ratio:.0%} support rate)."
            )
            if unsupported:
                # Show first 5 unsupported skills as examples
                sample = list(unsupported)[:5]
                evidence.append(
                    f"Unsupported skills (sample): {', '.join(sample)}."
                )
        elif support_ratio < 0.75:
            risk = 0.20
            evidence.append(
                f"🟡 {len(supported)}/{len(skill_names)} skills supported by descriptions "
                f"({support_ratio:.0%} support rate)."
            )
        else:
            risk = 0.0
            evidence.append(
                f"✅ {support_ratio:.0%} of skills are mentioned in career descriptions."
            )

        return round(min(1.0, max(0.0, risk)), 4), evidence

    def _check_assessment_endorsement_coverage(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks what fraction of skills have endorsements or assessments.

        Endorsed or assessed skills are dramatically more credible than
        self-claimed skills without any validation.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (risk reduction bonus in [0,1], evidence list).
        """
        skills = candidate.skills
        evidence: List[str] = []

        if not skills:
            return 0.0, ["⚪ No skills to evaluate for endorsement coverage."]

        endorsed = sum(
            1 for s in skills
            if getattr(s, "endorsements", 0) >= _ENDORSEMENT_THRESHOLD
        )
        assessed_names = {
            name.lower()
            for name in candidate.redrob_signals.skill_assessment_scores
        }
        skill_names_lower = self._get_skill_names_lower(candidate)
        assessed_overlap = skill_names_lower & assessed_names

        total_validated = len({s.name.lower() for s in skills
                               if getattr(s, "endorsements", 0) >= _ENDORSEMENT_THRESHOLD
                               or s.name.lower() in assessed_names})

        validation_ratio = total_validated / len(skills)
        # Higher validation ratio = LOWER stuffing risk (this is a risk reducer)
        risk_reduction = validation_ratio * 0.30  # up to 0.30 reduction

        evidence.append(
            f"{'✅' if validation_ratio > 0.30 else '🟡'} "
            f"{total_validated}/{len(skills)} skills validated by endorsements "
            f"or platform assessments ({validation_ratio:.0%})."
        )

        return round(risk_reduction, 4), evidence

    def calculate_risk(
        self,
        candidate: Candidate,
    ) -> Tuple[float, float]:
        """Computes composite skill-stuffing risk and confidence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float]: (risk_score, confidence) in [0,1].
        """
        volume_risk, _ = self._check_volume_ratio(candidate)
        support_risk, _ = self._check_description_support(candidate)
        risk_reduction, _ = self._check_assessment_endorsement_coverage(candidate)

        # Combined risk: volume + description gap, reduced by validation
        raw_risk = (0.45 * volume_risk + 0.55 * support_risk) - risk_reduction
        final_risk = round(min(1.0, max(0.0, raw_risk)), 4)

        # Confidence: based on whether we had descriptions to check
        desc_text = self._extract_description_text(candidate)
        confidence = 0.80 if desc_text else 0.40

        return final_risk, round(confidence, 4)

    def detect_stuffing(
        self,
        candidate: Candidate,
    ) -> Tuple[float, float, List[str]]:
        """Full skill-stuffing detection returning risk, confidence, and evidence.

        This is the primary interface consumed by FraudDetector.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float, List[str]]: (risk, confidence, evidence).
        """
        logger.debug("Running skill stuffing detection for %s", candidate.candidate_id)

        volume_risk, volume_ev = self._check_volume_ratio(candidate)
        support_risk, support_ev = self._check_description_support(candidate)
        risk_reduction, reduction_ev = self._check_assessment_endorsement_coverage(candidate)

        raw_risk = (0.45 * volume_risk + 0.55 * support_risk) - risk_reduction
        final_risk = round(min(1.0, max(0.0, raw_risk)), 4)

        desc_text = self._extract_description_text(candidate)
        confidence = round(0.80 if desc_text else 0.40, 4)

        all_evidence = (
            volume_ev + support_ev + reduction_ev
            + [f"📊 skill_stuffing_risk = {final_risk:.3f} (confidence: {confidence:.2f})"]
        )

        logger.info(
            "Skill stuffing detection for %s | risk=%.3f | confidence=%.3f",
            candidate.candidate_id,
            final_risk,
            confidence,
        )

        return final_risk, confidence, all_evidence
