"""Dashboard Metrics Model — Phase 14: Production API & Recruiter Suite.

Defines the dashboard data structure mapping key pool distributions.
"""

from typing import Dict, Any, List
from pydantic import BaseModel, Field


class DashboardMetrics(BaseModel):
    """Aggregate stats and chart-ready distributions of a candidate pool."""

    retrieval_stats: Dict[str, Any] = Field(
        default_factory=dict,
        description="Statistics of semantic vs lexical retrieval channels.",
    )
    ranking_stats: Dict[str, Any] = Field(
        default_factory=dict,
        description="Candidate final score averages, deviations, and histogram bins.",
    )
    trust_stats: Dict[str, Any] = Field(
        default_factory=dict,
        description="Distribution of reliability scores, tiers (HIGH/MEDIUM/LOW), and fraud risk averages.",
    )
    behavior_stats: Dict[str, Any] = Field(
        default_factory=dict,
        description="Notice period groupings and platform responsiveness indicators.",
    )
    quality_stats: Dict[str, Any] = Field(
        default_factory=dict,
        description="Profile completeness levels and documentation depth averages.",
    )

    model_config = {
        "populate_by_name": True,
    }
