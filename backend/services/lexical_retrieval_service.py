"""Lexical Retrieval Orchestrator service.

Connects token matching, BM25 indices scoring, and query result mapping
into unified LexicalRetrievalResponse objects.
"""

import uuid
import time
from typing import Dict, List, Optional
from models.parsed_jd import ParsedJD
from models.lexical_retrieval_response import LexicalRetrievalResponse
from models.lexical_match import LexicalMatch
from services.bm25_search import Bm25Search
from services.bm25_statistics import Bm25Statistics
from utils.logger import get_logger

logger = get_logger(__name__)


class LexicalRetrievalService:
    """Orchestrator for candidate BM25 keyword matching and filtered retrieval."""

    def __init__(
        self,
        bm25_search: Optional[Bm25Search] = None,
        statistics: Optional[Bm25Statistics] = None,
    ):
        """Initializes the LexicalRetrievalService.

        Args:
            bm25_search: Bm25Search retrieval engine.
            statistics: Bm25Statistics reporting instance.
        """
        self.bm25_search = bm25_search or Bm25Search()
        self.statistics = statistics or Bm25Statistics(manager=self.bm25_search.manager)

    def retrieve_candidates(
        self, query_text: str, top_k: int = 10
    ) -> LexicalRetrievalResponse:
        """Runs lexical search query and returns sorted LexicalMatch lists.

        Args:
            query_text: Recruiter search query text.
            top_k: Maximum matches to retrieve.

        Returns:
            LexicalRetrievalResponse: Output search results.
        """
        query_id = f"Q_LEX_{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        # Run BM25 query
        results = self.bm25_search.search(query_text, top_k=top_k)
        duration_ms = (time.time() - start_time) * 1000.0

        info = self.bm25_search.manager.index_info()

        return LexicalRetrievalResponse(
            query_id=query_id,
            results=results,
            total_candidates=info["candidate_count"],
            retrieval_time_ms=round(duration_ms, 2),
            algorithm=info["algorithm"],
        )

    def retrieve_top_candidates(
        self, parsed_jd: ParsedJD, top_k: int = 10
    ) -> LexicalRetrievalResponse:
        """Retrieves candidates matching job description required keywords.

        Args:
            parsed_jd: Parsed job description requirements.
            top_k: Maximum matches.

        Returns:
            LexicalRetrievalResponse: Output search results.
        """
        # Compile JD requirements list into a query string
        must_skills = [req.name for req in parsed_jd.must_have]
        good_skills = [req.name for req in parsed_jd.good_to_have]
        query_text = " ".join(must_skills + good_skills)
        if not query_text.strip():
            query_text = parsed_jd.job_title

        return self.retrieve_candidates(query_text, top_k=top_k)

    def retrieve_with_filters(
        self,
        query_text: str,
        filters: Optional[Dict] = None,
        top_k: int = 10,
    ) -> LexicalRetrievalResponse:
        """Retrieves candidate BM25 matches and applies secondary profile filters.

        Args:
            query_text: Recruiter search query text.
            filters: Filtering criteria (e.g. {"min_experience": 5.0, "location": "Bangalore"}).
            top_k: Maximum matches to return.

        Returns:
            LexicalRetrievalResponse: Output search results.
        """
        query_id = f"Q_LEX_FILT_{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        # Retrieve a larger candidate pool to support post-filtering
        search_k = top_k * 5 if filters else top_k
        raw_results = self.bm25_search.search(query_text, top_k=search_k)

        filtered_results: List[LexicalMatch] = []
        
        # Load repository dynamically to fetch filters metadata
        from services.candidate_repository import JSONLCandidateRepository
        from config import Config
        dataset_path = Config.DATASET_PATH if hasattr(Config, "DATASET_PATH") else Path("d:/Engineering/Hackathon Projects/Finance Agent/[PUB] India_runs_data_and_ai_challenge/India_runs_data_and_ai_challenge/candidates.jsonl")
        repo = JSONLCandidateRepository(dataset_path)

        for res in raw_results:
            if filters:
                cand_id = res.candidate_id
                c = repo.find_by_id(cand_id)
                if not c:
                    continue

                # Experience filter
                if "min_experience" in filters:
                    if c.total_years_experience < filters["min_experience"]:
                        continue

                # Location filter
                if "location" in filters:
                    cand_loc = (c.profile.location or "").lower()
                    if filters["location"].lower() not in cand_loc:
                        continue

                # Open to Work filter
                if "open_to_work" in filters:
                    if c.is_open_to_work != filters["open_to_work"]:
                        continue

            filtered_results.append(res)
            if len(filtered_results) >= top_k:
                break

        # Re-assign ranks
        for idx, res in enumerate(filtered_results, 1):
            res.rank = idx

        duration_ms = (time.time() - start_time) * 1000.0
        info = self.bm25_search.manager.index_info()

        return LexicalRetrievalResponse(
            query_id=query_id,
            results=filtered_results,
            total_candidates=info["candidate_count"],
            retrieval_time_ms=round(duration_ms, 2),
            algorithm=info["algorithm"],
        )
