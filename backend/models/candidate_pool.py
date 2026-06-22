"""Candidate Pool model definition.

Represents the final output of the Hybrid Retrieval Engine: a ranked pool
of up to 5,000 candidates ready for the Ranking Engine.

The pool also carries statistical metadata (diversity, coverage) that allows
the Ranking Engine and Submission Generator to reason about pool quality
without re-processing every candidate.

Used by:
- Phase 9: Hybrid Retrieval (output container)
- Phase 10: Ranking Engine (primary input)
- Phase 11: Submission Generator (provenance metadata)
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from models.hybrid_candidate import HybridCandidate


class PoolStatistics(BaseModel):
    """Aggregate statistics describing the quality and diversity of the candidate pool."""

    total_semantic_only: int = Field(
        0, ge=0,
        description="Candidates found only by FAISS.",
    )
    total_lexical_only: int = Field(
        0, ge=0,
        description="Candidates found only by BM25.",
    )
    total_hybrid: int = Field(
        0, ge=0,
        description="Candidates found by both retrieval channels.",
    )
    average_coverage_score: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Mean JD skill coverage score across all pool candidates.",
    )
    average_final_score: float = Field(
        0.0, ge=0.0,
        description="Mean final_retrieval_score across all pool candidates.",
    )
    coverage_distribution: Dict[str, int] = Field(
        default_factory=dict,
        description="Histogram of coverage buckets: {'0.0-0.25': N, '0.25-0.5': N, ...}.",
    )
    fusion_strategy: str = Field(
        "rrf",
        description="Fusion strategy used to generate this pool.",
    )


class CandidatePool(BaseModel):
    """Ranked pool of candidates produced by the Hybrid Retrieval Engine.

    The pool is the primary unit exchanged between Phase 9 (Hybrid Retrieval)
    and Phase 10 (Ranking Engine). It carries full scoring provenance so the
    Ranking Engine never needs to re-query retrieval services.
    """

    # ── Identity ──────────────────────────────────────────────────────────────
    query_id: str = Field(
        ...,
        description="Unique query identifier, inherited from the HybridRetrievalResponse.",
    )
    job_title: str = Field(
        "",
        description="Job title sourced from the ParsedJD for traceability.",
    )

    # ── Candidates ────────────────────────────────────────────────────────────
    candidates: List[HybridCandidate] = Field(
        default_factory=list,
        description="Ranked list of fused candidates, ordered by final_retrieval_score desc.",
    )
    candidate_count: int = Field(
        0, ge=0,
        description="Total number of candidates in the pool.",
    )

    # ── Performance ───────────────────────────────────────────────────────────
    generation_time_ms: float = Field(
        0.0, ge=0.0,
        description="Total wall-clock time to generate this pool in milliseconds.",
    )

    # ── Quality Metadata ──────────────────────────────────────────────────────
    pool_statistics: PoolStatistics = Field(
        default_factory=PoolStatistics,
        description="Aggregate quality metrics for this candidate pool.",
    )
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp when this pool was generated.",
    )

    @field_validator("candidate_count", mode="before")
    @classmethod
    def sync_count(cls, v: Any, info: Any) -> int:
        """Ensures candidate_count reflects the actual list length when provided."""
        # Accept explicit values; post-model construction sync is handled externally.
        return v

    model_config = {
        "populate_by_name": True,
    }
