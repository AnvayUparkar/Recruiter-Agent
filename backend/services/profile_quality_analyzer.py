"""Profile Quality Analyzer — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Is this profile written with the specificity and detail I need to
    pitch it confidently — or is it full of vague one-liners that tell me
    nothing?"  Quality measures *content depth and specificity*, not
    just presence of sections.

Signal Modeled:
    Detects the difference between weak documentation
    ("Worked on ML projects") and strong documentation
    ("Built recommendation system serving 2M users reducing churn by 18%").
    Uses keyword and structural heuristics — quantified metrics, action
    verbs, technical specificity, and word-count thresholds.

Phase 13 Ranking Usage:
    Returns ProfileQuality with ``quality_score`` feeding ReliabilityScoring
    (30% weight, highest component). Exported as ``quality_overall`` in
    the Phase 13 ranking feature vector.
"""

import logging
from typing import List, Tuple

from models.candidate import Candidate
from models.profile_quality import ProfileQuality
from services.profile_completeness import ProfileCompletenessAnalyzer

logger = logging.getLogger(__name__)

# ── Heuristic keyword sets ──────────────────────────────────────────────────
_QUANTIFIER_TERMS = {
    "million", "billion", "thousand", "users", "requests", "latency",
    "ms", "seconds", "tps", "rps", "qps", "accuracy", "precision",
    "recall", "f1", "%", "reduction", "improvement", "increased",
    "decreased", "saved", "generated", "processed",
}
_ACTION_VERBS = {
    "built", "designed", "developed", "led", "architected", "deployed",
    "shipped", "launched", "optimized", "reduced", "increased", "scaled",
    "migrated", "refactored", "automated", "implemented", "created",
    "delivered", "managed", "established", "integrated", "mentored",
}
_WEAK_PATTERNS = {
    "worked on", "helped with", "assisted in", "involved in",
    "responsible for", "part of team", "various", "etc",
}

_MIN_STRONG_DESCRIPTION_WORDS: int = 25
_SKILL_QUALITY_SATURATION: int = 20   # scores saturate at 20 skills


class ProfileQualityAnalyzer:
    """Analyzes the content depth and specificity of a candidate profile.

    Design philosophy:
        Quality is about signal richness.  A profile where every role
        description includes at least one quantified metric and two action
        verbs is dramatically more useful to a recruiter than a profile with
        one-liners.  This analyzer makes that distinction measurable.
    """

    def __init__(
        self,
        completeness_analyzer: ProfileCompletenessAnalyzer = None,
    ) -> None:
        """Initialises analyzer with optional completeness analyzer injection.

        Args:
            completeness_analyzer: Injected completeness analyzer instance.
        """
        self._completeness = completeness_analyzer or ProfileCompletenessAnalyzer()

    def _score_description_quality(
        self,
        description: str,
    ) -> float:
        """Scores a single text description for depth and specificity.

        Scoring criteria:
          - Word count ≥ 25: +0.30
          - Contains quantified metrics (numbers, %, etc.): +0.30
          - Contains action verbs: +0.25
          - Contains NO weak patterns: +0.15

        Args:
            description: Raw description text from a career role or project.

        Returns:
            float: Quality score in [0.0, 1.0].
        """
        if not description or not description.strip():
            return 0.0

        text_lower = description.lower()
        words = text_lower.split()
        score = 0.0

        # Word count threshold
        if len(words) >= _MIN_STRONG_DESCRIPTION_WORDS:
            score += 0.30
        elif len(words) >= 10:
            score += 0.15

        # Quantified metrics
        has_quantifiers = any(q in text_lower for q in _QUANTIFIER_TERMS)
        has_numbers = any(char.isdigit() for char in description)
        if has_quantifiers or has_numbers:
            score += 0.30

        # Action verbs
        has_action = any(verb in words for verb in _ACTION_VERBS)
        if has_action:
            score += 0.25

        # No weak patterns
        has_weak = any(pat in text_lower for pat in _WEAK_PATTERNS)
        if not has_weak:
            score += 0.15

        return round(min(1.0, score), 4)

    def _analyze_documentation_quality(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores overall documentation quality using profile summary.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        summary = candidate.profile.summary
        score = self._score_description_quality(summary)
        evidence: List[str] = []

        if score >= 0.70:
            evidence.append("✅ Professional summary is detailed and specific.")
        elif score >= 0.40:
            evidence.append("🟡 Professional summary is present but could be more specific.")
        elif score > 0.0:
            evidence.append(
                "🔴 Professional summary is vague — lacks quantified achievements or action verbs."
            )
        else:
            evidence.append("🔴 Professional summary is missing or empty.")

        return score, evidence

    def _analyze_career_detail_quality(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores average description quality across all career roles.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        history = candidate.career_history
        evidence: List[str] = []

        if not history:
            evidence.append("🔴 No career history to evaluate description quality.")
            return 0.0, evidence

        role_scores = [
            self._score_description_quality(role.description)
            for role in history
        ]
        avg_score = sum(role_scores) / len(role_scores)

        strong_roles = sum(1 for s in role_scores if s >= 0.70)
        weak_roles = sum(1 for s in role_scores if s < 0.30)

        if strong_roles == len(role_scores):
            evidence.append(
                f"✅ All {len(history)} roles have strong, specific descriptions."
            )
        elif strong_roles > 0:
            evidence.append(
                f"🟡 {strong_roles}/{len(history)} roles have detailed descriptions; "
                f"{weak_roles} role(s) have weak or missing descriptions."
            )
        else:
            evidence.append(
                f"🔴 Most role descriptions are vague or too brief "
                f"({weak_roles}/{len(history)} roles score below 0.30)."
            )

        return round(avg_score, 4), evidence

    def _analyze_skills_quality(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores skills section quality: breadth-depth balance.

        Penalises excessive skill lists without supporting experience.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        skills = candidate.skills
        evidence: List[str] = []

        if not skills:
            evidence.append("🔴 No skills listed on profile.")
            return 0.0, evidence

        count = len(skills)
        # Advanced/expert skills carry more weight
        advanced_count = sum(
            1 for s in skills
            if hasattr(s, "proficiency") and str(s.proficiency).lower() in ("advanced", "expert")
        )
        endorsed_count = sum(1 for s in skills if getattr(s, "endorsements", 0) > 0)

        # Base score: skill count normalised, penalised for extreme inflation
        if count <= _SKILL_QUALITY_SATURATION:
            base = count / _SKILL_QUALITY_SATURATION
        else:
            # Penalty for going beyond 40 without strong experience
            years_exp = candidate.total_years_experience
            if count > 40 and years_exp < 5:
                base = 0.40   # Suspicious inflation
                evidence.append(
                    f"🔴 {count} skills claimed with only {years_exp:.1f} years experience "
                    "— potential skill inflation."
                )
            else:
                base = 0.90

        # Boost for advanced/expert and endorsed skills
        quality_boost = min(0.20, (advanced_count / max(1, count)) * 0.15
                            + (endorsed_count / max(1, count)) * 0.05)

        score = min(1.0, base + quality_boost)

        if not any("inflation" in e for e in evidence):
            evidence.append(
                f"{'✅' if score >= 0.70 else '🟡'} Skills quality: {count} skills, "
                f"{advanced_count} advanced/expert, {endorsed_count} endorsed."
            )

        return round(score, 4), evidence

    def _analyze_profile_depth(
        self,
        candidate: Candidate,
    ) -> Tuple[float, List[str]]:
        """Scores total profile text richness across all sections.

        Args:
            candidate: Candidate aggregate.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        evidence: List[str] = []

        # Aggregate word count from all text fields
        total_words = len(candidate.profile.summary.split())
        total_words += sum(
            len(role.description.split()) for role in candidate.career_history
        )
        total_words += len(candidate.skills) * 2  # Skills contribute shallowly

        # Saturate at 1000 words of total profile text
        score = min(1.0, total_words / 500.0)

        if total_words < 50:
            evidence.append(f"🔴 Very sparse profile: ~{total_words} total words across all sections.")
        elif total_words < 150:
            evidence.append(f"🟡 Shallow profile: ~{total_words} total words across all sections.")
        else:
            evidence.append(f"✅ Profile has good text depth: ~{total_words} words.")

        return round(score, 4), evidence

    def _analyze_profile_strength(
        self,
        candidate: Candidate,
        completeness_score: float,
        depth_score: float,
    ) -> Tuple[float, List[str]]:
        """Computes overall profile strength combining completeness and depth signals.

        Args:
            candidate: Candidate aggregate.
            completeness_score: Pre-computed completeness sub-score.
            depth_score: Pre-computed depth sub-score.

        Returns:
            Tuple[float, List[str]]: (score in [0,1], evidence list).
        """
        evidence: List[str] = []
        sig = candidate.redrob_signals

        # Platform credibility signals
        endorsement_boost = min(0.10, sig.endorsements_received / 200.0)
        connection_boost = min(0.10, sig.connection_count / 1000.0)
        assessment_boost = min(0.10, len(sig.skill_assessment_scores) / 10.0)

        strength = (
            0.50 * completeness_score
            + 0.30 * depth_score
            + endorsement_boost
            + connection_boost
            + assessment_boost
        )

        evidence.append(
            f"{'✅' if strength >= 0.70 else '🟡'} Profile strength: "
            f"completeness={completeness_score:.2f}, depth={depth_score:.2f}, "
            f"endorsements={sig.endorsements_received}, connections={sig.connection_count}."
        )

        return round(min(1.0, strength), 4), evidence

    def analyze_quality(
        self,
        candidate: Candidate,
    ) -> ProfileQuality:
        """Orchestrates all quality sub-analyses and returns a complete ProfileQuality.

        This is the primary public interface consumed by TrustworthinessService.

        Args:
            candidate: Candidate aggregate.

        Returns:
            ProfileQuality: Fully populated quality assessment.
        """
        logger.debug("Analyzing profile quality for %s", candidate.candidate_id)

        # Completeness (reuse from completeness analyzer)
        completeness_report = self._completeness.generate_report(candidate)
        completeness_score = completeness_report["overall"]
        completeness_evidence = completeness_report["evidence"]

        # Quality dimensions
        depth_score, depth_ev = self._analyze_profile_depth(candidate)
        doc_score, doc_ev = self._analyze_documentation_quality(candidate)
        career_score, career_ev = self._analyze_career_detail_quality(candidate)
        skills_score, skills_ev = self._analyze_skills_quality(candidate)
        strength_score, strength_ev = self._analyze_profile_strength(
            candidate, completeness_score, depth_score
        )

        # Composite quality score
        composite = (
            0.20 * completeness_score
            + 0.15 * depth_score
            + 0.25 * doc_score
            + 0.20 * career_score
            + 0.15 * skills_score
            + 0.05 * strength_score
        )
        composite = round(min(1.0, max(0.0, composite)), 4)

        active_dims = [completeness_score, depth_score, doc_score, career_score, skills_score]
        confidence = round(sum(1 for s in active_dims if s > 0.0) / len(active_dims), 4)

        all_evidence = (
            completeness_evidence
            + depth_ev
            + doc_ev
            + career_ev
            + skills_ev
            + strength_ev
            + [f"📊 quality_score = {composite:.3f} (confidence: {confidence:.2f})"]
        )

        logger.info(
            "Quality profile built for %s | score=%.3f | confidence=%.3f",
            candidate.candidate_id,
            composite,
            confidence,
        )

        return ProfileQuality(
            candidate_id=candidate.candidate_id,
            profile_completeness=completeness_score,
            profile_depth=depth_score,
            profile_strength=strength_score,
            documentation_quality=doc_score,
            career_detail_quality=career_score,
            skills_quality=skills_score,
            quality_score=composite,
            confidence=confidence,
            evidence=all_evidence,
        )

    def quality_score(self, candidate: Candidate) -> float:
        """Convenience method returning only the composite quality score.

        Args:
            candidate: Candidate aggregate.

        Returns:
            float: Composite quality score in [0.0, 1.0].
        """
        return self.analyze_quality(candidate).quality_score
