"""Profile Completeness Analyzer — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Can I even evaluate this candidate, or is the profile so sparse that
    I'm flying blind?"  Completeness is the foundation of quality — a
    profile missing summary, skills, or experience descriptions cannot be
    assessed on merit.

Signal Modeled:
    Six completeness dimensions — professional summary (context),
    skills section (technical match surface), career experience
    (employment proof), education (credential context), career
    descriptions (detail depth), and role specificity (meaningful
    descriptions vs. empty entries).

Phase 13 Ranking Usage:
    Contributes ``profile_completeness`` to ProfileQuality.quality_score
    (30% weight) which feeds ReliabilityScoring. Exported as
    ``quality_completeness`` in the Phase 13 ranking feature vector.
"""

import logging
from typing import Dict, List, Tuple

from models.candidate import Candidate

logger = logging.getLogger(__name__)

# ── Configurable thresholds ─────────────────────────────────────────────────
_MIN_SUMMARY_WORDS: int = 20         # summary needs at least 20 words
_MIN_SKILLS: int = 3                 # at least 3 skills expected
_MIN_EXPERIENCE_ROLES: int = 1       # at least 1 role required
_MIN_DESCRIPTION_WORDS: int = 15     # each role needs 15+ word description
_MIN_DESCRIPTION_LENGTH: int = 60    # each role needs 60+ chars


class ProfileCompletenessAnalyzer:
    """Analyzes the presence and density of profile sections.

    Design philosophy:
        Completeness is binary at the section level (present/absent) and
        continuous at the quality level (how much detail?).  This analyzer
        focuses on the binary/presence layer.  ProfileQualityAnalyzer
        handles the depth/content layer.
    """

    def _check_summary(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks professional summary presence and length.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        summary = candidate.profile.summary.strip()
        evidence: List[str] = []

        if not summary:
            evidence.append("🔴 No professional summary found.")
            return 0.0, evidence

        word_count = len(summary.split())
        if word_count < _MIN_SUMMARY_WORDS:
            score = 0.50
            evidence.append(
                f"🟡 Summary present but very brief: {word_count} words "
                f"(recommended: ≥{_MIN_SUMMARY_WORDS})."
            )
        else:
            score = 1.0
            evidence.append(f"✅ Professional summary present: {word_count} words.")

        return round(score, 4), evidence

    def _check_skills(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks skills section presence and minimum depth.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        skill_count = len(candidate.skills)
        evidence: List[str] = []

        if skill_count == 0:
            evidence.append("🔴 No skills listed on profile.")
            return 0.0, evidence
        elif skill_count < _MIN_SKILLS:
            score = 0.40
            evidence.append(
                f"🟡 Very few skills listed: {skill_count} "
                f"(recommended: ≥{_MIN_SKILLS})."
            )
        else:
            score = min(1.0, skill_count / 15.0)   # saturates at 15 skills
            evidence.append(f"✅ Skills section populated: {skill_count} skills declared.")

        return round(score, 4), evidence

    def _check_experience(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks career history presence and role count.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        role_count = len(candidate.career_history)
        evidence: List[str] = []

        if role_count == 0:
            evidence.append("🔴 No career history found.")
            return 0.0, evidence
        elif role_count < _MIN_EXPERIENCE_ROLES:
            score = 0.50
            evidence.append(f"🟡 Only {role_count} role(s) found — limited career history.")
        else:
            score = min(1.0, role_count / 5.0)   # saturates at 5 roles
            evidence.append(f"✅ Career history present: {role_count} role(s).")

        return round(score, 4), evidence

    def _check_education(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks education section presence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        edu_count = len(candidate.education)
        evidence: List[str] = []

        if edu_count == 0:
            score = 0.0
            evidence.append("🟡 No education history listed (may be intentional).")
        else:
            score = 1.0
            evidence.append(f"✅ Education section present: {edu_count} credential(s).")

        return round(score, 4), evidence

    def _check_career_descriptions(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Checks the proportion of career roles with meaningful descriptions.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        history = candidate.career_history
        evidence: List[str] = []

        if not history:
            evidence.append("🔴 No career history to check descriptions for.")
            return 0.0, evidence

        described = [
            r for r in history
            if r.description
            and len(r.description.strip()) >= _MIN_DESCRIPTION_LENGTH
        ]
        ratio = len(described) / len(history)
        score = ratio

        if ratio == 1.0:
            evidence.append(
                f"✅ All {len(history)} role(s) have detailed descriptions."
            )
        elif ratio >= 0.5:
            evidence.append(
                f"🟡 {len(described)}/{len(history)} roles have adequate descriptions."
            )
        else:
            evidence.append(
                f"🔴 Only {len(described)}/{len(history)} roles have descriptions "
                f"≥{_MIN_DESCRIPTION_LENGTH} characters."
            )

        return round(score, 4), evidence

    def _check_missing_fields(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scans for important missing profile fields.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (completeness ratio in [0,1], evidence list).
        """
        evidence: List[str] = []
        missing: List[str] = []

        if not candidate.profile.summary.strip():
            missing.append("summary")
        if not candidate.skills:
            missing.append("skills")
        if not candidate.career_history:
            missing.append("career history")
        if not candidate.education:
            missing.append("education")
        if not candidate.certifications:
            missing.append("certifications")
        if not candidate.languages:
            missing.append("languages")

        total_sections = 6
        present = total_sections - len(missing)
        score = present / total_sections

        if missing:
            evidence.append(
                f"🟡 Missing profile sections: {', '.join(missing)}."
            )
        else:
            evidence.append("✅ All expected profile sections are populated.")

        return round(score, 4), evidence

    def calculate_completeness(
        self,
        candidate: Candidate,
    ) -> Tuple[float, float]:
        """Computes the composite completeness score and confidence.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, float]: (completeness_score, confidence) in [0,1].
        """
        summary_score, _ = self._check_summary(candidate)
        skills_score, _ = self._check_skills(candidate)
        exp_score, _ = self._check_experience(candidate)
        edu_score, _ = self._check_education(candidate)
        desc_score, _ = self._check_career_descriptions(candidate)
        fields_score, _ = self._check_missing_fields(candidate)

        composite = (
            0.20 * summary_score
            + 0.20 * skills_score
            + 0.25 * exp_score
            + 0.15 * edu_score
            + 0.15 * desc_score
            + 0.05 * fields_score
        )

        non_zero = sum(
            1 for s in (summary_score, skills_score, exp_score, edu_score, desc_score)
            if s > 0.0
        )
        confidence = non_zero / 5.0

        return round(min(1.0, composite), 4), round(confidence, 4)

    def generate_report(
        self,
        candidate: Candidate,
    ) -> Dict[str, object]:
        """Generates a detailed completeness report for a candidate.

        Args:
            candidate: Candidate aggregate.

        Returns:
            dict: {sub_dimension: (score, evidence)} mapping.
        """
        logger.debug("Generating completeness report for %s", candidate.candidate_id)

        summary_s, summary_ev = self._check_summary(candidate)
        skills_s, skills_ev = self._check_skills(candidate)
        exp_s, exp_ev = self._check_experience(candidate)
        edu_s, edu_ev = self._check_education(candidate)
        desc_s, desc_ev = self._check_career_descriptions(candidate)
        fields_s, fields_ev = self._check_missing_fields(candidate)

        composite = round(min(1.0, (
            0.20 * summary_s
            + 0.20 * skills_s
            + 0.25 * exp_s
            + 0.15 * edu_s
            + 0.15 * desc_s
            + 0.05 * fields_s
        )), 4)

        all_evidence = (
            summary_ev + skills_ev + exp_ev
            + edu_ev + desc_ev + fields_ev
            + [f"📊 profile_completeness = {composite:.3f}"]
        )

        logger.info(
            "Completeness report for %s | score=%.3f",
            candidate.candidate_id,
            composite,
        )

        return {
            "candidate_id":     candidate.candidate_id,
            "summary":          summary_s,
            "skills":           skills_s,
            "experience":       exp_s,
            "education":        edu_s,
            "descriptions":     desc_s,
            "fields":           fields_s,
            "overall":          composite,
            "evidence":         all_evidence,
        }
