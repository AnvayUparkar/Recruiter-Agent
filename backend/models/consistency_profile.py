"""Consistency Profile model — Phase 12: Profile Quality & Fraud Detection.

Recruiter Problem Solved:
    "Do the skills, titles, and experience descriptions tell a coherent
    story — or are there unexplained contradictions that will surface
    awkwardly in an interview?"  Consistency is different from fraud risk:
    a perfectly honest candidate can have an inconsistent profile due to
    poor documentation, not deception.

Signal Modeled:
    Five consistency dimensions — career progression logic (do titles
    advance naturally?), timeline coherence (do dates add up?), skill-to-
    experience alignment (do claimed skills appear in job descriptions?),
    title-to-industry alignment (does the seniority match the years?),
    and experience depth (do descriptions match claimed expertise level?).

Phase 13 Ranking Usage:
    ``consistency_score`` feeds ReliabilityScoring (15% weight) and is
    exported as ``reliability_consistency`` in the Phase 13 ranking
    feature vector.  Inconsistent profiles are penalised because
    recruiters cannot present them confidently without additional
    investigation.
"""

from typing import List
from pydantic import BaseModel, Field, model_validator


class ConsistencyProfile(BaseModel):
    """Structured career-narrative consistency assessment for a single candidate.

    All sub-scores are in [0.0, 1.0] where 1.0 = fully consistent.
    ``evidence`` provides a human-readable audit trail for recruiter UIs.
    ``confidence`` reflects how many consistency dimensions were measurable.
    """

    # ── Identity ───────────────────────────────────────────────────────────────
    candidate_id: str = Field(
        ...,
        description="Unique candidate identifier (CAND_XXXXXXX format).",
    )

    # ── Sub-Scores ─────────────────────────────────────────────────────────────
    career_consistency: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Career progression logic score: do titles, seniority levels, "
            "and role transitions follow natural career paths?"
        ),
    )
    timeline_consistency: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Timeline coherence: are employment dates sequential, non-overlapping, "
            "and do they sum to a plausible total experience?"
        ),
    )
    skill_consistency: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Skill-to-experience alignment: do claimed skills appear in "
            "career descriptions? Penalises skills with zero supporting evidence."
        ),
    )
    title_consistency: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Title-to-seniority consistency: does claimed seniority level "
            "match years of experience? Penalises premature senior/principal claims."
        ),
    )
    experience_consistency: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Depth-of-experience consistency: do description quality and "
            "specificity match the claimed years and seniority?"
        ),
    )

    # ── Aggregate ──────────────────────────────────────────────────────────────
    consistency_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Weighted composite consistency score across all five dimensions.",
    )

    # ── Metadata ───────────────────────────────────────────────────────────────
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Signal-quality confidence: fraction of dimensions with "
            "sufficient data to evaluate."
        ),
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Human-readable audit trail explaining each consistency check.",
    )

    @model_validator(mode="after")
    def clamp_scores(self) -> "ConsistencyProfile":
        """Ensures all float fields remain within [0.0, 1.0] after construction."""
        for field in (
            "career_consistency",
            "timeline_consistency",
            "skill_consistency",
            "title_consistency",
            "experience_consistency",
            "consistency_score",
            "confidence",
        ):
            value = getattr(self, field)
            setattr(self, field, round(min(1.0, max(0.0, value)), 4))
        return self

    def is_highly_consistent(self) -> bool:
        """Returns True when the profile narrative is highly coherent.

        Threshold: consistency_score ≥ 0.75 with confidence ≥ 0.60.

        Returns:
            bool: True if profile story is consistent and trustworthy.
        """
        return self.consistency_score >= 0.75 and self.confidence >= 0.60

    def to_feature_dict(self) -> dict:
        """Exposes named scalar features for downstream ranking models.

        Returns:
            dict: Flat {feature_name: float} suitable for ML feature vectors.
        """
        return {
            "consist_career":      self.career_consistency,
            "consist_timeline":    self.timeline_consistency,
            "consist_skills":      self.skill_consistency,
            "consist_title":       self.title_consistency,
            "consist_experience":  self.experience_consistency,
            "consist_overall":     self.consistency_score,
            "consist_confidence":  self.confidence,
        }

    model_config = {"populate_by_name": True}
