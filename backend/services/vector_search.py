"""Vector Search engine service.

Implements query-to-vector matching, batch lookups, and score thresholds
against active FAISS indexes.
"""

import time
from typing import List, Optional
import numpy as np
import faiss
from models.search_result import SearchResult
from services.faiss_index_manager import FaissIndexManager
from utils.logger import get_logger

logger = get_logger(__name__)


class VectorSearch:
    """Retrieves top matching candidate vectors from loaded FAISS index."""

    def __init__(self, manager: Optional[FaissIndexManager] = None):
        """Initializes the VectorSearch service.

        Args:
            manager: FaissIndexManager instance.
        """
        self.manager = manager or FaissIndexManager()

    def search(self, query_embedding: List[float], top_k: int = 10) -> List[SearchResult]:
        """Searches the active FAISS index for the k-nearest candidate matches.

        Args:
            query_embedding: Float vector list of the query.
            top_k: Number of matches to retrieve (default 10).

        Returns:
            List[SearchResult]: Matched results sorted by similarity score.
        """
        index = self.manager.get_index()
        store = self.manager.vector_store

        if index is None or store.count_vectors() == 0:
            logger.warning("Active index is empty or uninitialized. Returning empty results.")
            return []

        # Prepare query array
        np_query = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(np_query)

        # Truncate top_k if index is smaller than requested limit to prevent FAISS padding
        actual_k = min(top_k, store.count_vectors(), 10000)
        if actual_k <= 0:
            return []

        # Measure query latency
        start_time = time.time()
        distances, indices = index.search(np_query, actual_k)
        duration_ms = (time.time() - start_time) * 1000.0

        results = []
        for idx in range(actual_k):
            vector_id = int(indices[0][idx])
            dist = float(distances[0][idx])

            # -1 indicates FAISS padding (no match found)
            if vector_id == -1:
                continue

            candidate_id = store.get_candidate_id(vector_id)
            if candidate_id is None:
                logger.warning(f"Vector ID {vector_id} returned by FAISS has no mapping in VectorStore.")
                continue

            # In L2 normalized inner product metric, distance equals cosine similarity
            sim_score = float(np.clip(dist, -1.0, 1.0))

            results.append(
                SearchResult(
                    candidate_id=candidate_id,
                    similarity_score=round(sim_score, 4),
                    rank=1,  # Will be assigned after deterministic sort
                    distance=dist,
                    search_time_ms=round(duration_ms, 2),
                )
            )

        # Deterministic sort to break ties stably using candidate_id
        results.sort(key=lambda r: (-r.similarity_score, r.candidate_id))
        for idx, res in enumerate(results):
            res.rank = idx + 1

        return results

    def search_batch(
        self, query_embeddings: List[List[float]], top_k: int = 10
    ) -> List[List[SearchResult]]:
        """Processes multiple search queries concurrently in a single FAISS batch call.

        Args:
            query_embeddings: List of float vector lists.
            top_k: Number of matches to retrieve per query.

        Returns:
            List[List[SearchResult]]: Grouped candidate search results.
        """
        index = self.manager.get_index()
        store = self.manager.vector_store

        if index is None or store.count_vectors() == 0 or not query_embeddings:
            return [[] for _ in query_embeddings]

        np_queries = np.array(query_embeddings, dtype=np.float32)
        faiss.normalize_L2(np_queries)

        actual_k = min(top_k, store.count_vectors(), 10000)
        if actual_k <= 0:
            return [[] for _ in query_embeddings]

        start_time = time.time()
        distances, indices = index.search(np_queries, actual_k)
        duration_ms = ((time.time() - start_time) * 1000.0) / len(query_embeddings)

        grouped_results = []
        for query_idx in range(len(query_embeddings)):
            query_results = []
            for k_idx in range(actual_k):
                vector_id = int(indices[query_idx][k_idx])
                dist = float(distances[query_idx][k_idx])

                if vector_id == -1:
                    continue

                candidate_id = store.get_candidate_id(vector_id)
                if candidate_id is None:
                    continue

                sim_score = float(np.clip(dist, -1.0, 1.0))
                query_results.append(
                    SearchResult(
                        candidate_id=candidate_id,
                        similarity_score=round(sim_score, 4),
                        rank=k_idx + 1,
                        distance=dist,
                        search_time_ms=round(duration_ms, 2),
                    )
                )
            grouped_results.append(query_results)

        return grouped_results

    def search_with_threshold(
        self, query_embedding: List[float], threshold: float, top_k: int = 10
    ) -> List[SearchResult]:
        """Searches index and excludes results falling below similarity threshold limit.

        Args:
            query_embedding: Float vector list of query.
            threshold: Minimum acceptable cosine similarity score limit.
            top_k: Maximum matches to check.
        """
        results = self.search(query_embedding, top_k=top_k)
        filtered = [res for res in results if res.similarity_score >= threshold]
        # Re-assign rank numbers after filtering
        for idx, res in enumerate(filtered, 1):
            res.rank = idx
        return filtered
