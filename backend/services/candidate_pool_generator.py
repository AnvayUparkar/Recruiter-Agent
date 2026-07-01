"""Candidate Pool Generator service.

Orchestrates the complete fusion → deduplication → coverage calculation →
filtering → pool construction pipeline.

Pipeline:
  Semantic Results  +  Lexical Results
         ↓
  RetrievalFusion  (RRF / weighted / borda)
         ↓
  Deduplication    (merge scores from both channels)
         ↓
  Skill Coverage   (matched_skills, coverage_score per candidate)
         ↓
  RetrievalFilters (drop obviously irrelevant candidates)
         ↓
  Pool Statistics  (diversity, source breakdown)
         ↓
  CandidatePool    (top 5000, ranked)

Used by:
  - hybrid_retrieval_service.py  (primary consumer)
"""

import time
from typing import Dict, List, Optional, Set
from models.candidate_pool import CandidatePool, PoolStatistics
from models.hybrid_candidate import HybridCandidate
from models.lexical_match import LexicalMatch
from models.parsed_jd import ParsedJD
from models.retrieval_score import RetrievalScore
from models.search_result import SearchResult
from services.retrieval_fusion import RetrievalFusion
from services.retrieval_filters import RetrievalFilters
from utils.logger import get_logger

logger = get_logger(__name__)

DEFAULT_POOL_SIZE: int = 5000


class CandidatePoolGenerator:
    """Generates ranked HybridCandidate pools from semantic and lexical results."""

    def __init__(
        self,
        fusion: Optional[RetrievalFusion] = None,
        filters: Optional[RetrievalFilters] = None,
        pool_size: int = DEFAULT_POOL_SIZE,
    ) -> None:
        """Initializes the generator.

        Args:
            fusion:    RetrievalFusion instance (defaults to RRF).
            filters:   RetrievalFilters instance (defaults to pass-all).
            pool_size: Maximum candidates to include in the output pool.
        """
        self.fusion = fusion or RetrievalFusion()
        self.filters = filters or RetrievalFilters()
        self.pool_size = pool_size

    # ── Coverage Calculation ──────────────────────────────────────────────────

    @staticmethod
    def calculate_coverage(
        matched_skills: List[str],
        required_skills: Set[str],
    ) -> float:
        """Computes the fraction of JD required skills covered by a candidate.

        Formula: |matched ∩ required| / |required|

        Example:
            required = {python, faiss, retrieval, ranking}
            matched  = {python, faiss, retrieval}
            → coverage = 3/4 = 0.75

        Args:
            matched_skills:  Skills found in the candidate's profile/document.
            required_skills: JD required skill set (lower-cased).

        Returns:
            float: Coverage score in [0.0, 1.0].
        """
        if not required_skills:
            return 0.0
        matched_lower = {s.lower() for s in matched_skills}
        required_lower = {s.lower() for s in required_skills}
        return len(matched_lower & required_lower) / len(required_lower)

    # ── Skill Extraction ──────────────────────────────────────────────────────

    @staticmethod
    def _extract_matched_skills(
        lexical_result: Optional[LexicalMatch],
        required_skills: Set[str],
    ) -> List[str]:
        """Extracts matched skills from BM25 matched_terms that align with JD skills."""
        if lexical_result is None:
            return []
        required_lower = {s.lower() for s in required_skills}
        return [term for term in lexical_result.matched_terms if term.lower() in required_lower]

    # ── Deduplication & HybridCandidate Assembly ──────────────────────────────

    def deduplicate_candidates(
        self,
        semantic_results: List[SearchResult],
        lexical_results: List[LexicalMatch],
        score_map: Dict[str, RetrievalScore],
        required_skills: Set[str],
    ) -> List[HybridCandidate]:
        """Merges per-channel results into deduplicated HybridCandidate objects.

        Candidates appearing in both channels are represented once.
        Both their semantic_result and lexical_result fields are populated.

        Args:
            semantic_results: FAISS results.
            lexical_results:  BM25 results.
            score_map:        Fused score map from RetrievalFusion.
            required_skills:  JD required skills for coverage calculation.

        Returns:
            List[HybridCandidate]: Deduplicated, unsorted list (sorted by caller).
        """
        sem_map = {r.candidate_id: r for r in semantic_results}
        lex_map = {r.candidate_id: r for r in lexical_results}

        hybrid_candidates: List[HybridCandidate] = []

        for cand_id, score in score_map.items():
            sem_result = sem_map.get(cand_id)
            lex_result = lex_map.get(cand_id)

            # Determine retrieval source label
            in_sem = sem_result is not None
            in_lex = lex_result is not None
            source = "hybrid" if (in_sem and in_lex) else ("semantic" if in_sem else "lexical")

            # Extract matched skills from BM25 terms
            matched_skills = self._extract_matched_skills(lex_result, required_skills)
            matched_keywords = lex_result.matched_terms if lex_result else []
            coverage = self.calculate_coverage(matched_skills, required_skills)

            hybrid_candidates.append(
                HybridCandidate(
                    candidate_id=cand_id,
                    semantic_result=sem_result,
                    lexical_result=lex_result,
                    retrieval_score=score,
                    retrieval_rank=0,  # Will be assigned after sorting
                    matched_skills=matched_skills,
                    matched_keywords=matched_keywords,
                    coverage_score=round(coverage, 4),
                    retrieval_source=source,
                )
            )

        logger.debug(f"Deduplicated to {len(hybrid_candidates)} unique candidates.")
        return hybrid_candidates

    # ── Pool Statistics ───────────────────────────────────────────────────────

    def generate_statistics(
        self,
        candidates: List[HybridCandidate],
        fusion_strategy: str = "rrf",
    ) -> PoolStatistics:
        """Computes aggregate quality metrics for the candidate pool.

        Args:
            candidates:      Pool candidates.
            fusion_strategy: Active fusion strategy label.

        Returns:
            PoolStatistics: Populated statistics object.
        """
        if not candidates:
            return PoolStatistics(fusion_strategy=fusion_strategy)

        n_sem_only = sum(1 for c in candidates if c.retrieval_source == "semantic")
        n_lex_only = sum(1 for c in candidates if c.retrieval_source == "lexical")
        n_hybrid   = sum(1 for c in candidates if c.retrieval_source == "hybrid")

        avg_coverage = sum(c.coverage_score for c in candidates) / len(candidates)
        avg_score = sum(c.retrieval_score.final_retrieval_score for c in candidates) / len(candidates)

        # Coverage distribution histogram
        buckets = {"0.0-0.25": 0, "0.25-0.5": 0, "0.5-0.75": 0, "0.75-1.0": 0}
        for c in candidates:
            s = c.coverage_score
            if s < 0.25:
                buckets["0.0-0.25"] += 1
            elif s < 0.5:
                buckets["0.25-0.5"] += 1
            elif s < 0.75:
                buckets["0.5-0.75"] += 1
            else:
                buckets["0.75-1.0"] += 1

        return PoolStatistics(
            total_semantic_only=n_sem_only,
            total_lexical_only=n_lex_only,
            total_hybrid=n_hybrid,
            average_coverage_score=round(avg_coverage, 4),
            average_final_score=round(avg_score, 6),
            coverage_distribution=buckets,
            fusion_strategy=fusion_strategy,
        )

    # ── Main Pool Generation ──────────────────────────────────────────────────

    def generate_pool(
        self,
        query_id: str,
        parsed_jd: ParsedJD,
        semantic_results: List[SearchResult],
        lexical_results: List[LexicalMatch],
        strategy: str = "rrf",
        filters: Optional[Dict] = None,
        candidate_experience_map: Optional[Dict[str, float]] = None,
        candidate_location_map: Optional[Dict[str, str]] = None,
        candidate_activity_map: Optional[Dict[str, float]] = None,
    ) -> CandidatePool:
        """Full pipeline: fusion → dedup → coverage → filter → pool.

        Args:
            query_id:               Unique query identifier.
            parsed_jd:              Parsed job description.
            semantic_results:       FAISS search results.
            lexical_results:        BM25 search results.
            strategy:               Fusion strategy ('rrf'|'weighted'|'borda').
            filters:                Optional runtime filter config dict.
            candidate_experience_map: {id: years_experience}.
            candidate_location_map:   {id: location_string}.
            candidate_activity_map:   {id: activity_score}.

        Returns:
            CandidatePool: Ranked pool of up to pool_size candidates.
        """
        start = time.time()
        required_skills = parsed_jd.get_required_skills()

        # 1. Fuse
        score_map = self.fusion.combine_results(
            semantic_results, lexical_results, strategy=strategy, top_k=self.pool_size * 2
        )

        # 2. Deduplicate & assemble HybridCandidates
        candidates = self.deduplicate_candidates(
            semantic_results, lexical_results, score_map, required_skills
        )

        # 3. Apply filters
        candidates = self.filters.apply_filter_chain(
            candidates,
            filters=filters,
            candidate_experience_map=candidate_experience_map,
            candidate_location_map=candidate_location_map,
            candidate_activity_map=candidate_activity_map,
        )

        # 4. Sort by final_retrieval_score DESC, candidate_id ASC for deterministic tie-breaking
        candidates.sort(
            key=lambda c: (-c.retrieval_score.final_retrieval_score, c.candidate_id),
        )

        # 5. Cap to pool_size and assign final ranks
        candidates = candidates[: self.pool_size]
        for rank, cand in enumerate(candidates, start=1):
            cand.retrieval_rank = rank

        # 6. Build statistics
        stats = self.generate_statistics(candidates, fusion_strategy=strategy)
        elapsed_ms = round((time.time() - start) * 1000.0, 2)

        logger.info(
            f"CandidatePoolGenerator: pool={len(candidates)} candidates, "
            f"strategy={strategy}, elapsed={elapsed_ms}ms."
        )

        return CandidatePool(
            query_id=query_id,
            job_title=parsed_jd.job_title,
            candidates=candidates,
            candidate_count=len(candidates),
            generation_time_ms=elapsed_ms,
            pool_statistics=stats,
        )
