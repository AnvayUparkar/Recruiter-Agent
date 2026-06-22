"""Recruiter Reasoning Trace model — Phase 13: Final Recruiter Ranking Engine.

Models the decision log and rule triggers for auditability.
"""

from typing import Dict, List, Any
from pydantic import BaseModel, Field


class RecruiterReasoningTrace(BaseModel):
    """Detailed log trace of the rules, adjustments, and heuristics applied to a candidate."""

    candidate_id: str = Field(..., description="Unique candidate ID.")
    rule_evaluations: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of evaluated rules, showing name, status, trigger condition, and impact.",
    )
    raw_signals_captured: Dict[str, Any] = Field(
        default_factory=dict,
        description="Snapshot of the raw features and signals evaluated during ranking.",
    )
    decision_steps: List[str] = Field(
        default_factory=list,
        description="Chronological text descriptions of the matching and filtering path.",
    )
    final_adjustments: Dict[str, float] = Field(
        default_factory=dict,
        description="Details of any bonuses, penalties, and multipliers applied at the end.",
    )

    model_config = {
        "populate_by_name": True,
    }
