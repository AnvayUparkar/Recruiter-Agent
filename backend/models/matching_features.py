"""Matching Features model definition.

JD-aware features that quantify how well a specific candidate matches
a specific job description. These are *not* generic candidate properties.

Why it exists:
  All other feature groups describe the candidate in isolation.
  Matching features are relational: they only make sense in the context
  of a specific ParsedJD. They answer:
  "Is *this* candidate right for *this* job?"

Ranking dependency:
  Matching features carry 15% weight in the default ranking config.
  semantic_alignment_score and skill_coverage_score are among the
  strongest individual predictors of hiring outcome.
"""

from pydantic import BaseModel, Field


class MatchingFeatures(BaseModel):
    """JD-aware candidate-to-role alignment signals.

    All fields in [0.0, 1.0]. Computed by MatchingFeatureExtractor using
    a (CandidateProfile, ParsedJD) pair — not the candidate alone.
    """

    # ── Skill Alignment ───────────────────────────────────────────────────────
    skill_coverage_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Fraction of JD must-have requirements covered by candidate skills. "
            "4/4 required skills matched → 1.0."
        ),
    )
    keyword_coverage_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "BM25 lexical keyword coverage: fraction of JD must-have terms found "
            "in the candidate BM25 document."
        ),
    )

    # ── Semantic Alignment ────────────────────────────────────────────────────
    semantic_alignment_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Cosine similarity between the candidate embedding and JD embedding "
            "(normalized from [-1, 1] to [0, 1])."
        ),
    )

    # ── Experience Fit ────────────────────────────────────────────────────────
    experience_alignment_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "How well candidate's years of experience falls within the JD's "
            "required experience range."
        ),
    )

    # ── Context Fit ───────────────────────────────────────────────────────────
    industry_alignment_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Proportion of candidate's career spent in industries relevant to "
            "the JD's industry preferences."
        ),
    )
    location_alignment_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "Whether candidate's location matches JD preferred locations. "
            "1.0 = match, 0.5 = relocation willing, 0.0 = mismatch."
        ),
    )
    career_alignment_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description=(
            "How closely the candidate's career arc and title progression aligns "
            "with the seniority and role type specified in the JD."
        ),
    )

    def overall_matching_score(self) -> float:
        """Weighted JD-candidate alignment aggregate.

        Returns:
            float: Score in [0.0, 1.0].
        """
        return round(min(1.0, (
            0.30 * self.skill_coverage_score
            + 0.25 * self.semantic_alignment_score
            + 0.15 * self.keyword_coverage_score
            + 0.10 * self.experience_alignment_score
            + 0.10 * self.career_alignment_score
            + 0.05 * self.industry_alignment_score
            + 0.05 * self.location_alignment_score
        )), 4)

    @property
    def matching_score(self) -> float:
        """Compatibility property for overall matching score."""
        return self.overall_matching_score()

    model_config = {"populate_by_name": True}
