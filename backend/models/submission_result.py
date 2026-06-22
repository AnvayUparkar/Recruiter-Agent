"""Submission Result Model — Phase 14: Production API & Recruiter Suite.

Defines metadata mapping for exported submission records.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class SubmissionResult(BaseModel):
    """Details of the exported challenge submission file and verification status."""

    file_path: str = Field(..., description="Absolute path to the exported submission CSV.")
    candidate_count: int = Field(..., ge=0, description="Number of candidates ranked and exported.")
    generated_at: str = Field(..., description="Timestamp of submission creation.")
    validation_status: str = Field(
        ...,
        description="Format check result (e.g. 'VALIDATED', 'FORMAT_MISMATCH').",
    )
    checksum: Optional[str] = Field(
        None,
        description="SHA256 hash value to guarantee submission payload integrity.",
    )
    submission_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional export details (e.g. strategy, model version, evaluator flags).",
    )

    model_config = {
        "populate_by_name": True,
    }
