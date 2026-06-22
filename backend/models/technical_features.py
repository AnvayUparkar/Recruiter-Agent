"""Technical Features model definition.

Captures scored technical domain signals for a candidate.
Each field represents a specific engineering competency relevant to
search, ranking, and ML systems roles.

Why it exists:
  Technical depth is the primary hiring signal for SR-level engineering roles.
  A recruiter first asks: "Can this person actually build what we need?"

Ranking dependency:
  The Ranking Engine uses technical_features as its highest-weighted
  input group (40% default). Fields directly feed the XGBoost / linear
  ranker as a dense feature sub-vector.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class FeatureScore(BaseModel):
    """Single scored feature with confidence and supporting evidence."""

    score: float = Field(0.0, ge=0.0, le=1.0, description="Normalized feature score.")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Extraction confidence.")
    evidence: List[str] = Field(
        default_factory=list,
        description="Evidence snippets supporting the score.",
    )

    model_config = {"populate_by_name": True}


class TechnicalFeatures(BaseModel):
    """Recruiter-style technical competency signals for a candidate.

    All scores are in [0.0, 1.0]. A score of 0.0 means no evidence found;
    1.0 means expert-level documented evidence.
    """

    # ── Core IR / Search ─────────────────────────────────────────────────────
    retrieval_experience_score: float = Field(0.0, ge=0.0, le=1.0)
    ranking_experience_score: float = Field(0.0, ge=0.0, le=1.0)
    recommendation_experience_score: float = Field(0.0, ge=0.0, le=1.0)

    # ── Vector / Embedding Systems ────────────────────────────────────────────
    vector_db_experience_score: float = Field(0.0, ge=0.0, le=1.0)

    # ── ML Infrastructure ─────────────────────────────────────────────────────
    production_ml_score: float = Field(0.0, ge=0.0, le=1.0)
    llm_score: float = Field(0.0, ge=0.0, le=1.0)
    evaluation_score: float = Field(0.0, ge=0.0, le=1.0)
    distributed_systems_score: float = Field(0.0, ge=0.0, le=1.0)

    # ── Core Languages & Tooling ──────────────────────────────────────────────
    python_score: float = Field(0.0, ge=0.0, le=1.0)

    # ── Community / Open Source ───────────────────────────────────────────────
    open_source_score: float = Field(0.0, ge=0.0, le=1.0)
    github_score: float = Field(0.0, ge=0.0, le=1.0)

    # ── Per-feature evidence (optional, populated by extractor) ───────────────
    feature_evidence: Dict[str, FeatureScore] = Field(
        default_factory=dict,
        description="Detailed per-feature score objects with evidence.",
    )

    def overall_technical_score(self) -> float:
        """Weighted aggregate of all technical scores.

        Weights prioritise the core search/ranking/ML stack.

        Returns:
            float: Weighted score in [0.0, 1.0].
        """
        weights = {
            "retrieval_experience_score": 0.15,
            "ranking_experience_score": 0.12,
            "recommendation_experience_score": 0.08,
            "vector_db_experience_score": 0.10,
            "production_ml_score": 0.12,
            "llm_score": 0.10,
            "evaluation_score": 0.08,
            "distributed_systems_score": 0.08,
            "python_score": 0.10,
            "open_source_score": 0.04,
            "github_score": 0.03,
        }
        total = sum(
            getattr(self, field) * weight for field, weight in weights.items()
        )
        return round(min(1.0, total), 4)

    @property
    def technical_score(self) -> float:
        """Compatibility property for overall technical score."""
        return self.overall_technical_score()

    model_config = {"populate_by_name": True}
