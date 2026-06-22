"""Hybrid Retrieval Service — main orchestrator for Phase 9.

This is the single entry point for all hybrid candidate retrieval.

Pipeline:
  ParsedJD
    ↓
  HybridRetriever     → semantic (FAISS) + lexical (BM25) results
    ↓
  CandidatePoolGenerator → fusion → dedup → coverage → filter → pool
    ↓
  RetrievalMetrics    → quality report
    ↓
  HybridRetrievalResponse + CandidatePool

Exposed Methods:
  retrieve_candidates(query_text, top_k)         → HybridRetrievalResponse
  retrieve_candidate_pool(parsed_jd, pool_size)  → CandidatePool
  retrieve_top_candidates(parsed_jd, top_k)      → HybridRetrievalResponse

Used by:
  - Phase 10: Ranking Engine (primary input)
  - API Routes (future Flask blueprint)
"""

import time
import uuid
from typing import Dict, Optional
from models.candidate_pool import CandidatePool
from models.hybrid_retrieval_response import HybridRetrievalResponse
from models.parsed_jd import ParsedJD
from services.hybrid_retriever import HybridRetriever
from services.candidate_pool_generator import CandidatePoolGenerator
from services.retrieval_fusion import RetrievalFusion
from services.retrieval_filters import RetrievalFilters
from services.retrieval_metrics import RetrievalMetrics
from utils.logger import get_logger

logger = get_logger(__name__)

DEFAULT_POOL_SIZE: int = 5000
DEFAULT_MODEL: str = "BAAI/bge-large-en-v1.5"
DEFAULT_STRATEGY: str = "rrf"


class HybridRetrievalService:
    """Main orchestrator for the Phase 9 Hybrid Retrieval Engine.

    Coordinates dual-channel retrieval, score fusion, candidate pool
    generation, and quality metrics into a single high-level API.
    """

    def __init__(
        self,
        retriever: Optional[HybridRetriever] = None,
        fusion: Optional[RetrievalFusion] = None,
        filters: Optional[RetrievalFilters] = None,
        pool_size: int = DEFAULT_POOL_SIZE,
        default_strategy: str = DEFAULT_STRATEGY,
        model_name: str = DEFAULT_MODEL,
    ) -> None:
        """Initializes the HybridRetrievalService.

        Args:
            retriever:        HybridRetriever (dual-channel retrieval).
            fusion:           RetrievalFusion (fusion strategy config).
            filters:          RetrievalFilters (pre-ranking gate).
            pool_size:        Maximum candidates in the output pool.
            default_strategy: Fusion strategy ('rrf'|'weighted'|'borda').
            model_name:       Default embedding model.
        """
        self.retriever = retriever or HybridRetriever()
        self.fusion = fusion or RetrievalFusion(default_strategy=default_strategy)
        self.filters = filters or RetrievalFilters()
        self.pool_generator = CandidatePoolGenerator(
            fusion=self.fusion,
            filters=self.filters,
            pool_size=pool_size,
        )
        self.pool_size = pool_size
        self.default_strategy = default_strategy
        self.model_name = model_name

    # ── Public API ────────────────────────────────────────────────────────────

    def retrieve_candidates(
        self,
        query_text: str,
        top_k: int = 100,
        strategy: Optional[str] = None,
        model_name: Optional[str] = None,
    ) -> HybridRetrievalResponse:
        """Retrieves hybrid candidates for a plain text query.

        Useful for ad-hoc recruiter searches (no structured JD required).

        Args:
            query_text: Recruiter search query (natural language).
            top_k:      Number of fused candidates to return (100|1000|5000).
            strategy:   Fusion strategy override.
            model_name: Embedding model override.

        Returns:
            HybridRetrievalResponse: Complete retrieval response with per-channel
                                     metadata and fused candidates.
        """
        query_id = f"HYB_{uuid.uuid4().hex[:8]}"
        active_model = model_name or self.model_name
        active_strategy = strategy or self.default_strategy
        wall_start = time.time()

        # 1. Retrieve from both channels
        sem_results, sem_ms = self.retriever.retrieve_semantic(
            query_text, top_k=self.pool_size, model_name=active_model
        )
        lex_results, lex_ms = self.retriever.retrieve_lexical(
            query_text, top_k=self.pool_size
        )

        # 2. Fuse
        fusion_start = time.time()
        score_map = self.fusion.combine_results(
            sem_results, lex_results, strategy=active_strategy, top_k=top_k
        )
        fusion_ms = round((time.time() - fusion_start) * 1000.0, 2)

        # 3. Build HybridCandidates (lightweight dedup, no pool stats)
        required_skills = set()
        candidates = self.pool_generator.deduplicate_candidates(
            sem_results, lex_results, score_map, required_skills
        )
        candidates.sort(
            key=lambda c: c.retrieval_score.final_retrieval_score, reverse=True
        )
        candidates = candidates[:top_k]
        for rank, cand in enumerate(candidates, start=1):
            cand.retrieval_rank = rank

        total_ms = round((time.time() - wall_start) * 1000.0, 2)

        logger.info(
            f"HybridRetrievalService.retrieve_candidates: query_id={query_id}, "
            f"fused={len(candidates)}, strategy={active_strategy}, "
            f"total={total_ms}ms."
        )

        return HybridRetrievalResponse(
            query_id=query_id,
            semantic_candidates=sem_results,
            lexical_candidates=lex_results,
            fused_candidates=candidates,
            total_semantic=len(sem_results),
            total_lexical=len(lex_results),
            total_fused=len(candidates),
            retrieval_time_ms=total_ms,
            semantic_time_ms=sem_ms,
            lexical_time_ms=lex_ms,
            fusion_time_ms=fusion_ms,
            fusion_strategy=active_strategy,
        )

    def retrieve_candidate_pool(
        self,
        parsed_jd: ParsedJD,
        pool_size: Optional[int] = None,
        strategy: Optional[str] = None,
        model_name: Optional[str] = None,
        filters: Optional[Dict] = None,
        candidate_experience_map: Optional[Dict[str, float]] = None,
        candidate_location_map: Optional[Dict[str, str]] = None,
        candidate_activity_map: Optional[Dict[str, float]] = None,
    ) -> CandidatePool:
        """Generates a full ranked CandidatePool from a ParsedJD.

        This is the primary method called by the Ranking Engine.

        Args:
            parsed_jd:                Parsed job description.
            pool_size:                Override pool size (default 5000).
            strategy:                 Fusion strategy override.
            model_name:               Embedding model override.
            filters:                  Runtime filter config dict.
            candidate_experience_map: {id: years_experience}.
            candidate_location_map:   {id: location_string}.
            candidate_activity_map:   {id: activity_score}.

        Returns:
            CandidatePool: Ranked pool of up to pool_size candidates.
        """
        query_id = f"POOL_{uuid.uuid4().hex[:8]}"
        active_model = model_name or self.model_name
        active_strategy = strategy or self.default_strategy
        active_pool_size = pool_size or self.pool_size

        # Temporarily resize pool generator if needed
        original_pool_size = self.pool_generator.pool_size
        self.pool_generator.pool_size = active_pool_size

        # 1. Retrieve from both channels (search candidate subset of 10k)
        sem_results, lex_results, sem_ms, lex_ms = self.retriever.retrieve_from_jd(
            parsed_jd, top_k=10000, model_name=active_model
        )

        # 2. Generate pool
        pool = self.pool_generator.generate_pool(
            query_id=query_id,
            parsed_jd=parsed_jd,
            semantic_results=sem_results,
            lexical_results=lex_results,
            strategy=active_strategy,
            filters=filters,
            candidate_experience_map=candidate_experience_map,
            candidate_location_map=candidate_location_map,
            candidate_activity_map=candidate_activity_map,
        )

        # Restore pool size
        self.pool_generator.pool_size = original_pool_size

        logger.info(
            f"HybridRetrievalService.retrieve_candidate_pool: "
            f"query_id={query_id}, pool={pool.candidate_count}, "
            f"strategy={active_strategy}."
        )

        return pool

    def retrieve_top_candidates(
        self,
        parsed_jd: ParsedJD,
        top_k: int = 100,
        strategy: Optional[str] = None,
        model_name: Optional[str] = None,
        emit_metrics: bool = True,
    ) -> HybridRetrievalResponse:
        """Retrieves and fuses candidates from a structured ParsedJD.

        Returns a HybridRetrievalResponse (with per-channel metadata) instead
        of a CandidatePool. Useful when the caller needs full observability.

        Args:
            parsed_jd:     Parsed job description.
            top_k:         Number of fused candidates to return.
            strategy:      Fusion strategy override.
            model_name:    Embedding model override.
            emit_metrics:  Whether to log a quality metrics report.

        Returns:
            HybridRetrievalResponse
        """
        query_id = f"HYB_{uuid.uuid4().hex[:8]}"
        active_model = model_name or self.model_name
        active_strategy = strategy or self.default_strategy
        wall_start = time.time()

        # 1. Retrieve from both channels
        sem_results, lex_results, sem_ms, lex_ms = self.retriever.retrieve_from_jd(
            parsed_jd, top_k=self.pool_size, model_name=active_model
        )

        # 2. Fuse
        fusion_start = time.time()
        required_skills = parsed_jd.get_required_skills()
        score_map = self.fusion.combine_results(
            sem_results, lex_results, strategy=active_strategy, top_k=top_k
        )
        fusion_ms = round((time.time() - fusion_start) * 1000.0, 2)

        # 3. Assemble fused candidates
        candidates = self.pool_generator.deduplicate_candidates(
            sem_results, lex_results, score_map, required_skills
        )
        candidates.sort(
            key=lambda c: c.retrieval_score.final_retrieval_score, reverse=True
        )
        candidates = candidates[:top_k]
        for rank, cand in enumerate(candidates, start=1):
            cand.retrieval_rank = rank

        # 4. Optional metrics logging
        if emit_metrics:
            metrics = RetrievalMetrics(
                semantic_results=sem_results,
                lexical_results=lex_results,
                fused_candidates=candidates,
            )
            report = metrics.generate_report()
            logger.info(f"Retrieval metrics [{query_id}]: {report}")

        total_ms = round((time.time() - wall_start) * 1000.0, 2)

        return HybridRetrievalResponse(
            query_id=query_id,
            semantic_candidates=sem_results,
            lexical_candidates=lex_results,
            fused_candidates=candidates,
            total_semantic=len(sem_results),
            total_lexical=len(lex_results),
            total_fused=len(candidates),
            retrieval_time_ms=total_ms,
            semantic_time_ms=sem_ms,
            lexical_time_ms=lex_ms,
            fusion_time_ms=fusion_ms,
            fusion_strategy=active_strategy,
        )
