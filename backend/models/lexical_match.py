"""Lexical Match model definition.

Defines the structure for representing a candidate BM25 lexical match.
"""

from typing import List
from pydantic import BaseModel, Field


class LexicalMatch(BaseModel):
    """Pydantic model representing the outcome of a lexical BM25 matching computation."""

    candidate_id: str = Field(
        ...,
        description="The candidate identifier matched.",
    )
    bm25_score: float = Field(
        ...,
        ge=0.0,
        description="The raw score calculated by the BM25 algorithm.",
    )
    matched_terms: List[str] = Field(
        default_factory=list,
        description="List of exact query words that matched candidate details.",
    )
    match_count: int = Field(
        0,
        ge=0,
        description="Total occurrences of matched terms in the candidate document.",
    )
    rank: int = Field(
        ...,
        ge=1,
        description="Rank position in the retrieval list.",
    )
    retrieval_reason: str = Field(
        ...,
        description="Natural language explanation of what keywords matched and their coverage.",
    )

    model_config = {
        "populate_by_name": True,
    }
