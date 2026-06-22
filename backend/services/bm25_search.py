"""BM25 Search engine service.

Implements query token mapping, scoring, threshold filtering,
and LexicalMatch serialization against active BM25 indexes.
"""

import time
from typing import List, Optional
import numpy as np
from models.lexical_match import LexicalMatch
from services.bm25_index_manager import Bm25IndexManager
from services.bm25_tokenizer import Bm25Tokenizer
from services.keyword_matcher import KeywordMatcher
from utils.logger import get_logger

logger = get_logger(__name__)


class Bm25Search:
    """Retrieves top matching candidate documents from loaded BM25 index."""

    def __init__(
        self,
        manager: Optional[Bm25IndexManager] = None,
        keyword_matcher: Optional[KeywordMatcher] = None,
    ):
        """Initializes the Bm25Search service.

        Args:
            manager: Bm25IndexManager instance.
            keyword_matcher: KeywordMatcher instance.
        """
        self.manager = manager or Bm25IndexManager()
        self.tokenizer = self.manager.tokenizer
        self.keyword_matcher = keyword_matcher or KeywordMatcher(tokenizer=self.tokenizer)

    def search(self, query_text: str, top_k: int = 10) -> List[LexicalMatch]:
        """Searches the active BM25 index for the k-highest lexical candidate matches.

        Args:
            query_text: Recruiter search query text.
            top_k: Number of matches to retrieve.

        Returns:
            List[LexicalMatch]: Matched results sorted by BM25 score descending.
        """
        index = self.manager.get_index()
        if index is None or len(self.manager.candidate_ids) == 0:
            logger.warning("Active BM25 index is empty or uninitialized.")
            return []

        query_tokens = self.tokenizer.tokenize(query_text)
        if not query_tokens:
            return []

        start_time = time.time()
        # Compute BM25 scores across entire corpus
        scores = index.get_scores(query_tokens)
        duration_ms = (time.time() - start_time) * 1000.0

        # Only check the top-K candidates to avoid tokenizing the entire matching corpus!
        num_candidates = len(scores)
        # Cap top_k to 10000 maximum to ensure fast execution
        search_k = min(top_k, num_candidates, 10000)
        if search_k <= 0:
            return []

        # Partition indices to get the top search_k indices (unordered)
        top_indices = np.argpartition(scores, -search_k)[-search_k:]
        # Sort only these top candidates descending
        top_indices = top_indices[np.argsort(scores[top_indices])[::-1]]

        results = []
        rank = 1
        for idx in top_indices:
            score = float(scores[idx])
            # A score of 0.0 means no matching terms; skip
            if score <= 0.0:
                continue

            cand_id = self.manager.candidate_ids[idx]
            doc = self.manager.documents[idx]

            # Parse exact matched terms
            doc_tokens = self.tokenizer.tokenize(doc)
            matched_terms, match_count, coverage = self.keyword_matcher.find_exact_matches(
                doc_tokens, query_tokens
            )

            reason = (
                f"Matched {len(matched_terms)}/{len(query_tokens)} terms: {', '.join(matched_terms)}. "
                f"Total matches count in document: {match_count}. Coverage: {coverage:.2f}."
            )

            results.append(
                LexicalMatch(
                    candidate_id=cand_id,
                    bm25_score=round(score, 2),
                    matched_terms=matched_terms,
                    match_count=match_count,
                    rank=rank,
                    retrieval_reason=reason,
                )
            )
            rank += 1
            if len(results) >= search_k:
                break

        return results

    def search_batch(
        self, query_texts: List[str], top_k: int = 10
    ) -> List[List[LexicalMatch]]:
        """Processes multiple search queries in a batch.

        Args:
            query_texts: List of search query strings.
            top_k: Number of matches per query.

        Returns:
            List[List[LexicalMatch]]: Grouped candidate matches.
        """
        return [self.search(q, top_k=top_k) for q in query_texts]

    def search_with_threshold(
        self, query_text: str, threshold: float, top_k: int = 10
    ) -> List[LexicalMatch]:
        """Searches index and excludes results falling below the score threshold.

        Args:
            query_text: Recruiter search query text.
            threshold: Minimum acceptable BM25 score limit.
            top_k: Maximum matches to retrieve.
        """
        results = self.search(query_text, top_k=top_k)
        filtered = [res for res in results if res.bm25_score >= threshold]
        # Re-assign ranks
        for idx, res in enumerate(filtered, 1):
            res.rank = idx
        return filtered
