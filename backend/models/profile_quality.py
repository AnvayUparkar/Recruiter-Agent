"""Profile Quality model — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Is this a deeply documented, credible profile, or a thin, vague
    listing that tells me nothing I can trust?"  Profile quality measures
    *content depth*, not identity verification (that is Phase 11 Trust).

Signal Modeled:
    Seven quality dimensions — completeness (data present?), depth
    (how much detail?), strength (overall signal power), documentation
    quality (are descriptions specific and quantified?), career detail
    quality (role descriptions vs. one-liners), skills quality (realistic
    breadth vs. inflation), and a composite quality_score.

Phase 13 Ranking Usage:
    ``quality_score`` feeds ReliabilityScoring (30% weight, highest
    signal) and is exported as ``reliability_quality`` in the Phase 13
    ranking feature vector.  Low-quality profiles receive a ranking
    penalty that protects recruiters from wasted outreach.
"""

from typing import List
from pydantic import BaseModel, Field, model_validator


class ProfileQuality(BaseModel):
    """Structured profile quality assessment for a single candidate.

    All sub-scores are normalised to [0.0, 1.0].
    ``evidence`` provides a human-readable audit trail for recruiter UIs.
    ``confidence`` reflects how many quality dimensions were measurable.
    """

    # ── Identity ───────────────────────────────────────────────────────────────
    candidate_id: str = Field(
        ...,
        description="Unique candidate identifier (CAND_XXXXXXX format).",
    )

    # ── Sub-Scores ─────────────────────────────────────────────────────────────
    profile_completeness: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Fraction of expected profile sections present: summary, "
            "skills, experience, education, and descriptions."
        ),
    )
    profile_depth: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Depth score: measures textual richness — word counts, "
            "description lengths, and section density."
        ),
    )
    profile_strength: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Overall signal-strength score combining completeness, depth, "
            "and verified platform signals (endorsements, connections)."
        ),
    )
    documentation_quality: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Quality of written descriptions: presence of quantified "
            "achievements, action verbs, metrics, and technical specificity. "
            "Weak: 'Worked on ML'. Strong: 'Built rec system serving 2M users'."
        ),
    )
    career_detail_quality: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Average description quality across all career history roles. "
            "Penalises one-liner job descriptions."
        ),
    )
    skills_quality: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Quality of the skills section: balanced breadth vs. depth, "
            "penalises extreme inflation (>40 skills without matching experience)."
        ),
    )

    # ── Aggregate ──────────────────────────────────────────────────────────────
    quality_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Weighted composite quality score across all six dimensions.",
    )

    # ── Metadata ───────────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Signal-quality confidence: fraction of sub-dimensions that "
            "produced observable, non-default values."
        ),
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Human-readable audit trail explaining each sub-score.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "ProfileQuality":
        """Ensures all float fields remain within [0.0, 1.0] after construction."""
        for field in (
            "profile_completeness",
            "profile_depth",
            "profile_strength",
            "documentation_quality",
            "career_detail_quality",
            "skills_quality",
            "quality_score",
            "confidence",
        ):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def is_high_quality(self) -> bool:
        """Returns True when the profile meets high-quality thresholds.

        Threshold: quality_score ≥ 0.70 with confidence ≥ 0.60.

        Returns:
            bool: True if profile content quality is high.
        """
        return self.quality_score >= 0.70 and self.confidence >= 0.60

    def to_feature_dict(self) -> dict:
        """Exposes named scalar features for downstream ranking models.

        Returns:
            dict: Flat {feature_name: float} suitable for ML feature vectors.
        """
        return {
            "quality_completeness":   self.profile_completeness,
            "quality_depth":          self.profile_depth,
            "quality_strength":       self.profile_strength,
            "quality_documentation":  self.documentation_quality,
            "quality_career_detail":  self.career_detail_quality,
            "quality_skills":         self.skills_quality,
            "quality_overall":        self.quality_score,
            "quality_confidence":     self.confidence,
        }

    model_config = {"populate_by_name": True}
