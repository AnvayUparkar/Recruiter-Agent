"""Hybrid Retrieval Response model definition.

Top-level API response envelope returned by HybridRetrievalService.
Carries both the full per-channel retrieval metadata and the fused
candidate list, enabling callers to inspect individual channel
performance as well as the final fused result.

Used by:
- Phase 9: Hybrid Retrieval (API response)
- Phase 10: Ranking Engine (may inspect channel statistics)
- Monitoring dashboards
"""

from typing import List
from pydantic import BaseModel, Field
from models.search_result import SearchResult
from models.lexical_match import LexicalMatch
from models.hybrid_candidate import HybridCandidate


class HybridRetrievalResponse(BaseModel):
    """Complete response envelope from the Hybrid Retrieval Engine.

    Includes:
    - Per-channel raw results (semantic, lexical) for observability.
    - Fused candidate list ranked by the chosen fusion strategy.
    - Timing, strategy, and quality metadata.
    """

    # ── Identity ──────────────────────────────────────────────────────────────
    query_id: str = Field(
        ...,
        description="Unique retrieval query identifier (e.g. 'HYB_a1b2c3d4').",
    )

    # ── Per-Channel Raw Results ────────────────────────────────────────────────
    semantic_candidates: List[SearchResult] = Field(
        default_factory=list,
        description="Raw FAISS semantic search results before fusion.",
    )
    lexical_candidates: List[LexicalMatch] = Field(
        default_factory=list,
        description="Raw BM25 lexical search results before fusion.",
    )

    # ── Fused Candidates ──────────────────────────────────────────────────────
    fused_candidates: List[HybridCandidate] = Field(
        default_factory=list,
        description="Hybrid-fused, ranked candidate list.",
    )

    # ── Counts ────────────────────────────────────────────────────────────────
    total_semantic: int = Field(
        0, ge=0,
        description="Number of candidates returned by semantic retrieval.",
    )
    total_lexical: int = Field(
        0, ge=0,
        description="Number of candidates returned by lexical retrieval.",
    )
    total_fused: int = Field(
        0, ge=0,
        description="Number of unique candidates in the fused result.",
    )

    # ── Performance & Provenance ──────────────────────────────────────────────
    retrieval_time_ms: float = Field(
        0.0, ge=0.0,
        description="Total wall-clock time for the complete retrieval pipeline (ms).",
    )
    semantic_time_ms: float = Field(
        0.0, ge=0.0,
        description="Time spent on semantic retrieval (ms).",
    )
    lexical_time_ms: float = Field(
        0.0, ge=0.0,
        description="Time spent on lexical retrieval (ms).",
    )
    fusion_time_ms: float = Field(
        0.0, ge=0.0,
        description="Time spent on fusion and deduplication (ms).",
    )
    fusion_strategy: str = Field(
        "rrf",
        description="Fusion strategy used (rrf | weighted | borda).",
    )

    model_config = {
        "populate_by_name": True,
    }
