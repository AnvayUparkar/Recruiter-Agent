"""Ranking Metrics service — Phase 13: Final Recruiter Ranking Engine.

Calculates search/ranking quality metrics (NDCG, Precision@K, MRR) against ground truth relevance labels.
"""

import math
from typing import List, Dict, Any
from models.ranked_candidate import RankedCandidate
from utils.logger import get_logger

logger = get_logger(__name__)


class RankingMetrics:
    """Calculates information retrieval (IR) and ranking quality metrics."""

    @staticmethod
    def calculate_ndcg(
        ranked_candidates: List[RankedCandidate],
        ground_truth: Dict[str, int],
        k: int = 5,
    ) -> float:
        """Computes Normalized Discounted Cumulative Gain (NDCG@K).

        Args:
            ranked_candidates: Sorted list of RankedCandidate objects.
            ground_truth: Mapping of candidate_id to relevance score (e.g. 0 to 3).
            k: Cutoff rank.

        Returns:
            float: NDCG value in [0.0, 1.0].
        """
        if not ranked_candidates or not ground_truth or k <= 0:
            return 0.0

        # Calculate DCG@K
        dcg = 0.0
        for i, candidate in enumerate(ranked_candidates[:k]):
            rel = ground_truth.get(candidate.candidate_id, 0)
            # Standard DCG formula: rel_i / log2(i + 2)
            dcg += rel / math.log2(i + 2)

        # Calculate IDCG@K (Ideal DCG@K)
        # Sort all available ground truth relevance values in descending order
        ideal_relevance = sorted(ground_truth.values(), reverse=True)
        idcg = 0.0
        for i, rel in enumerate(ideal_relevance[:k]):
            idcg += rel / math.log2(i + 2)

        if idcg == 0.0:
            return 0.0

        return round(dcg / idcg, 4)

    @staticmethod
    def calculate_precision_at_k(
        ranked_candidates: List[RankedCandidate],
        ground_truth: Dict[str, int],
        k: int = 5,
        relevance_threshold: int = 1,
    ) -> float:
        """Computes Precision@K (ratio of relevant candidates in top K).

        Args:
            ranked_candidates: Sorted list of RankedCandidate objects.
            ground_truth: Mapping of candidate_id to relevance score.
            k: Cutoff rank.
            relevance_threshold: Relevance score required to count as relevant.

        Returns:
            float: Precision@K in [0.0, 1.0].
        """
        if not ranked_candidates or not ground_truth or k <= 0:
            return 0.0

        subset = ranked_candidates[:k]
        relevant_count = sum(
            1 for c in subset if ground_truth.get(c.candidate_id, 0) >= relevance_threshold
        )
        return round(relevant_count / len(subset), 4)

    @staticmethod
    def calculate_mrr(
        ranked_candidates: List[RankedCandidate],
        ground_truth: Dict[str, int],
        relevance_threshold: int = 1,
    ) -> float:
        """Computes Mean Reciprocal Rank (MRR).

        Args:
            ranked_candidates: Sorted list of RankedCandidate objects.
            ground_truth: Mapping of candidate_id to relevance score.
            relevance_threshold: Relevance score required to count as relevant.

        Returns:
            float: MRR value.
        """
        if not ranked_candidates or not ground_truth:
            return 0.0

        for i, candidate in enumerate(ranked_candidates):
            rel = ground_truth.get(candidate.candidate_id, 0)
            if rel >= relevance_threshold:
                # Reciprocal rank is 1 / rank
                return round(1.0 / (i + 1), 4)

        return 0.0

    @classmethod
    def evaluate_all(
        cls,
        ranked_candidates: List[RankedCandidate],
        ground_truth: Dict[str, int],
        k: int = 5,
    ) -> Dict[str, float]:
        """Runs NDCG, Precision@K, and MRR.

        Args:
            ranked_candidates: Sorted list of RankedCandidate objects.
            ground_truth: Mapping of candidate_id to relevance.
            k: Cutoff rank.

        Returns:
            Dict[str, float]: Evaluated metrics.
        """
        return {
            f"ndcg_at_{k}": cls.calculate_ndcg(ranked_candidates, ground_truth, k),
            f"precision_at_{k}": cls.calculate_precision_at_k(ranked_candidates, ground_truth, k),
            "mrr": cls.calculate_mrr(ranked_candidates, ground_truth),
        }
