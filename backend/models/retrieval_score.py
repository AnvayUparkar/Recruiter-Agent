"""Retrieval Score model definition.

Captures the complete scoring surface of a candidate across both the
semantic (FAISS) and lexical (BM25) retrieval channels, including raw,
normalized, and fused signal values.

Used by:
- Phase 9: Hybrid Retrieval (score storage & deduplication)
- Phase 10: Ranking Engine (input signal vector)
- Phase 11: Submission Generator (score provenance)
"""

from typing import Optional
from pydantic import BaseModel, Field


class RetrievalScore(BaseModel):
    """Complete scoring record for a single candidate across both retrieval channels.

    All score fields default to 0.0 so that candidates appearing in only one
    retrieval channel can still be represented without requiring sentinel values.
    """

    # ── Raw Retrieval Scores ──────────────────────────────────────────────────
    semantic_score: float = Field(
        0.0,
        ge=-1.0,
        le=1.0,
        description="Raw cosine similarity score from FAISS semantic search.",
    )
    bm25_score: float = Field(
        0.0,
        ge=0.0,
        description="Raw BM25 lexical relevance score.",
    )

    # ── Normalized Scores (0.0 – 1.0) ────────────────────────────────────────
    normalized_semantic_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Min-max normalized semantic score within the retrieval set.",
    )
    normalized_bm25_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Min-max normalized BM25 score within the retrieval set.",
    )

    # ── Rank Positions ────────────────────────────────────────────────────────
    semantic_rank: Optional[int] = Field(
        None,
        ge=1,
        description="Original rank returned by FAISS (None if not in semantic results).",
    )
    bm25_rank: Optional[int] = Field(
        None,
        ge=1,
        description="Original rank returned by BM25 (None if not in lexical results).",
    )

    # ── Fusion Scores ─────────────────────────────────────────────────────────
    rrf_score: float = Field(
        0.0,
        ge=0.0,
        description="Reciprocal Rank Fusion score: Σ 1/(k + rank) across channels.",
    )
    weighted_fusion_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Weighted linear combination of normalized semantic and BM25 scores.",
    )
    borda_score: float = Field(
        0.0,
        ge=0.0,
        description="Borda count fusion score: sum of inverted rank positions.",
    )

    # ── Final Score ───────────────────────────────────────────────────────────
    final_retrieval_score: float = Field(
        0.0,
        ge=0.0,
        description="Active fusion strategy output used to order the candidate pool.",
    )

    # ── Provenance ────────────────────────────────────────────────────────────
    fusion_strategy: str = Field(
        "rrf",
        description="Fusion strategy that produced final_retrieval_score (rrf|weighted|borda).",
    )
    in_semantic_results: bool = Field(
        False,
        description="Whether this candidate appeared in semantic retrieval.",
    )
    in_lexical_results: bool = Field(
        False,
        description="Whether this candidate appeared in lexical (BM25) retrieval.",
    )

    model_config = {
        "populate_by_name": True,
    }
