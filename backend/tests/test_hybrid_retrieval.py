"""Unit and integration tests for Phase 9: Hybrid Retrieval Engine.

Tests cover:
  - Score normalization (all four strategies)
  - Reciprocal Rank Fusion (formula correctness, edge cases)
  - Weighted and Borda fusion
  - Retrieval deduplication
  - Skill coverage calculation
  - Pool generation (fusion → filter → pool)
  - Retrieval filters
  - Retrieval metrics
  - HybridCandidate and model construction
  - HybridRetrievalResponse construction
  - CandidatePool construction
"""

import pytest
from typing import List

from models.search_result import SearchResult
from models.lexical_match import LexicalMatch
from models.hybrid_candidate import HybridCandidate
from models.hybrid_retrieval_response import HybridRetrievalResponse
from models.candidate_pool import CandidatePool, PoolStatistics
from models.retrieval_score import RetrievalScore
from models.parsed_jd import ParsedJD
from models.jd_requirements import Requirement, RequirementImportance

from services.score_normalizer import ScoreNormalizer
from services.reciprocal_rank_fusion import ReciprocalRankFusion
from services.retrieval_fusion import RetrievalFusion
from services.retrieval_filters import RetrievalFilters
from services.candidate_pool_generator import CandidatePoolGenerator
from services.retrieval_metrics import RetrievalMetrics


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

def _make_search_result(cand_id: str, rank: int, score: float = 0.9) -> SearchResult:
    return SearchResult(
        candidate_id=cand_id,
        similarity_score=min(1.0, max(-1.0, score)),
        rank=rank,
        distance=1.0 - score,
        search_time_ms=0.5,
    )


def _make_lexical_match(
    cand_id: str,
    rank: int,
    score: float = 5.0,
    matched_terms: List[str] = None,
) -> LexicalMatch:
    return LexicalMatch(
        candidate_id=cand_id,
        bm25_score=score,
        matched_terms=matched_terms or ["python"],
        match_count=len(matched_terms or ["python"]),
        rank=rank,
        retrieval_reason=f"Matched {matched_terms or ['python']}.",
    )


def _make_parsed_jd(skills: List[str] = None) -> ParsedJD:
    skills = skills or ["python", "faiss", "retrieval", "ranking"]
    return ParsedJD(
        job_title="Senior ML Engineer",
        company_name="TechCorp",
        must_have=[
            Requirement(name=s, importance=RequirementImportance.CRITICAL)
            for s in skills
        ],
        good_to_have=[],
        negative_signals=[],
        behavioral_preferences=[],
        culture_fit=[],
        industry_preferences=[],
        location_preferences=[],
        scoring_profile={},
        summary="Looking for a Senior ML Engineer with Python and retrieval experience.",
    )


@pytest.fixture
def sample_semantic_results() -> List[SearchResult]:
    return [
        _make_search_result("CAND_A", rank=1, score=0.95),
        _make_search_result("CAND_B", rank=2, score=0.88),
        _make_search_result("CAND_C", rank=3, score=0.75),
        _make_search_result("CAND_D", rank=4, score=0.60),
    ]


@pytest.fixture
def sample_lexical_results() -> List[LexicalMatch]:
    return [
        _make_lexical_match("CAND_B", rank=1, score=8.5, matched_terms=["python", "faiss"]),
        _make_lexical_match("CAND_A", rank=2, score=7.2, matched_terms=["retrieval"]),
        _make_lexical_match("CAND_E", rank=3, score=6.0, matched_terms=["ranking"]),
        _make_lexical_match("CAND_F", rank=4, score=4.0, matched_terms=["python"]),
    ]


@pytest.fixture
def parsed_jd() -> ParsedJD:
    return _make_parsed_jd()


# ─────────────────────────────────────────────────────────────────────────────
# 1. Score Normalizer Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestScoreNormalizer:
    """Verifies all four normalization strategies."""

    def test_min_max_basic(self):
        scores = [0.0, 0.5, 1.0, 2.0]
        normed = ScoreNormalizer.min_max_normalization(scores)
        assert normed[0] == pytest.approx(0.0)
        assert normed[-1] == pytest.approx(1.0)
        assert all(0.0 <= s <= 1.0 for s in normed)

    def test_min_max_identical_scores(self):
        scores = [5.0, 5.0, 5.0]
        normed = ScoreNormalizer.min_max_normalization(scores)
        assert normed == [1.0, 1.0, 1.0]

    def test_min_max_empty(self):
        assert ScoreNormalizer.min_max_normalization([]) == []

    def test_z_score_basic(self):
        scores = [1.0, 2.0, 3.0, 4.0, 5.0]
        normed = ScoreNormalizer.z_score_normalization(scores)
        assert all(0.0 <= s <= 1.0 for s in normed)
        # Highest score should map to 1.0
        assert normed[-1] == pytest.approx(1.0)

    def test_z_score_single_element(self):
        normed = ScoreNormalizer.z_score_normalization([3.7])
        assert normed == [1.0]

    def test_rank_normalization_basic(self):
        ranks = [1, 2, 3, 4]
        normed = ScoreNormalizer.rank_normalization(ranks)
        assert normed[0] == pytest.approx(1.0)   # rank 1 → 1.0
        assert normed[-1] == pytest.approx(0.0)  # rank 4 → 0.0

    def test_rank_normalization_single(self):
        assert ScoreNormalizer.rank_normalization([1]) == [1.0]

    def test_robust_normalization(self):
        scores = [1.0, 2.0, 3.0, 100.0]  # 100 is a clear outlier
        normed = ScoreNormalizer.robust_normalization(scores)
        # Outlier should be capped at 1.0 (not distort others)
        assert all(0.0 <= s <= 1.0 for s in normed)

    def test_normalize_scored_list(self):
        items = [("A", 10.0), ("B", 5.0), ("C", 2.0)]
        normed = ScoreNormalizer.normalize_scored_list(items, strategy="min_max")
        assert normed[0][0] == "A"
        assert normed[0][1] == pytest.approx(1.0)
        assert normed[-1][1] == pytest.approx(0.0)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Reciprocal Rank Fusion Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestReciprocalRankFusion:
    """Verifies RRF formula, edge cases, and sorted output."""

    def test_rrf_formula_single_list(self):
        rrf = ReciprocalRankFusion(k=60)
        # Single ranked list: candidate at rank 1 should score 1/(60+1)
        result = rrf.fuse_rankings([[("CAND_A", 1), ("CAND_B", 2)]])
        assert result["CAND_A"] == pytest.approx(1 / 61)
        assert result["CAND_B"] == pytest.approx(1 / 62)

    def test_rrf_two_lists_candidate_in_both(self):
        rrf = ReciprocalRankFusion(k=60)
        list_a = [("CAND_A", 1), ("CAND_B", 2)]
        list_b = [("CAND_B", 1), ("CAND_A", 3)]
        result = rrf.fuse_rankings([list_a, list_b])
        # CAND_B: 1/61 + 1/61 = 2/61
        # CAND_A: 1/61 + 1/63
        assert result["CAND_B"] > result["CAND_A"]

    def test_rrf_candidate_in_one_list_only(self):
        rrf = ReciprocalRankFusion(k=60)
        list_a = [("CAND_A", 1)]
        list_b = [("CAND_B", 1)]
        result = rrf.fuse_rankings([list_a, list_b])
        # Both at rank 1 in different lists → equal score
        assert result["CAND_A"] == pytest.approx(result["CAND_B"])

    def test_rrf_empty_list(self):
        rrf = ReciprocalRankFusion(k=60)
        result = rrf.fuse_rankings([[]])
        assert result == {}

    def test_generate_fused_ranking_sorted(self):
        rrf = ReciprocalRankFusion(k=60)
        list_a = [("CAND_A", 1), ("CAND_B", 2), ("CAND_C", 3)]
        list_b = [("CAND_A", 1), ("CAND_C", 2), ("CAND_D", 3)]
        ranked = rrf.generate_fused_ranking([list_a, list_b], top_k=4)
        # Output should be sorted by RRF score descending
        scores = [score for _, score, _ in ranked]
        assert scores == sorted(scores, reverse=True)
        # CAND_A in both at rank 1 should be first
        assert ranked[0][0] == "CAND_A"

    def test_generate_fused_ranking_top_k(self):
        rrf = ReciprocalRankFusion(k=60)
        list_a = [(f"CAND_{i}", i) for i in range(1, 101)]
        ranked = rrf.generate_fused_ranking([list_a], top_k=10)
        assert len(ranked) == 10

    def test_rrf_invalid_k(self):
        with pytest.raises(ValueError):
            ReciprocalRankFusion(k=0)

    def test_score_dict_to_ranked_list(self):
        rrf = ReciprocalRankFusion()
        scores = {"A": 0.9, "B": 0.5, "C": 0.7}
        ranked = rrf.score_dict_to_ranked_list(scores)
        assert ranked[0] == ("A", 1)
        assert ranked[1] == ("C", 2)
        assert ranked[2] == ("B", 3)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Retrieval Fusion Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestRetrievalFusion:
    """Verifies all three fusion strategies produce valid RetrievalScore objects."""

    def test_rrf_fusion_produces_all_candidates(
        self, sample_semantic_results, sample_lexical_results
    ):
        fusion = RetrievalFusion()
        result = fusion.rrf_fusion(sample_semantic_results, sample_lexical_results)
        # 4 semantic + 4 lexical, 2 overlap (A, B) → 6 unique
        assert len(result) == 6
        for cand_id, score in result.items():
            assert isinstance(score, RetrievalScore)
            assert score.rrf_score > 0.0
            assert score.final_retrieval_score > 0.0
            assert score.fusion_strategy == "rrf"

    def test_weighted_fusion(self, sample_semantic_results, sample_lexical_results):
        fusion = RetrievalFusion()
        result = fusion.weighted_fusion(sample_semantic_results, sample_lexical_results)
        assert len(result) == 6
        for score in result.values():
            assert 0.0 <= score.final_retrieval_score <= 1.0
            assert score.fusion_strategy == "weighted"

    def test_borda_fusion(self, sample_semantic_results, sample_lexical_results):
        fusion = RetrievalFusion()
        result = fusion.borda_fusion(sample_semantic_results, sample_lexical_results)
        assert len(result) == 6
        for score in result.values():
            assert score.borda_score >= 0.0
            assert score.fusion_strategy == "borda"

    def test_combine_results_defaults_to_rrf(
        self, sample_semantic_results, sample_lexical_results
    ):
        fusion = RetrievalFusion(default_strategy="rrf")
        result = fusion.combine_results(sample_semantic_results, sample_lexical_results)
        for score in result.values():
            assert score.fusion_strategy == "rrf"

    def test_combine_results_strategy_override(
        self, sample_semantic_results, sample_lexical_results
    ):
        fusion = RetrievalFusion()
        result = fusion.combine_results(
            sample_semantic_results, sample_lexical_results, strategy="borda"
        )
        for score in result.values():
            assert score.fusion_strategy == "borda"

    def test_combine_results_unknown_strategy_falls_back(
        self, sample_semantic_results, sample_lexical_results
    ):
        fusion = RetrievalFusion()
        result = fusion.combine_results(
            sample_semantic_results, sample_lexical_results, strategy="unknown"
        )
        # Falls back to RRF
        for score in result.values():
            assert score.fusion_strategy == "rrf"

    def test_rrf_candidate_in_both_channels_flagged(
        self, sample_semantic_results, sample_lexical_results
    ):
        fusion = RetrievalFusion()
        result = fusion.rrf_fusion(sample_semantic_results, sample_lexical_results)
        # CAND_A and CAND_B are in both channels
        assert result["CAND_A"].in_semantic_results is True
        assert result["CAND_A"].in_lexical_results is True
        assert result["CAND_D"].in_semantic_results is True
        assert result["CAND_D"].in_lexical_results is False  # D only in semantic


# ─────────────────────────────────────────────────────────────────────────────
# 4. Deduplication & Coverage Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestCandidatePoolGenerator:
    """Verifies deduplication, coverage, and pool generation."""

    def test_coverage_calculation_full(self):
        score = CandidatePoolGenerator.calculate_coverage(
            matched_skills=["python", "faiss", "retrieval", "ranking"],
            required_skills={"python", "faiss", "retrieval", "ranking"},
        )
        assert score == pytest.approx(1.0)

    def test_coverage_calculation_partial(self):
        score = CandidatePoolGenerator.calculate_coverage(
            matched_skills=["python", "faiss", "retrieval"],
            required_skills={"python", "faiss", "retrieval", "ranking"},
        )
        assert score == pytest.approx(0.75)

    def test_coverage_calculation_zero(self):
        score = CandidatePoolGenerator.calculate_coverage(
            matched_skills=[],
            required_skills={"python", "faiss"},
        )
        assert score == pytest.approx(0.0)

    def test_coverage_no_required_skills(self):
        score = CandidatePoolGenerator.calculate_coverage(
            matched_skills=["python"],
            required_skills=set(),
        )
        assert score == pytest.approx(0.0)

    def test_deduplicate_no_overlap(
        self, sample_semantic_results, sample_lexical_results
    ):
        # Use non-overlapping results
        sem = [_make_search_result("CAND_X", 1, 0.9)]
        lex = [_make_lexical_match("CAND_Y", 1, 5.0)]
        fusion = RetrievalFusion()
        score_map = fusion.combine_results(sem, lex)
        gen = CandidatePoolGenerator()
        candidates = gen.deduplicate_candidates(sem, lex, score_map, {"python"})
        assert len(candidates) == 2
        ids = {c.candidate_id for c in candidates}
        assert "CAND_X" in ids and "CAND_Y" in ids

    def test_deduplicate_with_overlap(
        self, sample_semantic_results, sample_lexical_results
    ):
        fusion = RetrievalFusion()
        score_map = fusion.combine_results(sample_semantic_results, sample_lexical_results)
        gen = CandidatePoolGenerator()
        candidates = gen.deduplicate_candidates(
            sample_semantic_results, sample_lexical_results, score_map, {"python", "faiss"}
        )
        # 4 sem + 4 lex with 2 overlaps = 6 unique
        assert len(candidates) == 6
        # All candidate_ids should be unique
        ids = [c.candidate_id for c in candidates]
        assert len(ids) == len(set(ids))

    def test_hybrid_source_label(self, sample_semantic_results, sample_lexical_results):
        fusion = RetrievalFusion()
        score_map = fusion.combine_results(sample_semantic_results, sample_lexical_results)
        gen = CandidatePoolGenerator()
        candidates = gen.deduplicate_candidates(
            sample_semantic_results, sample_lexical_results, score_map, set()
        )
        cand_map = {c.candidate_id: c for c in candidates}
        # CAND_A and CAND_B appear in both channels
        assert cand_map["CAND_A"].retrieval_source == "hybrid"
        assert cand_map["CAND_B"].retrieval_source == "hybrid"
        # CAND_C only in semantic
        assert cand_map["CAND_C"].retrieval_source == "semantic"
        # CAND_E only in lexical
        assert cand_map["CAND_E"].retrieval_source == "lexical"

    def test_generate_pool_ranks_candidates(
        self, sample_semantic_results, sample_lexical_results, parsed_jd
    ):
        gen = CandidatePoolGenerator(pool_size=10)
        pool = gen.generate_pool(
            query_id="TEST_POOL",
            parsed_jd=parsed_jd,
            semantic_results=sample_semantic_results,
            lexical_results=sample_lexical_results,
        )
        assert pool.candidate_count == 6
        ranks = [c.retrieval_rank for c in pool.candidates]
        assert ranks == list(range(1, 7))

    def test_generate_pool_respects_pool_size(
        self, sample_semantic_results, sample_lexical_results, parsed_jd
    ):
        gen = CandidatePoolGenerator(pool_size=3)
        pool = gen.generate_pool(
            query_id="TEST_POOL_SIZE",
            parsed_jd=parsed_jd,
            semantic_results=sample_semantic_results,
            lexical_results=sample_lexical_results,
        )
        assert pool.candidate_count == 3
        assert len(pool.candidates) == 3

    def test_generate_pool_statistics(
        self, sample_semantic_results, sample_lexical_results, parsed_jd
    ):
        gen = CandidatePoolGenerator(pool_size=10)
        pool = gen.generate_pool(
            query_id="TEST_STATS",
            parsed_jd=parsed_jd,
            semantic_results=sample_semantic_results,
            lexical_results=sample_lexical_results,
        )
        stats = pool.pool_statistics
        total_accounted = (
            stats.total_semantic_only + stats.total_lexical_only + stats.total_hybrid
        )
        assert total_accounted == pool.candidate_count
        assert 0.0 <= stats.average_coverage_score <= 1.0
        assert stats.fusion_strategy == "rrf"


# ─────────────────────────────────────────────────────────────────────────────
# 5. Retrieval Filters Tests
# ─────────────────────────────────────────────────────────────────────────────

def _make_hybrid_candidate(
    cand_id: str, rank: int = 1, coverage: float = 0.5
) -> HybridCandidate:
    return HybridCandidate(
        candidate_id=cand_id,
        retrieval_score=RetrievalScore(final_retrieval_score=0.5, fusion_strategy="rrf"),
        retrieval_rank=rank,
        coverage_score=coverage,
    )


class TestRetrievalFilters:
    """Verifies each filter and the combined chain."""

    def test_skill_coverage_filter_removes_below_threshold(self):
        candidates = [
            _make_hybrid_candidate("A", coverage=0.9),
            _make_hybrid_candidate("B", coverage=0.4),
            _make_hybrid_candidate("C", coverage=0.75),
        ]
        f = RetrievalFilters(min_coverage_score=0.5)
        result = f.skill_coverage_filter(candidates)
        ids = [c.candidate_id for c in result]
        assert "A" in ids and "C" in ids
        assert "B" not in ids

    def test_skill_coverage_filter_zero_threshold_passes_all(self):
        candidates = [_make_hybrid_candidate("A", coverage=0.0)]
        f = RetrievalFilters(min_coverage_score=0.0)
        result = f.skill_coverage_filter(candidates)
        assert len(result) == 1

    def test_experience_filter_removes_below_threshold(self):
        candidates = [
            _make_hybrid_candidate("A"),
            _make_hybrid_candidate("B"),
            _make_hybrid_candidate("C"),
        ]
        exp_map = {"A": 7.0, "B": 2.0, "C": 5.0}
        f = RetrievalFilters(min_experience_years=5.0)
        result = f.minimum_experience_filter(
            candidates, candidate_experience_map=exp_map
        )
        ids = {c.candidate_id for c in result}
        assert "A" in ids and "C" in ids
        assert "B" not in ids

    def test_location_filter_passes_matching(self):
        candidates = [
            _make_hybrid_candidate("A"),
            _make_hybrid_candidate("B"),
        ]
        loc_map = {"A": "Bangalore, Karnataka", "B": "Mumbai, Maharashtra"}
        f = RetrievalFilters(location_whitelist=["bangalore"])
        result = f.location_filter(
            candidates, candidate_location_map=loc_map
        )
        assert len(result) == 1
        assert result[0].candidate_id == "A"

    def test_location_filter_no_whitelist_passes_all(self):
        candidates = [_make_hybrid_candidate("A"), _make_hybrid_candidate("B")]
        f = RetrievalFilters()
        result = f.location_filter(candidates, candidate_location_map={"A": "Delhi"})
        assert len(result) == 2

    def test_activity_filter(self):
        candidates = [
            _make_hybrid_candidate("A"),
            _make_hybrid_candidate("B"),
        ]
        activity_map = {"A": 0.8, "B": 0.2}
        f = RetrievalFilters(min_activity_score=0.5)
        result = f.activity_filter(candidates, candidate_activity_map=activity_map)
        assert len(result) == 1
        assert result[0].candidate_id == "A"

    def test_apply_filter_chain_dynamic(self):
        candidates = [
            _make_hybrid_candidate("A", coverage=0.9),
            _make_hybrid_candidate("B", coverage=0.3),
            _make_hybrid_candidate("C", coverage=0.8),
        ]
        f = RetrievalFilters()
        result = f.apply_filter_chain(candidates, filters={"min_coverage": 0.5})
        ids = {c.candidate_id for c in result}
        assert "A" in ids and "C" in ids
        assert "B" not in ids

    def test_apply_filter_chain_empty_filters_passes_all(self):
        candidates = [_make_hybrid_candidate("A"), _make_hybrid_candidate("B")]
        f = RetrievalFilters()
        result = f.apply_filter_chain(candidates, filters=None)
        assert len(result) == 2


# ─────────────────────────────────────────────────────────────────────────────
# 6. Retrieval Metrics Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestRetrievalMetrics:
    """Verifies metric calculations."""

    def _make_pool(self, ids, source="hybrid", coverage=0.5):
        return [
            HybridCandidate(
                candidate_id=cid,
                retrieval_score=RetrievalScore(final_retrieval_score=0.5, fusion_strategy="rrf"),
                retrieval_rank=i + 1,
                coverage_score=coverage,
                retrieval_source=source,
            )
            for i, cid in enumerate(ids)
        ]

    def test_semantic_recall_full(self, sample_semantic_results):
        pool = self._make_pool(["CAND_A", "CAND_B", "CAND_C", "CAND_D"])
        m = RetrievalMetrics(
            semantic_results=sample_semantic_results,
            lexical_results=[],
            fused_candidates=pool,
        )
        assert m.semantic_recall() == pytest.approx(1.0)

    def test_semantic_recall_partial(self, sample_semantic_results):
        pool = self._make_pool(["CAND_A", "CAND_B"])  # only 2 of 4
        m = RetrievalMetrics(
            semantic_results=sample_semantic_results,
            fused_candidates=pool,
        )
        assert m.semantic_recall() == pytest.approx(0.5)

    def test_lexical_recall_full(self, sample_lexical_results):
        pool = self._make_pool(["CAND_B", "CAND_A", "CAND_E", "CAND_F"])
        m = RetrievalMetrics(
            lexical_results=sample_lexical_results,
            fused_candidates=pool,
        )
        assert m.lexical_recall() == pytest.approx(1.0)

    def test_candidate_coverage_average(self):
        pool = [
            HybridCandidate(
                candidate_id=f"C{i}",
                retrieval_score=RetrievalScore(final_retrieval_score=0.5, fusion_strategy="rrf"),
                retrieval_rank=i + 1,
                coverage_score=cov,
            )
            for i, cov in enumerate([0.5, 0.75, 1.0])
        ]
        m = RetrievalMetrics(fused_candidates=pool)
        assert m.candidate_coverage() == pytest.approx(2.25 / 3, rel=1e-4)

    def test_retrieval_diversity_all_single_source(self):
        pool = self._make_pool(["A", "B", "C"], source="semantic")
        m = RetrievalMetrics(fused_candidates=pool)
        assert m.retrieval_diversity() == pytest.approx(1.0)

    def test_retrieval_diversity_all_hybrid(self):
        pool = self._make_pool(["A", "B", "C"], source="hybrid")
        m = RetrievalMetrics(fused_candidates=pool)
        assert m.retrieval_diversity() == pytest.approx(0.0)

    def test_fusion_recall(
        self, sample_semantic_results, sample_lexical_results
    ):
        all_ids = (
            {r.candidate_id for r in sample_semantic_results}
            | {r.candidate_id for r in sample_lexical_results}
        )
        pool = self._make_pool(list(all_ids))
        m = RetrievalMetrics(
            semantic_results=sample_semantic_results,
            lexical_results=sample_lexical_results,
            fused_candidates=pool,
        )
        assert m.fusion_recall() == pytest.approx(1.0)

    def test_generate_report_keys(
        self, sample_semantic_results, sample_lexical_results
    ):
        pool = self._make_pool(["CAND_A", "CAND_B"])
        m = RetrievalMetrics(
            semantic_results=sample_semantic_results,
            lexical_results=sample_lexical_results,
            fused_candidates=pool,
        )
        report = m.generate_report()
        expected_keys = {
            "semantic_recall", "lexical_recall", "fusion_recall",
            "candidate_coverage", "retrieval_diversity",
            "average_skill_coverage", "total_semantic_results",
            "total_lexical_results", "total_fused_candidates",
            "union_size", "intersection_size",
            "semantic_only_in_pool", "lexical_only_in_pool", "hybrid_in_pool",
        }
        assert expected_keys.issubset(set(report.keys()))

    def test_empty_pool_metrics(self):
        m = RetrievalMetrics(fused_candidates=[])
        assert m.candidate_coverage() == 0.0
        assert m.retrieval_diversity() == 0.0

    def test_empty_channels_metrics(self):
        m = RetrievalMetrics()
        assert m.semantic_recall() == 0.0
        assert m.lexical_recall() == 0.0
        assert m.fusion_recall() == 0.0


# ─────────────────────────────────────────────────────────────────────────────
# 7. Model Construction Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestModels:
    """Verifies Pydantic model construction and field defaults."""

    def test_retrieval_score_defaults(self):
        score = RetrievalScore()
        assert score.semantic_score == 0.0
        assert score.bm25_score == 0.0
        assert score.final_retrieval_score == 0.0
        assert score.fusion_strategy == "rrf"
        assert score.in_semantic_results is False

    def test_hybrid_candidate_construction(self):
        sem = _make_search_result("CAND_Z", rank=1, score=0.9)
        lex = _make_lexical_match("CAND_Z", rank=1, score=5.0, matched_terms=["python"])
        score = RetrievalScore(final_retrieval_score=0.8, fusion_strategy="rrf")
        cand = HybridCandidate(
            candidate_id="CAND_Z",
            semantic_result=sem,
            lexical_result=lex,
            retrieval_score=score,
            retrieval_rank=1,
            matched_skills=["python"],
            matched_keywords=["python"],
            coverage_score=0.25,
            retrieval_source="hybrid",
        )
        assert cand.candidate_id == "CAND_Z"
        assert cand.coverage_score == pytest.approx(0.25)
        assert cand.retrieval_source == "hybrid"

    def test_pool_statistics_construction(self):
        stats = PoolStatistics(
            total_semantic_only=10,
            total_lexical_only=5,
            total_hybrid=85,
            average_coverage_score=0.72,
            fusion_strategy="rrf",
        )
        assert stats.total_hybrid == 85

    def test_candidate_pool_construction(self):
        pool = CandidatePool(
            query_id="Q_TEST",
            job_title="ML Engineer",
            candidates=[],
            candidate_count=0,
            generation_time_ms=120.5,
        )
        assert pool.query_id == "Q_TEST"
        assert pool.candidate_count == 0

    def test_hybrid_retrieval_response_construction(self):
        resp = HybridRetrievalResponse(
            query_id="HYB_TEST",
            total_semantic=100,
            total_lexical=80,
            total_fused=150,
            retrieval_time_ms=450.0,
            fusion_strategy="rrf",
        )
        assert resp.query_id == "HYB_TEST"
        assert resp.fusion_strategy == "rrf"
        assert resp.total_fused == 150
