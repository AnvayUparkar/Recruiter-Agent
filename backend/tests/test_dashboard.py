"""Unit Tests for Dashboard Service.

Tests dashboard score distributions, notice period histograms, and completeness stats.
"""

import pytest
from typing import List
from models.candidate import Candidate
from models.ranked_candidate import RankedCandidate
from models.ranking_score import RankingScore
from models.dashboard_metrics import DashboardMetrics
from services.dashboard_service import DashboardService
from test_ranking_engine import (
    _make_candidate,
    _make_parsed_jd
)



def _make_mock_ranked_candidate(cand_id: str, score: float, reliability: float = 0.90) -> RankedCandidate:
    """Helper to instantiate RankedCandidate with necessary sub-scores."""
    details = RankingScore(
        candidate_id=cand_id,
        raw_technical_score=0.8,
        raw_matching_score=0.7,
        raw_behavioral_score=0.8,
        raw_market_score=0.7,
        weighted_technical_score=0.28,
        weighted_matching_score=0.10,
        weighted_behavioral_score=0.12,
        weighted_market_score=0.02,
        base_score=0.52,
        bonuses_applied=[],
        penalties_applied=[],
        bonus_points=0.0,
        penalty_points=0.0,
        reliability_score=reliability,
        trust_score=0.85,  # trust_score for Details
        final_score=score,
        confidence=0.9
    )
    return RankedCandidate(
        candidate_id=cand_id,
        rank=1,
        final_score=score,
        confidence=0.9,
        score_details=details,
        explanation=None,
        reasoning_trace=None
    )


def test_dashboard_empty_pool():
    """Verifies that an empty pool resolves to a default initialized DashboardMetrics."""
    metrics = DashboardService.generate_dashboard_metrics([], [])
    assert isinstance(metrics, DashboardMetrics)
    assert metrics.retrieval_stats.get("total_evaluated", 0) == 0



def test_dashboard_distribution_binning():
    """Verifies that scores are correctly binned into histogram ranges."""
    c1 = _make_candidate("CAND_0000001", notice_period_days=10)
    c2 = _make_candidate("CAND_0000002", notice_period_days=45)
    candidates = [c1, c2]

    # Score of c1: 0.85 -> bucket 0.8-1.0
    # Score of c2: 0.45 -> bucket 0.4-0.6
    rc1 = _make_mock_ranked_candidate("CAND_0000001", 0.85, reliability=0.90)
    rc2 = _make_mock_ranked_candidate("CAND_0000002", 0.45, reliability=0.50)
    ranked_candidates = [rc1, rc2]

    metrics = DashboardService.generate_dashboard_metrics(candidates, ranked_candidates)

    # 1. Score bin checks
    hist = metrics.ranking_stats.get("score_distribution_histogram")
    assert hist["0.8-1.0"] == 1
    assert hist["0.4-0.6"] == 1
    assert hist["0.0-0.2"] == 0

    # 2. Avg score checks
    assert metrics.ranking_stats.get("mean_score") == pytest.approx(0.65)
    assert metrics.ranking_stats.get("min_score") == pytest.approx(0.45)
    assert metrics.ranking_stats.get("max_score") == pytest.approx(0.85)

    # 3. Reliability Tiers check
    tiers = metrics.trust_stats.get("reliability_tier_distribution")
    assert tiers["HIGH"] == 1       # rc1 has 0.90 reliability
    assert tiers["LOW"] == 1        # rc2 has 0.50 reliability (0.40 <= rel < 0.60)
    assert tiers["MEDIUM"] == 0

    # 4. Notice periods check
    np_dist = metrics.behavior_stats.get("notice_period_distribution")
    assert np_dist["0-15 days"] == 1   # c1 has 10 days
    assert np_dist["31-60 days"] == 1  # c2 has 45 days
    assert np_dist["61+ days"] == 0
