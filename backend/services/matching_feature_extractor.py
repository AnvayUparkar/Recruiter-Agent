"""Matching Feature Extractor service.

Extracts JD-aware candidate-to-role alignment signals for a specific
(Candidate, ParsedJD) pair.

Why it exists:
  All other extractors describe the candidate in isolation.
  This extractor answers: "Is *this* candidate right for *this* job?"
  It consumes the HybridCandidate retrieval scores (semantic similarity,
  BM25 coverage) AND re-derives higher-level signals from the ParsedJD
  requirements.

Ranking dependency:
  Produces MatchingFeatures. Matching group has 15% weight in ranking.
  skill_coverage_score and semantic_alignment_score are among the
  strongest individual ranking predictors.
"""

from typing import List, Optional, Set, Tuple
from models.candidate import Candidate
from models.candidate_profile import CandidateProfile
from models.hybrid_candidate import HybridCandidate
from models.matching_features import MatchingFeatures
from models.parsed_jd import ParsedJD
from utils.logger import get_logger

logger = get_logger(__name__)


class MatchingFeatureExtractor:
    """Extracts JD-aware MatchingFeatures from a (Candidate, ParsedJD) pair."""

    # ── Skill Coverage ─────────────────────────────────────────────────────────

    @staticmethod
    def _get_candidate_skill_names(candidate: Candidate) -> Set[str]:
        """Returns the set of lowercased skill names for a candidate."""
        return {s.name.lower() for s in candidate.skills}

    @staticmethod
    def _get_jd_required_skills(parsed_jd: ParsedJD) -> Set[str]:
        """Returns must-have requirement names from the JD."""
        return {r.name.lower() for r in parsed_jd.must_have}

    def calculate_skill_coverage(
        self, candidate: Candidate, parsed_jd: ParsedJD
    ) -> float:
        """Fraction of JD must-have skills present in candidate's skill set.

        Args:
            candidate:  Raw Candidate record.
            parsed_jd:  Parsed job description.

        Returns:
            float: Coverage score in [0.0, 1.0].
        """
        required = self._get_jd_required_skills(parsed_jd)
        if not required:
            return 0.0
        candidate_skills = self._get_candidate_skill_names(candidate)
        matched = required & candidate_skills
        return round(len(matched) / len(required), 4)

    def calculate_keyword_coverage(
        self, hybrid_candidate: Optional[HybridCandidate]
    ) -> float:
        """BM25 lexical keyword coverage from the retrieval phase.

        Uses the coverage_score already computed on HybridCandidate if available.
        Falls back to 0.0.

        Args:
            hybrid_candidate: HybridCandidate from Phase 9, or None.

        Returns:
            float: Keyword coverage in [0.0, 1.0].
        """
        if hybrid_candidate is None:
            return 0.0
        return round(hybrid_candidate.coverage_score, 4)

    def calculate_semantic_alignment(
        self, hybrid_candidate: Optional[HybridCandidate]
    ) -> float:
        """Cosine similarity-based semantic alignment from FAISS retrieval.

        Maps similarity_score from [-1, 1] to [0, 1].

        Args:
            hybrid_candidate: HybridCandidate from Phase 9, or None.

        Returns:
            float: Semantic alignment score in [0.0, 1.0].
        """
        if hybrid_candidate is None or hybrid_candidate.semantic_result is None:
            return 0.0
        raw_sim = hybrid_candidate.semantic_result.similarity_score
        # Cosine similarity is in [-1, 1]; map to [0, 1]
        return round(min(1.0, max(0.0, (raw_sim + 1.0) / 2.0)), 4)

    def calculate_experience_alignment(
        self,
        candidate: Candidate,
        parsed_jd: ParsedJD,
        target_min_years: float = 0.0,
        target_max_years: float = 20.0,
    ) -> float:
        """How well the candidate's experience falls within the JD's range.

        Perfect fit (center of range) → 1.0.
        Below minimum or far above maximum → penalty.

        Args:
            candidate:        Raw Candidate record.
            parsed_jd:        Parsed job description.
            target_min_years: JD minimum years required.
            target_max_years: JD maximum years (or upper comfort zone).

        Returns:
            float: Experience alignment score in [0.0, 1.0].
        """
        years = candidate.total_years_experience
        if years < target_min_years:
            # Below minimum: linear penalty
            return round(max(0.0, years / max(1, target_min_years)), 4)
        if years > target_max_years:
            # Over-qualified penalty (gentle)
            overqualification = (years - target_max_years) / 10.0
            return round(max(0.3, 1.0 - overqualification * 0.1), 4)
        # Within range: score 1.0
        return 1.0

    def calculate_industry_alignment(
        self, candidate: Candidate, parsed_jd: ParsedJD
    ) -> float:
        """Fraction of candidate's career in JD-preferred industries.

        Args:
            candidate:  Raw Candidate record.
            parsed_jd:  Parsed job description.

        Returns:
            float: Industry alignment in [0.0, 1.0].
        """
        if not parsed_jd.industry_preferences or not candidate.career_history:
            return 0.5   # Neutral when no constraint

        preferred = {p.lower() for p in parsed_jd.industry_preferences}
        matched_roles = sum(
            1 for job in candidate.career_history
            if any(pref in job.industry.lower() for pref in preferred)
        )
        return round(matched_roles / len(candidate.career_history), 4)

    def calculate_location_alignment(
        self, candidate: Candidate, parsed_jd: ParsedJD
    ) -> float:
        """Location match between candidate location and JD preferred locations.

        Args:
            candidate:  Raw Candidate record.
            parsed_jd:  Parsed job description.

        Returns:
            float: 1.0 exact match, 0.75 willing to relocate, 0.0 mismatch.
        """
        if not parsed_jd.location_preferences:
            return 1.0   # No location constraint

        preferred_locs = [loc.lower() for loc in parsed_jd.location_preferences]
        candidate_loc = candidate.profile.location.lower()

        if any(loc in candidate_loc for loc in preferred_locs):
            return 1.0
        if candidate.redrob_signals.willing_to_relocate:
            return 0.75
        return 0.0

    def calculate_career_alignment(
        self, candidate: Candidate, parsed_jd: ParsedJD
    ) -> float:
        """How closely the candidate's career arc matches the JD seniority.

        Uses current title to assess seniority level match.

        Args:
            candidate:  Raw Candidate record.
            parsed_jd:  Parsed job description.

        Returns:
            float: Career alignment in [0.0, 1.0].
        """
        current_title = (candidate.current_role or "").lower()
        jd_title = parsed_jd.job_title.lower()

        # Seniority keywords
        seniority_levels = {
            "junior": 1, "associate": 2, "": 3, "senior": 4,
            "staff": 5, "principal": 6, "distinguished": 7,
        }

        def get_seniority(title: str) -> int:
            for level, score in seniority_levels.items():
                if level and level in title:
                    return score
            return 3  # default: mid-level

        cand_level = get_seniority(current_title)
        jd_level = get_seniority(jd_title)
        diff = abs(cand_level - jd_level)

        if diff == 0:
            return 1.0
        elif diff == 1:
            return 0.75
        elif diff == 2:
            return 0.50
        else:
            return 0.25

    # ── Main Extraction ───────────────────────────────────────────────────────

    def extract_features(
        self,
        candidate: Candidate,
        parsed_jd: ParsedJD,
        hybrid_candidate: Optional[HybridCandidate] = None,
        target_min_years: float = 0.0,
        target_max_years: float = 20.0,
    ) -> MatchingFeatures:
        """Extracts JD-aware MatchingFeatures.

        Args:
            candidate:        Raw Candidate record.
            parsed_jd:        Parsed job description.
            hybrid_candidate: HybridCandidate from Phase 9 (for retrieval scores).
            target_min_years: JD minimum years required.
            target_max_years: JD maximum comfort zone years.

        Returns:
            MatchingFeatures: Populated feature object.
        """
        features = MatchingFeatures(
            skill_coverage_score=self.calculate_skill_coverage(candidate, parsed_jd),
            keyword_coverage_score=self.calculate_keyword_coverage(hybrid_candidate),
            semantic_alignment_score=self.calculate_semantic_alignment(hybrid_candidate),
            experience_alignment_score=self.calculate_experience_alignment(
                candidate, parsed_jd, target_min_years, target_max_years
            ),
            industry_alignment_score=self.calculate_industry_alignment(candidate, parsed_jd),
            location_alignment_score=self.calculate_location_alignment(candidate, parsed_jd),
            career_alignment_score=self.calculate_career_alignment(candidate, parsed_jd),
        )

        logger.debug(
            f"MatchingFeatureExtractor: {candidate.candidate_id} → "
            f"overall={features.overall_matching_score():.3f}"
        )
        return features
