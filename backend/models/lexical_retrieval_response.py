"""Lexical Retrieval Response model definition.

Defines the structure for representing the complete results of a BM25 query search.
"""

from typing import List
from pydantic import BaseModel, Field
from models.lexical_match import LexicalMatch


class LexicalRetrievalResponse(BaseModel):
    """Pydantic model representing the overall response of a BM25 lexical search query."""

    query_id: str = Field(
        ...,
        description="Unique identifier tracking the search request query.",
    )
    results: List[LexicalMatch] = Field(
        default_factory=list,
        description="Ordered list of candidate lexical matches.",
    )
    total_candidates: int = Field(
        ...,
        ge=0,
        description="Total capacity size of the BM25 index searched.",
    )
    retrieval_time_ms: float = Field(
        ...,
        ge=0.0,
        description="Total query search duration in milliseconds.",
    )
    algorithm: str = Field(
        ...,
        description="The BM25 variant algorithm used during search.",
    )

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": (),
    }
