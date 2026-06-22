"""Feature Registry service.

Central catalog of all feature names, their groups, and importance weights.

Why it exists:
  As the system grows beyond 50+ features, it becomes critical to have a
  single source of truth about what features exist, what group they belong
  to, and what weight they carry. The registry prevents scattered magic
  strings and makes feature importance transparent and auditable.

Future usage:
  - Ranking Engine: reads weights from registry to build scoring function.
  - Monitoring: tracks feature drift per feature name.
  - A/B testing: swaps weight configs without code changes.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from utils.logger import get_logger

logger = get_logger(__name__)

# Default group-level importance weights
DEFAULT_GROUP_WEIGHTS: Dict[str, float] = {
    "technical":  0.40,
    "career":     0.20,
    "execution":  0.15,
    "matching":   0.15,
    "leadership": 0.05,
    "market":     0.05,
}


@dataclass
class FeatureDefinition:
    """Descriptor for a single registered feature."""

    name: str
    group: str
    description: str
    importance_weight: float = 1.0     # relative within group
    min_value: float = 0.0
    max_value: float = 1.0
    is_penalty: bool = False           # if True, higher = worse
    tags: List[str] = field(default_factory=list)


class FeatureRegistry:
    """Singleton-style central registry of all feature definitions."""

    def __init__(self) -> None:
        self._features: Dict[str, FeatureDefinition] = {}
        self._group_weights: Dict[str, float] = dict(DEFAULT_GROUP_WEIGHTS)
        self._initialize_default_features()

    # ── Registration ──────────────────────────────────────────────────────────

    def register_feature(
        self,
        name: str,
        group: str,
        description: str,
        importance_weight: float = 1.0,
        is_penalty: bool = False,
        tags: Optional[List[str]] = None,
    ) -> None:
        """Registers a new feature definition.

        Args:
            name:               Unique feature name (snake_case).
            group:              Feature group ('technical'|'career'|'leadership'|...).
            description:        Human-readable description.
            importance_weight:  Relative importance within the group.
            is_penalty:         True if higher score means worse candidate fit.
            tags:               Optional metadata tags.
        """
        if name in self._features:
            logger.warning(f"Feature '{name}' is already registered. Overwriting.")
        self._features[name] = FeatureDefinition(
            name=name,
            group=group,
            description=description,
            importance_weight=importance_weight,
            is_penalty=is_penalty,
            tags=tags or [],
        )
        logger.debug(f"Registered feature '{name}' in group '{group}'.")

    def set_group_weight(self, group: str, weight: float) -> None:
        """Updates the importance weight for an entire feature group.

        Args:
            group:  Feature group name.
            weight: New weight (should be in [0.0, 1.0]).
        """
        self._group_weights[group] = weight
        logger.info(f"Feature group '{group}' weight set to {weight}.")

    # ── Queries ───────────────────────────────────────────────────────────────

    def feature_names(self, group: Optional[str] = None) -> List[str]:
        """Returns all registered feature names, optionally filtered by group.

        Args:
            group: Filter to a specific group, or None for all.

        Returns:
            List[str]: Feature names.
        """
        if group:
            return [n for n, f in self._features.items() if f.group == group]
        return list(self._features.keys())

    def feature_count(self, group: Optional[str] = None) -> int:
        """Returns the count of registered features.

        Args:
            group: Filter to a specific group, or None for all.

        Returns:
            int: Feature count.
        """
        return len(self.feature_names(group))

    def feature_groups(self) -> List[str]:
        """Returns all distinct registered group names.

        Returns:
            List[str]: Unique group names.
        """
        return list({f.group for f in self._features.values()})

    def get_feature(self, name: str) -> Optional[FeatureDefinition]:
        """Retrieves a feature definition by name.

        Args:
            name: Feature name.

        Returns:
            Optional[FeatureDefinition]: Feature definition or None if not found.
        """
        return self._features.get(name)

    def group_weights(self) -> Dict[str, float]:
        """Returns the current group-level importance weights.

        Returns:
            Dict[str, float]: {group_name: weight}
        """
        return dict(self._group_weights)

    def features_by_group(self) -> Dict[str, List[FeatureDefinition]]:
        """Groups all feature definitions by their group name.

        Returns:
            Dict[str, List[FeatureDefinition]]: Grouped feature definitions.
        """
        groups: Dict[str, List[FeatureDefinition]] = {}
        for feat in self._features.values():
            groups.setdefault(feat.group, []).append(feat)
        return groups

    def penalty_features(self) -> List[str]:
        """Returns names of all features flagged as penalty signals.

        Returns:
            List[str]: Penalty feature names.
        """
        return [n for n, f in self._features.items() if f.is_penalty]

    def summary(self) -> Dict:
        """Returns a summary report of the registry state.

        Returns:
            Dict: Registry stats.
        """
        return {
            "total_features": self.feature_count(),
            "groups": self.feature_groups(),
            "group_counts": {g: self.feature_count(g) for g in self.feature_groups()},
            "group_weights": self.group_weights(),
            "penalty_features": self.penalty_features(),
        }

    # ── Default Feature Initialization ───────────────────────────────────────

    def _initialize_default_features(self) -> None:
        """Registers all default Phase 10 feature definitions."""

        # Technical Features (40% group weight)
        tech_features = [
            ("tech_retrieval",       "retrieval_experience_score",  0.15, False),
            ("tech_ranking",         "ranking_experience_score",    0.12, False),
            ("tech_recommendation",  "recommendation_experience",   0.08, False),
            ("tech_vector_db",       "vector_db_experience_score",  0.10, False),
            ("tech_production_ml",   "production_ml_score",         0.12, False),
            ("tech_llm",             "llm_score",                   0.10, False),
            ("tech_evaluation",      "evaluation_score",            0.08, False),
            ("tech_distributed",     "distributed_systems_score",   0.08, False),
            ("tech_python",          "python_score",                0.10, False),
            ("tech_open_source",     "open_source_score",           0.04, False),
            ("tech_github",          "github_score",                0.03, False),
        ]
        for name, desc, weight, penalty in tech_features:
            self.register_feature(name, "technical", desc, weight, penalty, ["ml", "search"])

        # Career Features (20% group weight)
        career_features = [
            ("career_experience",   "years_experience_score",    0.25, False),
            ("career_growth",       "career_growth_score",       0.20, False),
            ("career_stability",    "career_stability_score",    0.15, False),
            ("career_product_co",   "product_company_score",     0.15, False),
            ("career_tenure",       "average_tenure_score",      0.10, False),
            ("career_industry_rel", "industry_relevance_score",  0.10, False),
            ("career_startup",      "startup_experience_score",  0.05, False),
            ("career_consulting_pen", "consulting_penalty",      0.40, True),
            ("career_research_pen", "research_penalty",          0.35, True),
            ("career_hopping_pen",  "job_hopping_penalty",       0.25, True),
        ]
        for name, desc, weight, penalty in career_features:
            self.register_feature(name, "career", desc, weight, penalty, ["trajectory"])

        # Leadership Features (5% group weight)
        lead_features = [
            ("lead_tech_lead",   "technical_leadership_score",  0.25, False),
            ("lead_ownership",   "ownership_score",             0.20, False),
            ("lead_decision",    "decision_making_score",       0.20, False),
            ("lead_people_mgmt", "people_management_score",     0.15, False),
            ("lead_cross_func",  "cross_functional_score",      0.10, False),
            ("lead_mentorship",  "mentorship_score",            0.10, False),
        ]
        for name, desc, weight, penalty in lead_features:
            self.register_feature(name, "leadership", desc, weight, penalty, ["seniority"])

        # Execution Features (15% group weight)
        exec_features = [
            ("exec_shipping",    "shipping_score",              0.25, False),
            ("exec_production",  "production_delivery_score",   0.20, False),
            ("exec_impact",      "impact_score",                0.20, False),
            ("exec_scale",       "system_scale_score",          0.20, False),
            ("exec_complexity",  "project_complexity_score",    0.10, False),
            ("exec_initiative",  "initiative_score",            0.05, False),
        ]
        for name, desc, weight, penalty in exec_features:
            self.register_feature(name, "execution", desc, weight, penalty, ["delivery"])

        # Market Features (5% group weight)
        mkt_features = [
            ("mkt_availability",    "availability_score",         0.30, False),
            ("mkt_profile_strength","profile_strength_score",     0.25, False),
            ("mkt_engagement",      "recruiter_engagement_score", 0.20, False),
            ("mkt_salary_align",    "salary_alignment_score",     0.15, False),
            ("mkt_relocation",      "relocation_score",           0.05, False),
            ("mkt_interest",        "market_interest_score",      0.05, False),
        ]
        for name, desc, weight, penalty in mkt_features:
            self.register_feature(name, "market", desc, weight, penalty, ["availability"])

        # Matching Features (15% group weight)
        match_features = [
            ("match_skill_coverage", "skill_coverage_score",        0.30, False),
            ("match_semantic",       "semantic_alignment_score",     0.25, False),
            ("match_keyword_cov",    "keyword_coverage_score",       0.15, False),
            ("match_experience",     "experience_alignment_score",   0.10, False),
            ("match_career",         "career_alignment_score",       0.10, False),
            ("match_industry",       "industry_alignment_score",     0.05, False),
            ("match_location",       "location_alignment_score",     0.05, False),
        ]
        for name, desc, weight, penalty in match_features:
            self.register_feature(name, "matching", desc, weight, penalty, ["jd_aware"])

        logger.info(
            f"FeatureRegistry initialized: {self.feature_count()} features "
            f"across {len(self.feature_groups())} groups."
        )


# Module-level singleton
_registry: Optional[FeatureRegistry] = None


def get_feature_registry() -> FeatureRegistry:
    """Returns the module-level singleton FeatureRegistry instance.

    Returns:
        FeatureRegistry: Shared registry.
    """
    global _registry
    if _registry is None:
        _registry = FeatureRegistry()
    return _registry
