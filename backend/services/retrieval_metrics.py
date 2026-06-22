"""Retrieval Metrics service.

Measures the quality of the hybrid retrieval pipeline after each pool
generation. Metrics serve two purposes:

  1. Offline Evaluation  — compare retrieval system versions.
  2. Runtime Monitoring  — detect degraded retrieval quality in production.

Metrics Computed:
  - semantic_recall         : fraction of semantic candidates in final pool
  - lexical_recall          : fraction of lexical candidates in final pool
  - fusion_recall           : total unique candidates / union of both channels
  - candidate_coverage      : average JD skill coverage across the pool
  - retrieval_diversity     : fraction of candidates from at least one unique
                              channel (not both) — measures complementarity
  - average_skill_coverage  : alias for candidate_coverage (explicit label)

Used by:
  - hybrid_retrieval_service.py  (generates report per request)
  - offline evaluation scripts
"""

from typing import Dict, List, Optional
from models.hybrid_candidate import HybridCandidate
from models.search_result import SearchResult
from models.lexical_match import LexicalMatch
from utils.logger import get_logger

logger = get_logger(__name__)


class RetrievalMetrics:
    """Computes quality metrics for a hybrid retrieval pool."""

    def __init__(
        self,
        semantic_results: Optional[List[SearchResult]] = None,
        lexical_results: Optional[List[LexicalMatch]] = None,
        fused_candidates: Optional[List[HybridCandidate]] = None,
    ) -> None:
        """Initializes with retrieval outputs for metric computation.

        Args:
            semantic_results:  Raw FAISS results before fusion.
            lexical_results:   Raw BM25 results before fusion.
            fused_candidates:  Final fused pool after deduplication.
        """
        self.semantic_results = semantic_results or []
        self.lexical_results = lexical_results or []
        self.fused_candidates = fused_candidates or []

    # ── Individual Metrics ────────────────────────────────────────────────────

    def semantic_recall(self) -> float:
        """Fraction of semantic candidates that appear in the final fused pool.

        Returns:
            float: Recall in [0.0, 1.0]. 0.0 if no semantic results.
        """
        if not self.semantic_results:
            return 0.0
        sem_ids = {r.candidate_id for r in self.semantic_results}
        pool_ids = {c.candidate_id for c in self.fused_candidates}
        return round(len(sem_ids & pool_ids) / len(sem_ids), 4)

    def lexical_recall(self) -> float:
        """Fraction of lexical candidates that appear in the final fused pool.

        Returns:
            float: Recall in [0.0, 1.0]. 0.0 if no lexical results.
        """
        if not self.lexical_results:
            return 0.0
        lex_ids = {r.candidate_id for r in self.lexical_results}
        pool_ids = {c.candidate_id for c in self.fused_candidates}
        return round(len(lex_ids & pool_ids) / len(lex_ids), 4)

    def fusion_recall(self) -> float:
        """Fraction of the union of both channels captured in the fused pool.

        Measures how much of the total candidate space (from both retrieval
        channels) survived the fusion + filtering pipeline.

        Returns:
            float: Recall in [0.0, 1.0]. 0.0 if both channels empty.
        """
        sem_ids = {r.candidate_id for r in self.semantic_results}
        lex_ids = {r.candidate_id for r in self.lexical_results}
        total_union = sem_ids | lex_ids
        if not total_union:
            return 0.0
        pool_ids = {c.candidate_id for c in self.fused_candidates}
        return round(len(pool_ids & total_union) / len(total_union), 4)

    def candidate_coverage(self) -> float:
        """Average JD skill coverage score across all fused pool candidates.

        Returns:
            float: Mean coverage in [0.0, 1.0]. 0.0 if pool is empty.
        """
        if not self.fused_candidates:
            return 0.0
        total = sum(c.coverage_score for c in self.fused_candidates)
        return round(total / len(self.fused_candidates), 4)

    def retrieval_diversity(self) -> float:
        """Measures complementarity: fraction of candidates from exactly one channel.

        A high diversity score indicates that FAISS and BM25 are finding
        different candidates (healthy complementarity). A low score means
        they mostly agree.

        Returns:
            float: Diversity in [0.0, 1.0]. 0.0 if pool is empty.
        """
        if not self.fused_candidates:
            return 0.0
        single_source = sum(
            1 for c in self.fused_candidates if c.retrieval_source != "hybrid"
        )
        return round(single_source / len(self.fused_candidates), 4)

    def average_skill_coverage(self) -> float:
        """Alias for candidate_coverage() with an explicit label."""
        return self.candidate_coverage()

    # ── Report Generation ─────────────────────────────────────────────────────

    def calculate_metrics(self) -> Dict[str, float]:
        """Computes all metrics and returns a flat dictionary.

        Returns:
            Dict[str, float]: All metric names → values.
        """
        return {
            "semantic_recall": self.semantic_recall(),
            "lexical_recall": self.lexical_recall(),
            "fusion_recall": self.fusion_recall(),
            "candidate_coverage": self.candidate_coverage(),
            "retrieval_diversity": self.retrieval_diversity(),
            "average_skill_coverage": self.average_skill_coverage(),
        }

    def generate_report(self) -> Dict:
        """Generates a comprehensive retrieval quality report.

        Returns:
            Dict: Metrics plus candidate count breakdowns.
        """
        metrics = self.calculate_metrics()

        sem_ids = {r.candidate_id for r in self.semantic_results}
        lex_ids = {r.candidate_id for r in self.lexical_results}
        pool_ids = {c.candidate_id for c in self.fused_candidates}

        report = {
            **metrics,
            "total_semantic_results": len(self.semantic_results),
            "total_lexical_results": len(self.lexical_results),
            "total_fused_candidates": len(self.fused_candidates),
            "union_size": len(sem_ids | lex_ids),
            "intersection_size": len(sem_ids & lex_ids),
            "semantic_only_in_pool": len(
                {c.candidate_id for c in self.fused_candidates if c.retrieval_source == "semantic"}
            ),
            "lexical_only_in_pool": len(
                {c.candidate_id for c in self.fused_candidates if c.retrieval_source == "lexical"}
            ),
            "hybrid_in_pool": len(
                {c.candidate_id for c in self.fused_candidates if c.retrieval_source == "hybrid"}
            ),
        }

        logger.debug(f"RetrievalMetrics report: {report}")
        return report
