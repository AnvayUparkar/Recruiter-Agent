"""Reciprocal Rank Fusion (RRF) service.

RRF is the industry-standard, parameter-light technique for combining
multiple ranked lists without requiring score calibration.

Formula per candidate c across n ranked lists:
    RRF(c) = Σ_{i=1}^{n}  1 / (k + rank_i(c))

where k = 60 is the recommended constant (Cormack et al., 2009) that
smooths the contribution of ranks and prevents top-ranked candidates from
dominating too heavily.

Key properties:
  - No score calibration needed — only rank positions matter.
  - Naturally handles candidates missing from one list (they simply
    do not contribute that term to the sum).
  - k=60 is the standard default; the class accepts any positive k.

Used by:
  - retrieval_fusion.py  (default fusion strategy)
  - candidate_pool_generator.py  (pool ordering)
"""

from collections import defaultdict
from typing import Dict, List, Tuple
from utils.logger import get_logger

logger = get_logger(__name__)

# Industry-standard RRF smoothing constant (Cormack et al., 2009)
DEFAULT_K: int = 60


class ReciprocalRankFusion:
    """Implements Reciprocal Rank Fusion over arbitrary numbers of ranked lists."""

    def __init__(self, k: int = DEFAULT_K) -> None:
        """Initializes RRF with smoothing constant k.

        Args:
            k: Smoothing constant. Higher k reduces the advantage of top ranks.
               Default 60 matches the original paper recommendation.
        """
        if k <= 0:
            raise ValueError(f"RRF constant k must be positive, got {k}.")
        self.k = k
        logger.debug(f"ReciprocalRankFusion initialized with k={self.k}.")

    # ── Core Formula ──────────────────────────────────────────────────────────

    def calculate_rrf_score(self, rank: int) -> float:
        """Computes the RRF contribution of a single rank position.

        Args:
            rank: 1-indexed rank position.

        Returns:
            float: 1 / (k + rank)
        """
        return 1.0 / (self.k + rank)

    # ── Fuse Two Ranked Lists ─────────────────────────────────────────────────

    def fuse_two_rankings(
        self,
        list_a: List[Tuple[str, int]],
        list_b: List[Tuple[str, int]],
    ) -> Dict[str, float]:
        """Fuses exactly two (candidate_id, rank) lists via RRF.

        Args:
            list_a: List of (candidate_id, rank) from retrieval system A.
            list_b: List of (candidate_id, rank) from retrieval system B.

        Returns:
            Dict[str, float]: candidate_id → cumulative RRF score.
        """
        return self.fuse_rankings([list_a, list_b])

    # ── Fuse Arbitrary Lists ──────────────────────────────────────────────────

    def fuse_rankings(
        self,
        ranked_lists: List[List[Tuple[str, int]]],
    ) -> Dict[str, float]:
        """Fuses N ranked lists of (candidate_id, rank) pairs using RRF.

        Candidates missing from a list simply receive no contribution from
        that list — they are NOT penalized.

        Args:
            ranked_lists: Each inner list is a sequence of (candidate_id, rank)
                          tuples from one retrieval channel, already in rank order.

        Returns:
            Dict[str, float]: Mapping of candidate_id → cumulative RRF score
                              (higher = more relevant).
        """
        rrf_scores: Dict[str, float] = defaultdict(float)

        for ranked_list in ranked_lists:
            for candidate_id, rank in ranked_list:
                contribution = self.calculate_rrf_score(rank)
                rrf_scores[candidate_id] += contribution

        logger.debug(
            f"RRF fused {len(ranked_lists)} lists, produced {len(rrf_scores)} unique candidates."
        )
        return dict(rrf_scores)

    # ── Generate Ordered Fused Ranking ────────────────────────────────────────

    def generate_fused_ranking(
        self,
        ranked_lists: List[List[Tuple[str, int]]],
        top_k: int = 5000,
    ) -> List[Tuple[str, float, int]]:
        """Fuses N ranked lists and returns a sorted result list.

        Args:
            ranked_lists: Each inner list is (candidate_id, rank) from one system.
            top_k: Maximum candidates to return (default 5000 for pool generation).

        Returns:
            List[Tuple[str, float, int]]: Each element is
                (candidate_id, rrf_score, final_rank) sorted by rrf_score DESC.
        """
        raw_scores = self.fuse_rankings(ranked_lists)

        sorted_candidates = sorted(
            raw_scores.items(),
            key=lambda x: x[1],
            reverse=True,
        )[:top_k]

        result = [
            (cand_id, score, rank_pos)
            for rank_pos, (cand_id, score) in enumerate(sorted_candidates, start=1)
        ]

        logger.debug(
            f"RRF generate_fused_ranking: {len(result)} candidates (top_k={top_k})."
        )
        return result

    # ── Convenience: Score per (id, rank) dict ────────────────────────────────

    def score_dict_to_ranked_list(
        self, score_dict: Dict[str, float]
    ) -> List[Tuple[str, int]]:
        """Converts a {candidate_id: score} dict to a [(id, rank)] ranked list.

        Useful for re-ranking existing scored results before feeding into RRF.

        Args:
            score_dict: Mapping of candidate_id to raw retrieval score.

        Returns:
            List[Tuple[str, int]]: Sorted (id, rank) pairs, rank 1 = highest score.
        """
        sorted_items = sorted(score_dict.items(), key=lambda x: x[1], reverse=True)
        return [(cand_id, rank) for rank, (cand_id, _) in enumerate(sorted_items, start=1)]
