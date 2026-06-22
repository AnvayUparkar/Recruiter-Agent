"""Hybrid Candidate model definition.

Represents a single candidate that has been fused across the semantic and
lexical retrieval channels. This is the primary output unit of the Hybrid
Retrieval Engine and the input unit for the Ranking Engine.

Used by:
- Phase 9: Hybrid Retrieval (pool population)
- Phase 10: Ranking Engine (feature enrichment input)
- Phase 11: Submission Generator (candidate record)
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from models.search_result import SearchResult
from models.lexical_match import LexicalMatch
from models.retrieval_score import RetrievalScore


class HybridCandidate(BaseModel):
    """Fused candidate representation combining semantic and lexical retrieval signals.

    A candidate may originate from one or both retrieval channels. Fields from
    the absent channel default to None.
    """

    # ── Identity ──────────────────────────────────────────────────────────────
    candidate_id: str = Field(
        ...,
        description="Unique candidate identifier (e.g. CAND_0012345).",
    )

    # ── Source Retrieval Records ──────────────────────────────────────────────
    semantic_result: Optional[SearchResult] = Field(
        None,
        description="Original FAISS SearchResult if candidate appeared in semantic retrieval.",
    )
    lexical_result: Optional[LexicalMatch] = Field(
        None,
        description="Original BM25 LexicalMatch if candidate appeared in lexical retrieval.",
    )

    # ── Fused Scoring ─────────────────────────────────────────────────────────
    retrieval_score: RetrievalScore = Field(
        default_factory=RetrievalScore,
        description="Complete scoring record across both retrieval channels.",
    )
    retrieval_rank: int = Field(
        0,
        ge=0,
        description=(
            "Final rank in the fused candidate pool (1-indexed). "
            "Value 0 is a transient pre-assignment sentinel used during pool construction."
        ),
    )

    # ── Evidence ──────────────────────────────────────────────────────────────
    matched_skills: List[str] = Field(
        default_factory=list,
        description="JD required skills found in the candidate profile.",
    )
    matched_keywords: List[str] = Field(
        default_factory=list,
        description="BM25 lexical keywords that matched the candidate document.",
    )
    coverage_score: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Fraction of JD required skills covered by this candidate. "
            "Example: JD has [Python, FAISS, Retrieval, Ranking]; candidate "
            "has [Python, FAISS, Retrieval] → coverage = 3/4 = 0.75."
        ),
    )

    # ── Provenance ────────────────────────────────────────────────────────────
    retrieval_source: str = Field(
        "hybrid",
        description="Source channel(s): 'semantic', 'lexical', or 'hybrid'.",
    )

    model_config = {
        "populate_by_name": True,
    }
