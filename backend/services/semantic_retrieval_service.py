"""Semantic Retrieval Orchestrator service.

Connects query embedding generation, vector database search,
and metadata mapping into a unified search response.
"""

import uuid
import time
from typing import Dict, List, Optional
from models.parsed_jd import ParsedJD
from models.retrieval_response import RetrievalResponse
from models.search_result import SearchResult
from services.embedding_service import EmbeddingService
from services.vector_search import VectorSearch
from services.vector_statistics import VectorStatistics
from utils.logger import get_logger

logger = get_logger(__name__)


class SemanticRetrievalService:
    """Orchestrator for candidate semantic search and filtered retrieval."""

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_search: Optional[VectorSearch] = None,
        statistics: Optional[VectorStatistics] = None,
    ):
        """Initializes the SemanticRetrievalService.

        Args:
            embedding_service: EmbeddingService orchestrator instance.
            vector_search: VectorSearch retrieval instance.
            statistics: VectorStatistics reporting instance.
        """
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_search = vector_search or VectorSearch()
        self.statistics = statistics or VectorStatistics()

    def retrieve_candidates(
        self,
        query_text: str,
        top_k: int = 10,
        model_name: str = "BAAI/bge-large-en-v1.5",
    ) -> RetrievalResponse:
        """Embeds natural language query text and retrieves top matched candidates.

        Args:
            query_text: Recruiter search query terms or summary.
            top_k: Maximum matches to return.
            model_name: Target embedding model.

        Returns:
            RetrievalResponse: Serialized results.
        """
        query_id = f"Q_{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        # 1. Embed query
        query_vector = self.embedding_service.generator.generate_embedding(
            query_text, model_name
        )

        # 2. Retrieve nearest neighbors
        results = self.vector_search.search(query_vector, top_k=top_k)
        duration_ms = (time.time() - start_time) * 1000.0

        info = self.vector_search.manager.index_info()

        return RetrievalResponse(
            query_id=query_id,
            results=results,
            total_candidates_searched=info["candidate_count"],
            search_time_ms=round(duration_ms, 2),
            index_type=info["index_type"],
        )

    def retrieve_top_candidates(
        self,
        parsed_jd: ParsedJD,
        top_k: int = 10,
        model_name: str = "BAAI/bge-large-en-v1.5",
    ) -> RetrievalResponse:
        """Retrieves top candidates matching structured recruiter intent specifications.

        Args:
            parsed_jd: Parsed job description requirements.
            top_k: Maximum matches.
            model_name: Target embedding model.

        Returns:
            RetrievalResponse: Serialized results.
        """
        query_text = self.embedding_service.generator.build_jd_embedding_text(parsed_jd)
        return self.retrieve_candidates(query_text, top_k=top_k, model_name=model_name)

    def retrieve_with_filters(
        self,
        query_text: str,
        filters: Optional[Dict] = None,
        top_k: int = 10,
        model_name: str = "BAAI/bge-large-en-v1.5",
    ) -> RetrievalResponse:
        """Retrieves candidates and applies secondary metadata filters (e.g. location, experience).

        Args:
            query_text: Natural language query terms.
            filters: Filtering criteria (e.g. {"location": "Bangalore", "min_experience": 5.0}).
            top_k: Maximum matches to return after filtering.
            model_name: Target embedding model.

        Returns:
            RetrievalResponse: Serialized results.
        """
        query_id = f"Q_FILT_{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        # Generate query vector
        query_vector = self.embedding_service.generator.generate_embedding(
            query_text, model_name
        )

        # If filtering, pull a larger candidate pool from index to allow post-filtering
        search_k = top_k * 5 if filters else top_k
        raw_results = self.vector_search.search(query_vector, top_k=search_k)

        filtered_results: List[SearchResult] = []
        store = self.vector_search.manager.vector_store

        # Evaluate candidate metadata against filters
        for res in raw_results:
            if filters:
                cand_id = res.candidate_id
                meta = store._metadata.get(cand_id, {})

                # Experience Filter
                if "min_experience" in filters:
                    cand_exp = meta.get("years_experience", 0.0)
                    if cand_exp < filters["min_experience"]:
                        continue

                # Location Filter
                if "location" in filters:
                    cand_loc = meta.get("location", "").lower()
                    if filters["location"].lower() not in cand_loc:
                        continue

                # Behavioral Fit Filter
                if "open_to_work" in filters:
                    is_open = meta.get("open_to_work_flag", True)
                    if is_open != filters["open_to_work"]:
                        continue

            filtered_results.append(res)
            if len(filtered_results) >= top_k:
                break

        # Re-assign ranks for filtered pool
        for idx, res in enumerate(filtered_results, 1):
            res.rank = idx

        duration_ms = (time.time() - start_time) * 1000.0
        info = self.vector_search.manager.index_info()

        return RetrievalResponse(
            query_id=query_id,
            results=filtered_results,
            total_candidates_searched=info["candidate_count"],
            search_time_ms=round(duration_ms, 2),
            index_type=info["index_type"],
        )
