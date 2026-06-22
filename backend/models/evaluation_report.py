"""Evaluation Report Model — Phase 14: Production API & Recruiter Suite.

Defines the structured metrics mapping for ranking accuracy audits.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class EvaluationReport(BaseModel):
    """Statistical summary measuring the quality of a candidate ranking run."""

    ndcg: Dict[str, float] = Field(
        ...,
        description="Normalized Discounted Cumulative Gain at various cutoffs (e.g. ndcg_at_5).",
    )
    mrr: float = Field(
        ...,
        description="Mean Reciprocal Rank score for the pool.",
    )
    precision: Dict[str, float] = Field(
        ...,
        description="Precision at various K cutoffs (e.g. precision_at_5).",
    )
    recall: Dict[str, float] = Field(
        ...,
        description="Recall rate of matching candidates at cutoffs.",
    )
    coverage: float = Field(
        ...,
        description="Skill or keyword coverage ratio across the shortlisted candidates.",
    )
    diversity: float = Field(
        ...,
        description="Diversity score based on candidate seniority, location, or industry dispersion.",
    )
    trust_metrics: Dict[str, Any] = Field(
        default_factory=dict,
        description="Aggregated reliability averages (e.g. average pool reliability).",
    )
    quality_metrics: Dict[str, Any] = Field(
        default_factory=dict,
        description="Aggregated profile documentation quality averages.",
    )
    generated_at: str = Field(
        ...,
        description="ISO timestamp of report creation.",
    )

    model_config = {
        "populate_by_name": True,
    }
