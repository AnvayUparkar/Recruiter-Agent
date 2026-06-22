"""Feature Vector model definition.

The complete feature representation of a single candidate for a specific
JD query. This is the primary data structure passed to the Ranking Engine.

Why it exists:
  The Ranking Engine needs a single, flat, validated object per candidate
  that contains all feature groups, their per-group strength scores,
  an overall strength estimate, and a flat dictionary representation
  suitable for feeding directly into an ML model or scoring function.

Ranking dependency:
  This is THE input to Phase 11: Ranking Engine.
  to_flat_dict() produces the exact feature vector consumed by XGBoost /
  linear ranker / learning-to-rank model.
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, model_validator
from models.technical_features import TechnicalFeatures
from models.career_features import CareerFeatures
from models.leadership_features import LeadershipFeatures
from models.execution_features import ExecutionFeatures
from models.market_features import MarketFeatures
from models.matching_features import MatchingFeatures


# Default feature group importance weights (must sum to 1.0)
DEFAULT_WEIGHTS: Dict[str, float] = {
    "technical": 0.40,
    "career":    0.20,
    "execution": 0.15,
    "matching":  0.15,
    "leadership": 0.05,
    "market":    0.05,
}


class FeatureVector(BaseModel):
    """Complete, validated feature representation of one candidate for one JD.

    Contains all six feature groups plus derived aggregate scores.
    """

    # ── Identity ──────────────────────────────────────────────────────────────
    candidate_id: str = Field(..., description="Unique candidate identifier.")
    query_id: Optional[str] = Field(
        None, description="Query or pool ID this vector was generated for."
    )

    # ── Feature Groups ────────────────────────────────────────────────────────
    technical_features: TechnicalFeatures = Field(default_factory=TechnicalFeatures)
    career_features: CareerFeatures = Field(default_factory=CareerFeatures)
    leadership_features: LeadershipFeatures = Field(default_factory=LeadershipFeatures)
    execution_features: ExecutionFeatures = Field(default_factory=ExecutionFeatures)
    market_features: MarketFeatures = Field(default_factory=MarketFeatures)
    matching_features: MatchingFeatures = Field(default_factory=MatchingFeatures)

    # ── Derived Aggregates (auto-computed) ────────────────────────────────────
    feature_count: int = Field(
        0, ge=0,
        description="Total number of scalar features in this vector.",
    )
    overall_feature_strength: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Weighted aggregate of all per-group strength scores.",
    )

    # ── Feature Importance Weights ────────────────────────────────────────────
    feature_weights: Dict[str, float] = Field(
        default_factory=lambda: dict(DEFAULT_WEIGHTS),
        description="Per-group importance weights used to compute overall_feature_strength.",
    )

    @model_validator(mode="after")
    def compute_derived_fields(self) -> "FeatureVector":
        """Auto-computes feature_count and overall_feature_strength after construction."""
        flat = self._build_flat_dict()
        self.feature_count = len(flat)
        w = self.feature_weights
        self.overall_feature_strength = round(min(1.0, (
            w.get("technical",  0.40) * self.technical_features.overall_technical_score()
            + w.get("career",   0.20) * self.career_features.overall_career_score()
            + w.get("execution", 0.15) * self.execution_features.overall_execution_score()
            + w.get("matching",  0.15) * self.matching_features.overall_matching_score()
            + w.get("leadership", 0.05) * self.leadership_features.overall_leadership_score()
            + w.get("market",   0.05) * self.market_features.overall_market_score()
        )), 4)
        return self

    # ── Public Interface ──────────────────────────────────────────────────────

    def _build_flat_dict(self) -> Dict[str, float]:
        """Internal helper: assembles flat {feature_name: value} dict."""
        tech = self.technical_features
        car  = self.career_features
        lead = self.leadership_features
        exe  = self.execution_features
        mkt  = self.market_features
        mat  = self.matching_features

        return {
            # Technical
            "tech_retrieval":        tech.retrieval_experience_score,
            "tech_ranking":          tech.ranking_experience_score,
            "tech_recommendation":   tech.recommendation_experience_score,
            "tech_vector_db":        tech.vector_db_experience_score,
            "tech_production_ml":    tech.production_ml_score,
            "tech_llm":              tech.llm_score,
            "tech_evaluation":       tech.evaluation_score,
            "tech_distributed":      tech.distributed_systems_score,
            "tech_python":           tech.python_score,
            "tech_open_source":      tech.open_source_score,
            "tech_github":           tech.github_score,
            "tech_overall":          tech.overall_technical_score(),
            # Career
            "career_experience":     car.years_experience_score,
            "career_growth":         car.career_growth_score,
            "career_stability":      car.career_stability_score,
            "career_startup":        car.startup_experience_score,
            "career_product_co":     car.product_company_score,
            "career_tenure":         car.average_tenure_score,
            "career_industry_rel":   car.industry_relevance_score,
            "career_consulting_pen": car.consulting_penalty,
            "career_research_pen":   car.research_penalty,
            "career_hopping_pen":    car.job_hopping_penalty,
            "career_overall":        car.overall_career_score(),
            # Leadership
            "lead_people_mgmt":      lead.people_management_score,
            "lead_tech_lead":        lead.technical_leadership_score,
            "lead_mentorship":       lead.mentorship_score,
            "lead_ownership":        lead.ownership_score,
            "lead_cross_func":       lead.cross_functional_score,
            "lead_decision":         lead.decision_making_score,
            "lead_overall":          lead.overall_leadership_score(),
            # Execution
            "exec_shipping":         exe.shipping_score,
            "exec_production":       exe.production_delivery_score,
            "exec_impact":           exe.impact_score,
            "exec_scale":            exe.system_scale_score,
            "exec_complexity":       exe.project_complexity_score,
            "exec_initiative":       exe.initiative_score,
            "exec_overall":          exe.overall_execution_score(),
            # Market
            "mkt_availability":      mkt.availability_score,
            "mkt_engagement":        mkt.recruiter_engagement_score,
            "mkt_profile_strength":  mkt.profile_strength_score,
            "mkt_salary_align":      mkt.salary_alignment_score,
            "mkt_relocation":        mkt.relocation_score,
            "mkt_interest":          mkt.market_interest_score,
            "mkt_overall":           mkt.overall_market_score(),
            # Matching
            "match_skill_coverage":  mat.skill_coverage_score,
            "match_keyword_cov":     mat.keyword_coverage_score,
            "match_semantic":        mat.semantic_alignment_score,
            "match_experience":      mat.experience_alignment_score,
            "match_industry":        mat.industry_alignment_score,
            "match_location":        mat.location_alignment_score,
            "match_career":          mat.career_alignment_score,
            "match_overall":         mat.overall_matching_score(),
            # Aggregate
            "overall_strength":      self.overall_feature_strength,
        }

    def to_flat_dict(self) -> Dict[str, float]:
        """Returns a flat {feature_name: float_value} dict for ML model consumption.

        Returns:
            Dict[str, float]: Complete feature vector as a flat mapping.
        """
        return self._build_flat_dict()

    def group_scores(self) -> Dict[str, float]:
        """Returns per-group overall scores for quick inspection.

        Returns:
            Dict[str, float]: {group_name: overall_score}
        """
        return {
            "technical":  self.technical_features.overall_technical_score(),
            "career":     self.career_features.overall_career_score(),
            "leadership": self.leadership_features.overall_leadership_score(),
            "execution":  self.execution_features.overall_execution_score(),
            "market":     self.market_features.overall_market_score(),
            "matching":   self.matching_features.overall_matching_score(),
            "overall":    self.overall_feature_strength,
        }

    model_config = {"populate_by_name": True}
