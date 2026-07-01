"""Retrieval Fusion service.

Aggregates semantic (FAISS) and lexical (BM25) ranked result lists into a
single unified ranking using one of three configurable strategies:

  1. rrf      — Reciprocal Rank Fusion (DEFAULT)
                Industry standard. No score calibration needed.

  2. weighted — Weighted linear combination of normalized scores.
                Requires min-max normalization of both channels first.
                Allows explicit semantic/lexical weight tuning.

  3. borda    — Borda Count.
                Assigns (N - rank) points per list; sums across lists.
                Simple, robust, no score calibration.

The fusion layer is intentionally stateless so any fusion strategy can be
swapped at runtime without rebuilding data structures.

Used by:
  - candidate_pool_generator.py  (primary consumer)
  - hybrid_retrieval_service.py  (orchestrator)
"""

from collections import defaultdict
from typing import Dict, List, Optional, Tuple
from models.search_result import SearchResult
from models.lexical_match import LexicalMatch
from models.retrieval_score import RetrievalScore
from services.reciprocal_rank_fusion import ReciprocalRankFusion
from services.score_normalizer import ScoreNormalizer
from utils.logger import get_logger

logger = get_logger(__name__)

# Default fusion weights for weighted fusion strategy
DEFAULT_SEMANTIC_WEIGHT: float = 0.6
DEFAULT_LEXICAL_WEIGHT: float = 0.4


class RetrievalFusion:
    """Combines semantic and lexical retrieval results into a unified ranked list.

    All public methods return a dict mapping candidate_id → RetrievalScore,
    making them composable and easy to inspect.
    """

    def __init__(
        self,
        rrf_k: int = 60,
        semantic_weight: float = DEFAULT_SEMANTIC_WEIGHT,
        lexical_weight: float = DEFAULT_LEXICAL_WEIGHT,
        default_strategy: str = "rrf",
    ) -> None:
        """Initializes the fusion engine.

        Args:
            rrf_k:              RRF smoothing constant (default 60).
            semantic_weight:    Weight for semantic scores in weighted fusion.
            lexical_weight:     Weight for lexical scores in weighted fusion.
            default_strategy:   Active strategy: 'rrf' | 'weighted' | 'borda'.
        """
        self.rrf = ReciprocalRankFusion(k=rrf_k)
        self.normalizer = ScoreNormalizer()
        self.semantic_weight = semantic_weight
        self.lexical_weight = lexical_weight
        self.default_strategy = default_strategy

        if abs((semantic_weight + lexical_weight) - 1.0) > 1e-6:
            logger.warning(
                f"Fusion weights do not sum to 1.0 "
                f"(semantic={semantic_weight}, lexical={lexical_weight}). "
                "Scores will be weighted as provided."
            )

    # ── Internal Helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _semantic_to_ranked(results: List[SearchResult]) -> List[Tuple[str, int]]:
        """Converts FAISS SearchResult list to (candidate_id, rank) pairs."""
        return [(r.candidate_id, r.rank) for r in results]

    @staticmethod
    def _lexical_to_ranked(results: List[LexicalMatch]) -> List[Tuple[str, int]]:
        """Converts BM25 LexicalMatch list to (candidate_id, rank) pairs."""
        return [(r.candidate_id, r.rank) for r in results]

    @staticmethod
    def _build_score_maps(
        semantic_results: List[SearchResult],
        lexical_results: List[LexicalMatch],
    ) -> Tuple[Dict[str, float], Dict[str, int], Dict[str, float], Dict[str, int]]:
        """Returns (sem_score_map, sem_rank_map, lex_score_map, lex_rank_map)."""
        sem_scores = {r.candidate_id: r.similarity_score for r in semantic_results}
        sem_ranks  = {r.candidate_id: r.rank for r in semantic_results}
        lex_scores = {r.candidate_id: r.bm25_score for r in lexical_results}
        lex_ranks  = {r.candidate_id: r.rank for r in lexical_results}
        return sem_scores, sem_ranks, lex_scores, lex_ranks

    # ── Strategy 1: RRF Fusion (Default) ─────────────────────────────────────

    def rrf_fusion(
        self,
        semantic_results: List[SearchResult],
        lexical_results: List[LexicalMatch],
        top_k: int = 5000,
    ) -> Dict[str, RetrievalScore]:
        """Fuses results using Reciprocal Rank Fusion.

        Args:
            semantic_results: FAISS SearchResult list.
            lexical_results:  BM25 LexicalMatch list.
            top_k:            Maximum candidates to return.

        Returns:
            Dict[str, RetrievalScore]: candidate_id → populated RetrievalScore.
        """
        sem_ranked = self._semantic_to_ranked(semantic_results)
        lex_ranked = self._lexical_to_ranked(lexical_results)

        fused = self.rrf.generate_fused_ranking(
            [sem_ranked, lex_ranked], top_k=top_k
        )

        sem_scores, sem_ranks, lex_scores, lex_ranks = self._build_score_maps(
            semantic_results, lexical_results
        )

        result: Dict[str, RetrievalScore] = {}
        for cand_id, rrf_score, _ in fused:
            result[cand_id] = RetrievalScore(
                semantic_score=sem_scores.get(cand_id, 0.0),
                bm25_score=lex_scores.get(cand_id, 0.0),
                semantic_rank=sem_ranks.get(cand_id),
                bm25_rank=lex_ranks.get(cand_id),
                rrf_score=round(rrf_score, 6),
                final_retrieval_score=round(rrf_score, 6),
                fusion_strategy="rrf",
                in_semantic_results=cand_id in sem_scores,
                in_lexical_results=cand_id in lex_scores,
            )
        return result

    # ── Strategy 2: Weighted Fusion ───────────────────────────────────────────

    def weighted_fusion(
        self,
        semantic_results: List[SearchResult],
        lexical_results: List[LexicalMatch],
        top_k: int = 5000,
        semantic_weight: Optional[float] = None,
        lexical_weight: Optional[float] = None,
    ) -> Dict[str, RetrievalScore]:
        """Fuses results using weighted linear combination of normalized scores.

        Args:
            semantic_results: FAISS SearchResult list.
            lexical_results:  BM25 LexicalMatch list.
            top_k:            Maximum candidates to return.
            semantic_weight:  Override instance semantic weight.
            lexical_weight:   Override instance lexical weight.

        Returns:
            Dict[str, RetrievalScore]: candidate_id → populated RetrievalScore.
        """
        w_sem = semantic_weight if semantic_weight is not None else self.semantic_weight
        w_lex = lexical_weight if lexical_weight is not None else self.lexical_weight

        sem_scores, sem_ranks, lex_scores, lex_ranks = self._build_score_maps(
            semantic_results, lexical_results
        )

        all_ids = sorted(list(set(sem_scores) | set(lex_scores)))

        # Normalize each channel independently
        sem_raw = [sem_scores.get(cid, 0.0) for cid in all_ids]
        lex_raw = [lex_scores.get(cid, 0.0) for cid in all_ids]

        sem_norm = ScoreNormalizer.min_max_normalization(sem_raw)
        lex_norm = ScoreNormalizer.min_max_normalization(lex_raw)

        scored: List[Tuple[str, float, float, float]] = []
        for idx, cand_id in enumerate(all_ids):
            nsem = sem_norm[idx]
            nlex = lex_norm[idx]
            combined = w_sem * nsem + w_lex * nlex
            scored.append((cand_id, combined, nsem, nlex))

        scored.sort(key=lambda x: x[1], reverse=True)
        scored = scored[:top_k]

        result: Dict[str, RetrievalScore] = {}
        for cand_id, combined, nsem, nlex in scored:
            result[cand_id] = RetrievalScore(
                semantic_score=sem_scores.get(cand_id, 0.0),
                bm25_score=lex_scores.get(cand_id, 0.0),
                normalized_semantic_score=round(nsem, 6),
                normalized_bm25_score=round(nlex, 6),
                semantic_rank=sem_ranks.get(cand_id),
                bm25_rank=lex_ranks.get(cand_id),
                weighted_fusion_score=round(combined, 6),
                final_retrieval_score=round(combined, 6),
                fusion_strategy="weighted",
                in_semantic_results=cand_id in sem_scores,
                in_lexical_results=cand_id in lex_scores,
            )
        return result

    # ── Strategy 3: Borda Count ───────────────────────────────────────────────

    def borda_fusion(
        self,
        semantic_results: List[SearchResult],
        lexical_results: List[LexicalMatch],
        top_k: int = 5000,
    ) -> Dict[str, RetrievalScore]:
        """Fuses results using Borda Count (N - rank points per list).

        Args:
            semantic_results: FAISS SearchResult list.
            lexical_results:  BM25 LexicalMatch list.
            top_k:            Maximum candidates to return.

        Returns:
            Dict[str, RetrievalScore]: candidate_id → populated RetrievalScore.
        """
        sem_scores, sem_ranks, lex_scores, lex_ranks = self._build_score_maps(
            semantic_results, lexical_results
        )

        n_sem = len(semantic_results)
        n_lex = len(lexical_results)
        all_ids = sorted(list(set(sem_scores) | set(lex_scores)))

        borda: Dict[str, float] = defaultdict(float)
        for cand_id in all_ids:
            if cand_id in sem_ranks:
                borda[cand_id] += n_sem - sem_ranks[cand_id]
            if cand_id in lex_ranks:
                borda[cand_id] += n_lex - lex_ranks[cand_id]

        sorted_borda = sorted(borda.items(), key=lambda x: x[1], reverse=True)[:top_k]

        result: Dict[str, RetrievalScore] = {}
        for cand_id, borda_score in sorted_borda:
            result[cand_id] = RetrievalScore(
                semantic_score=sem_scores.get(cand_id, 0.0),
                bm25_score=lex_scores.get(cand_id, 0.0),
                semantic_rank=sem_ranks.get(cand_id),
                bm25_rank=lex_ranks.get(cand_id),
                borda_score=round(borda_score, 4),
                final_retrieval_score=round(borda_score, 4),
                fusion_strategy="borda",
                in_semantic_results=cand_id in sem_scores,
                in_lexical_results=cand_id in lex_scores,
            )
        return result

    # ── Strategy Dispatcher ───────────────────────────────────────────────────

    def combine_results(
        self,
        semantic_results: List[SearchResult],
        lexical_results: List[LexicalMatch],
        strategy: Optional[str] = None,
        top_k: int = 5000,
    ) -> Dict[str, RetrievalScore]:
        """Dispatches to the correct fusion strategy.

        Args:
            semantic_results: FAISS results.
            lexical_results:  BM25 results.
            strategy:         Override fusion strategy ('rrf'|'weighted'|'borda').
                              Defaults to self.default_strategy.
            top_k:            Pool size cap.

        Returns:
            Dict[str, RetrievalScore]: Fused candidate scores.
        """
        active = strategy or self.default_strategy
        logger.info(
            f"Fusing {len(semantic_results)} semantic + {len(lexical_results)} "
            f"lexical results using strategy='{active}', top_k={top_k}."
        )

        dispatch = {
            "rrf":      self.rrf_fusion,
            "weighted": self.weighted_fusion,
            "borda":    self.borda_fusion,
        }

        if active not in dispatch:
            logger.warning(
                f"Unknown fusion strategy '{active}'. Falling back to 'rrf'."
            )
            active = "rrf"

        return dispatch[active](semantic_results, lexical_results, top_k=top_k)
