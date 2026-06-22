"""Hybrid Retriever service.

A lean adapter that wraps both the SemanticRetrievalService (FAISS) and the
LexicalRetrievalService (BM25) and fires both retrievals, optionally in
parallel, returning raw per-channel results.

Responsibilities:
  - Run semantic retrieval (JD text → embedding → FAISS k-NN)
  - Run lexical retrieval  (JD keywords → BM25 get_scores)
  - Return raw results from both channels

This layer does NOT fuse or filter — it only retrieves.
Fusion and filtering are handled by RetrievalFusion and CandidatePoolGenerator.

Used by:
  - hybrid_retrieval_service.py  (primary consumer)
"""

import time
from typing import List, Optional, Tuple
from models.lexical_match import LexicalMatch
from models.parsed_jd import ParsedJD
from models.search_result import SearchResult
from services.semantic_retrieval_service import SemanticRetrievalService
from services.lexical_retrieval_service import LexicalRetrievalService
from utils.logger import get_logger

logger = get_logger(__name__)


class HybridRetriever:
    """Dual-channel retriever: fires FAISS and BM25 searches for a given JD."""

    def __init__(
        self,
        semantic_service: Optional[SemanticRetrievalService] = None,
        lexical_service: Optional[LexicalRetrievalService] = None,
    ) -> None:
        """Initializes both retrieval services.

        Args:
            semantic_service: SemanticRetrievalService (FAISS).
            lexical_service:  LexicalRetrievalService (BM25).
        """
        self.semantic_service = semantic_service or SemanticRetrievalService()
        self.lexical_service = lexical_service or LexicalRetrievalService()

    def retrieve_semantic(
        self,
        query_text: str,
        top_k: int = 5000,
        model_name: str = "BAAI/bge-large-en-v1.5",
    ) -> Tuple[List[SearchResult], float]:
        """Runs FAISS semantic retrieval for the given query text.

        Args:
            query_text: JD-derived natural language query.
            top_k:      Maximum candidates to retrieve.
            model_name: Embedding model to use.

        Returns:
            Tuple[List[SearchResult], float]: Results and elapsed time in ms.
        """
        start = time.time()
        response = self.semantic_service.retrieve_candidates(
            query_text, top_k=top_k, model_name=model_name
        )
        elapsed_ms = round((time.time() - start) * 1000.0, 2)
        logger.info(
            f"HybridRetriever.semantic: {len(response.results)} candidates "
            f"in {elapsed_ms}ms."
        )
        return response.results, elapsed_ms

    def retrieve_lexical(
        self,
        query_text: str,
        top_k: int = 5000,
    ) -> Tuple[List[LexicalMatch], float]:
        """Runs BM25 lexical retrieval for the given query text.

        Args:
            query_text: JD keyword string.
            top_k:      Maximum candidates to retrieve.

        Returns:
            Tuple[List[LexicalMatch], float]: Results and elapsed time in ms.
        """
        start = time.time()
        response = self.lexical_service.retrieve_candidates(query_text, top_k=top_k)
        elapsed_ms = round((time.time() - start) * 1000.0, 2)
        logger.info(
            f"HybridRetriever.lexical: {len(response.results)} candidates "
            f"in {elapsed_ms}ms."
        )
        return response.results, elapsed_ms

    def retrieve_both(
        self,
        jd_query_text: str,
        jd_keyword_text: str,
        top_k: int = 5000,
        model_name: str = "BAAI/bge-large-en-v1.5",
    ) -> Tuple[List[SearchResult], List[LexicalMatch], float, float]:
        """Fires both retrieval channels sequentially.

        Note: Parallel execution (asyncio / ThreadPoolExecutor) can be
        added here in a future performance phase without changing the
        public interface.

        Args:
            jd_query_text:   Long-form JD text for semantic embedding.
            jd_keyword_text: Keyword string for BM25 lexical retrieval.
            top_k:           Maximum candidates per channel.
            model_name:      Embedding model.

        Returns:
            Tuple containing:
              - List[SearchResult]: Semantic results.
              - List[LexicalMatch]: Lexical results.
              - float: Semantic retrieval time (ms).
              - float: Lexical retrieval time (ms).
        """
        sem_results, sem_ms = self.retrieve_semantic(
            jd_query_text, top_k=top_k, model_name=model_name
        )
        lex_results, lex_ms = self.retrieve_lexical(
            jd_keyword_text, top_k=top_k
        )
        return sem_results, lex_results, sem_ms, lex_ms

    def retrieve_from_jd(
        self,
        parsed_jd: ParsedJD,
        top_k: int = 5000,
        model_name: str = "BAAI/bge-large-en-v1.5",
    ) -> Tuple[List[SearchResult], List[LexicalMatch], float, float]:
        """Builds query texts from a ParsedJD and fires both channels.

        JD query text  = summary + must-have + good-to-have requirement names.
        JD keyword text= must-have requirement names only (for BM25 precision).

        Args:
            parsed_jd:  Parsed job description.
            top_k:      Maximum candidates per channel.
            model_name: Embedding model.

        Returns:
            Tuple[semantic_results, lexical_results, sem_ms, lex_ms].
        """
        # Semantic: rich long-form text
        parts = [parsed_jd.summary, parsed_jd.job_title]
        parts += [req.name for req in parsed_jd.must_have]
        parts += [req.name for req in parsed_jd.good_to_have]
        jd_query_text = " ".join(p for p in parts if p)

        # Lexical: keyword-focused for BM25 precision
        keyword_parts = [req.name for req in parsed_jd.must_have]
        keyword_parts += [req.name for req in parsed_jd.good_to_have]
        jd_keyword_text = " ".join(keyword_parts) or parsed_jd.job_title

        return self.retrieve_both(
            jd_query_text, jd_keyword_text, top_k=top_k, model_name=model_name
        )
