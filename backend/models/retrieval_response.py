"""Retrieval Response model definition.

Defines the structure for representing the complete results of a semantic query search.
"""

from typing import List
from pydantic import BaseModel, Field
from models.search_result import SearchResult


class RetrievalResponse(BaseModel):
    """Pydantic model representing the overall response of a vector index retrieval query."""

    query_id: str = Field(
        ...,
        description="Unique identifier tracking the search request query.",
    )
    results: List[SearchResult] = Field(
        default_factory=list,
        description="Ordered list of matched candidate search results.",
    )
    total_candidates_searched: int = Field(
        ...,
        ge=0,
        description="Total capacity size of the FAISS index searched.",
    )
    search_time_ms: float = Field(
        ...,
        ge=0.0,
        description="Total query search duration in milliseconds.",
    )
    index_type: str = Field(
        ...,
        description="The indexing strategy used during search.",
    )

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": (),
    }
