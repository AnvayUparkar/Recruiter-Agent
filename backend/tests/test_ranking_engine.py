"""Tests for Phase 13: Final Recruiter Ranking Engine.

Covers:
    - FeatureWeightManager
    - RankingStrategy
    - ScoreAggregator
    - RankingCalibrator
    - RankingEngine (Sorting & Tie-breaking)
    - RecruiterReasoning & RankingExplainer
    - FinalRankingService (End-to-End orchestrator)
    - RankingEvaluator & RankingMetrics
"""

import pytest
from datetime import date
from typing import List, Dict

from models.candidate import Candidate
from models.profile import Profile, CompanySize
from models.career_history import CareerHistory
from models.education import Education, EducationTier
from models.skill import Skill, SkillProficiency
from models.language import Language, LanguageProficiency
from models.redrob_signals import RedrobSignals, PreferredWorkMode, ExpectedSalaryRange
from models.feature_vector import FeatureVector
from models.technical_features import TechnicalFeatures, FeatureScore
from models.career_features import CareerFeatures
from models.leadership_features import LeadershipFeatures
from models.execution_features import ExecutionFeatures
from models.market_features import MarketFeatures
from models.matching_features import MatchingFeatures
from models.behavioral_intelligence import BehavioralIntelligence
from models.trust_profile import TrustProfile
from models.engagement_profile import EngagementProfile
from models.responsiveness_profile import ResponsivenessProfile
from models.availability_profile import AvailabilityProfile
from models.reliability_profile import ReliabilityProfile
from models.anomaly_profile import AnomalyProfile
from models.fraud_profile import FraudProfile
from models.consistency_profile import ConsistencyProfile
from models.parsed_jd import ParsedJD
from models.jd_requirements import Requirement, RequirementImportance
from models.ranking_score import RankingScore
from models.ranked_candidate import RankedCandidate
from models.recruiter_reasoning_trace import RecruiterReasoningTrace
from models.ranking_explanation import RankingExplanation
from models.ranking_response import RankingResponse

from services.feature_weight_manager import FeatureWeightManager
from services.ranking_strategy import RankingStrategy, RankingStrategyType
from services.score_aggregator import ScoreAggregator
from services.ranking_calibrator import RankingCalibrator
from services.ranking_engine import RankingEngine
from services.recruiter_reasoning import RecruiterReasoning
from services.ranking_explainer import RankingExplainer
from services.ranking_evaluator import RankingEvaluator
from services.ranking_metrics import RankingMetrics
from services.final_ranking_service import FinalRankingService


# ─────────────────────────────────────────────────────────────────────────────
# MOCK BUILDERS
# ─────────────────────────────────────────────────────────────────────────────

def _make_candidate(
    candidate_id: str,
    years_exp: float = 5.0,
    notice_period_days: int = 15,
    average_tenure: float = 2.5,
    has_github: bool = True,
    education_tier: EducationTier = EducationTier.TIER_1,
    location: str = "Bengaluru",
    skills_list: List[str] = None,
) -> Candidate:
    skills_list = skills_list or ["Python", "SQL", "Machine Learning"]
    skills = [
        Skill(name=name, proficiency=SkillProficiency.ADVANCED, endorsements=10)
        for name in skills_list
    ]

    career_history = []
    # Create two roles to support average tenure calculation
    role_months = int(average_tenure * 12)
    career_history.append(
        CareerHistory(
            company="TechCorp 1",
            title="Software Engineer",
            start_date=date(2020, 1, 1),
            end_date=date(2022, 1, 1),
            duration_months=role_months,
            is_current=False,
            industry="Technology",
            company_size=CompanySize.MEDIUM,
            description="Used Python and ML in production.",
        )
    )
    career_history.append(
        CareerHistory(
            company="TechCorp 2",
            title="Senior Engineer",
            start_date=date(2022, 1, 1),
            end_date=None,
            duration_months=role_months,
            is_current=True,
            industry="Technology",
            company_size=CompanySize.MEDIUM,
            description="Leading ML pipelines.",
        )
    )

    signals = RedrobSignals(
        profile_completeness_score=90.0,
        signup_date=date(2019, 1, 1),
        last_active_date=date(2026, 6, 10),
        open_to_work_flag=True,
        profile_views_received_30d=50,
        applications_submitted_30d=10,
        recruiter_response_rate=0.90,
        avg_response_time_hours=4.0,
        skill_assessment_scores={"Python": 90.0},
        connection_count=500,
        endorsements_received=50,
        notice_period_days=notice_period_days,
        expected_salary_range_inr_lpa=ExpectedSalaryRange(min=25.0, max=40.0),
        preferred_work_mode=PreferredWorkMode.REMOTE,
        willing_to_relocate=True,
        github_activity_score=60.0 if has_github else 0.0,
        search_appearance_30d=200,
        saved_by_recruiters_30d=15,
        interview_completion_rate=0.95,
        offer_acceptance_rate=0.80,
        verified_email=True,
        verified_phone=True,
        linkedin_connected=True,
    )

    return Candidate(
        candidate_id=candidate_id,
        profile=Profile(
            anonymized_name=f"Anonymized {candidate_id}",
            headline="Senior ML Engineer",
            summary="Experienced professional",
            location=location,
            country="India",
            years_of_experience=years_exp,
            current_title="Senior Engineer",
            current_company="TechCorp 2",
            current_company_size=CompanySize.MEDIUM,
            current_industry="Technology",
        ),
        career_history=career_history,
        education=[
            Education(
                institution="IIT Bombay",
                degree="B.Tech",
                field_of_study="Computer Science",
                start_year=2015,
                end_year=2019,
                tier=education_tier,
            )
        ],
        skills=skills,
        certifications=[],
        languages=[Language(language="English", proficiency=LanguageProficiency.NATIVE)],
        redrob_signals=signals,
    )


def _make_feature_vector(
    candidate_id: str = "CAND_0000001",
    technical: float = 0.80,
    career: float = 0.75,
    leadership: float = 0.70,
    execution: float = 0.80,
    market: float = 0.85,
    matching: float = 0.90,
) -> FeatureVector:
    return FeatureVector(
        candidate_id=candidate_id,
        technical_features=TechnicalFeatures(
            retrieval_experience_score=technical,
            ranking_experience_score=technical,
            recommendation_experience_score=technical,
            vector_db_experience_score=technical,
            production_ml_score=technical,
            llm_score=technical,
            evaluation_score=technical,
            distributed_systems_score=technical,
            python_score=technical,
            open_source_score=technical,
            github_score=technical,
        ),
        career_features=CareerFeatures(
            years_experience_score=career,
            growth_rate_score=career,
            stability_score=career,
            startup_score=career,
            average_tenure_score=career,
        ),
        leadership_features=LeadershipFeatures(
            people_management_score=leadership,
            technical_leadership_score=leadership,
            mentorship_score=leadership,
            cross_functional_score=leadership,
        ),
        execution_features=ExecutionFeatures(
            ci_cd_deployment_score=execution,
            infrastructure_score=execution,
            observability_score=execution,
            optimization_score=execution,
        ),
        market_features=MarketFeatures(
            salary_fit_score=market,
            location_fit_score=market,
            notice_period_score=market,
            relocation_willingness=market,
        ),
        matching_features=MatchingFeatures(
            skill_coverage_score=matching,
            keyword_coverage_score=matching,
            semantic_alignment_score=matching,
            experience_alignment_score=matching,
            industry_alignment_score=matching,
            location_alignment_score=matching,
            career_alignment_score=matching,
        ),
        overall_feature_strength=0.80,
    )


def _make_behavioral_intelligence(candidate_id: str, score: float = 0.80) -> BehavioralIntelligence:
    return BehavioralIntelligence(
        candidate_id=candidate_id,
        behavioral_score=score,
        trust_score=score,
        availability_score=score,
        engagement_score=score,
        responsiveness_score=score,
        join_probability=score,
        recruiter_friendliness=score,
        confidence=0.90,
        evidence=["Active responsiveness verified."],
    )


def _make_reliability_profile(
    candidate_id: str,
    reliability_score: float = 0.90,
    fraud_risk: float = 0.05,
    timeline_consistency: float = 0.85,
) -> ReliabilityProfile:
    return ReliabilityProfile(
        candidate_id=candidate_id,
        quality_score=0.85,
        fraud_penalty=fraud_risk,
        consistency_score=0.80,
        reliability_score=reliability_score,
        behavioral_score=0.80,
        trust_score=0.85,
        confidence=0.90,
        fraud_profile=FraudProfile(
            candidate_id=candidate_id,
            skill_stuffing_risk=fraud_risk,
            timeline_risk=fraud_risk,
            identity_risk=fraud_risk,
            experience_risk=fraud_risk,
            anomaly_risk=fraud_risk,
            overall_fraud_risk=fraud_risk,
            confidence=0.90,
        ),
        consistency_profile=ConsistencyProfile(
            candidate_id=candidate_id,
            career_consistency=timeline_consistency,
            timeline_consistency=timeline_consistency,
            skill_consistency=0.85,
            title_consistency=0.90,
            experience_consistency=0.80,
            consistency_score=0.85,
            confidence=0.90,
        ),
        anomaly_profile=AnomalyProfile(
            candidate_id=candidate_id,
            anomaly_count=0,
            severity_score=0.0,
            anomaly_types=[],
            risk_score=0.0,
        ),
        evidence=["No timeline gaps detected.", "All contact points verified."],
    )


def _make_parsed_jd() -> ParsedJD:
    return ParsedJD(
        job_title="Senior ML Engineer",
        company_name="InnovateCorp",
        experience_range=(3.0, 10.0),
        must_have=[
            Requirement(name="Python", importance=RequirementImportance.CRITICAL),
            Requirement(name="SQL", importance=RequirementImportance.IMPORTANT),
            Requirement(name="Machine Learning", importance=RequirementImportance.IMPORTANT),
        ],
        good_to_have=[],
        negative_signals=[],
        behavioral_preferences=["responsive"],
        culture_fit=[],
        industry_preferences=["Technology"],
        location_preferences=["Bengaluru"],
        summary="Looking for a production-oriented machine learning developer.",
        scoring_profile={
            "technical_weight": 0.40,
            "career_weight": 0.20,
            "behavioral_weight": 0.20,
            "culture_weight": 0.10,
            "location_weight": 0.10,
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestFeatureWeightManager:
    def test_default_weights_sum_to_one(self):
        manager = FeatureWeightManager()
        assert sum(manager.weights.values()) == pytest.approx(1.0)

    def test_jd_weights_derivation_and_normalization(self):
        manager = FeatureWeightManager()
        jd = _make_parsed_jd()
        # Custom scoring_profile: {"technical_weight": 0.50, "career_weight": 0.30, "behavioral_weight": 0.20}
        jd.scoring_profile = {
            "technical_weight": 0.50,
            "career_weight": 0.30,
            "behavioral_weight": 0.20,
            "culture_weight": 0.10,
            "location_weight": 0.10,
        }
        derived = manager.get_weights_for_jd(jd)
        assert sum(derived.values()) == pytest.approx(1.0)
        assert derived["technical"] > derived["career"]
        assert derived["career"] > derived["behavioral"]


class TestRankingStrategy:
    def test_strategy_adjustments_remain_normalized(self):
        base_weights = {
            "technical": 0.35,
            "career": 0.15,
            "behavioral": 0.15,
            "trust": 0.10,
            "matching": 0.15,
            "retrieval": 0.05,
            "leadership": 0.02,
            "market": 0.03,
        }
        # Technical-First
        tech_weights = RankingStrategy.adjust_weights(base_weights, RankingStrategyType.TECHNICAL_FIRST)
        assert sum(tech_weights.values()) == pytest.approx(1.0)
        assert tech_weights["technical"] > base_weights["technical"]

        # Engagement-First
        eng_weights = RankingStrategy.adjust_weights(base_weights, RankingStrategyType.ENGAGEMENT_FIRST)
        assert sum(eng_weights.values()) == pytest.approx(1.0)
        assert eng_weights["behavioral"] > base_weights["behavioral"]


class TestScoreAggregator:
    def test_aggregation_and_bonuses(self):
        cand = _make_candidate(
            candidate_id="CAND_0000001",
            notice_period_days=10,  # Immediate availability bonus
            average_tenure=3.0,     # Stable tenure bonus
            has_github=True,        # GitHub activity bonus
            education_tier=EducationTier.TIER_1,  # Tier-1 Education bonus
        )
        fv = _make_feature_vector("CAND_0000001")
        bi = _make_behavioral_intelligence("CAND_0000001", score=0.80)
        rp = _make_reliability_profile("CAND_0000001", reliability_score=0.90)
        weights = FeatureWeightManager().weights

        score = ScoreAggregator.aggregate(cand, fv, bi, rp, weights)

        assert score.candidate_id == "CAND_0000001"
        assert score.total_bonus > 0.0
        assert "Immediate Availability (+0.05)" in score.bonuses_applied
        assert "Active GitHub Contributions (+0.05)" in score.bonuses_applied
        assert "Tier-1 Education (+0.05)" in score.bonuses_applied
        assert score.final_score > 0.0

    def test_aggregation_penalties(self):
        cand = _make_candidate(
            candidate_id="CAND_0000002",
            notice_period_days=90,  # long notice penalty
            average_tenure=0.8,     # job hopping penalty
        )
        fv = _make_feature_vector("CAND_0000002")
        bi = _make_behavioral_intelligence("CAND_0000002")
        rp = _make_reliability_profile(
            "CAND_0000002",
            reliability_score=0.50,
            fraud_risk=0.60,         # high fraud risk penalty
            timeline_consistency=0.40 # timeline gap penalty
        )
        weights = FeatureWeightManager().weights

        score = ScoreAggregator.aggregate(cand, fv, bi, rp, weights)

        assert score.total_penalty > 0.0
        assert any("Job Hopping" in p for p in score.penalties_applied)
        assert any("Fraud/Consistency Risk" in p for p in score.penalties_applied)
        assert any("Timeline Gaps" in p for p in score.penalties_applied)
        assert any("Notice Period" in p for p in score.penalties_applied)


class TestRankingCalibrator:
    def test_calibrator_stretches_scores(self):
        scores = [
            RankingScore(candidate_id="CAND_001", final_score=0.75),
            RankingScore(candidate_id="CAND_002", final_score=0.76),
            RankingScore(candidate_id="CAND_003", final_score=0.74),
        ]
        RankingCalibrator.calibrate_pool(scores, target_min=0.20, target_max=0.90)

        # Min and Max scores should match the calibration limits exactly
        calibrated_values = [s.final_score for s in scores]
        assert min(calibrated_values) == 0.20
        assert max(calibrated_values) == 0.90
        # The relative order must still remain CAND_002 > CAND_001 > CAND_003
        scores_by_id = {s.candidate_id: s.final_score for s in scores}
        assert scores_by_id["CAND_002"] > scores_by_id["CAND_001"] > scores_by_id["CAND_003"]


class TestRankingEngine:
    def test_deterministic_sorting_rules(self):
        # Tie break testing
        scores = [
            RankingScore(candidate_id="CAND_001", final_score=0.80, confidence=0.85, technical_score=0.75),
            RankingScore(candidate_id="CAND_002", final_score=0.80, confidence=0.90, technical_score=0.70), # higher confidence
            RankingScore(candidate_id="CAND_003", final_score=0.85, confidence=0.70, technical_score=0.60), # higher score
            RankingScore(candidate_id="CAND_004", final_score=0.80, confidence=0.85, technical_score=0.80), # higher tech score than 001
        ]
        sorted_scores = RankingEngine.rank_scores(scores)

        # Order should be CAND_003 (score 0.85) -> CAND_002 (score 0.80, conf 0.90) -> CAND_004 (score 0.80, conf 0.85, tech 0.80) -> CAND_001 (score 0.80, conf 0.85, tech 0.75)
        assert sorted_scores[0].candidate_id == "CAND_003"
        assert sorted_scores[1].candidate_id == "CAND_002"
        assert sorted_scores[2].candidate_id == "CAND_004"
        assert sorted_scores[3].candidate_id == "CAND_001"


class TestRecruiterReasoningAndExplanation:
    def test_reasoning_trace_and_explanation_generation(self):
        cand = _make_candidate("CAND_0000001")
        jd = _make_parsed_jd()
        fv = _make_feature_vector("CAND_0000001")
        bi = _make_behavioral_intelligence("CAND_0000001")
        rp = _make_reliability_profile("CAND_0000001")
        weights = FeatureWeightManager().weights

        score = ScoreAggregator.aggregate(cand, fv, bi, rp, weights)

        # Trace
        trace = RecruiterReasoning.capture_trace(cand, jd, fv, bi, rp, score)
        assert trace.candidate_id == "CAND_0000001"
        assert len(trace.rule_evaluations) > 0
        assert any(e["rule_name"] == "Experience Range Check" for e in trace.rule_evaluations)

        # Explanation
        explanation = RankingExplainer.generate_explanation(cand, jd, score, trace)
        assert explanation.fit_verdict in ("Strong Match", "Good Match", "Backup candidate", "High Risk / Not Recommended")
        assert len(explanation.summary) > 0
        assert len(explanation.strengths) > 0
        assert len(explanation.gaps) > 0


class TestFinalRankingService:
    def test_end_to_end_ranking_pipeline(self):
        c1 = _make_candidate("CAND_0000001", years_exp=6.0, notice_period_days=15)
        c2 = _make_candidate("CAND_0000002", years_exp=1.0, notice_period_days=90) # weaker candidate

        candidates = [c1, c2]
        feature_vectors = {
            "CAND_0000001": _make_feature_vector("CAND_0000001", technical=0.85, matching=0.85),
            "CAND_0000002": _make_feature_vector("CAND_0000002", technical=0.40, matching=0.35),
        }
        behavioral_intels = {
            "CAND_0000001": _make_behavioral_intelligence("CAND_0000001", score=0.80),
            "CAND_0000002": _make_behavioral_intelligence("CAND_0000002", score=0.30),
        }
        reliability_profiles = {
            "CAND_0000001": _make_reliability_profile("CAND_0000001", reliability_score=0.90),
            "CAND_0000002": _make_reliability_profile("CAND_0000002", reliability_score=0.45, fraud_risk=0.55),
        }
        jd = _make_parsed_jd()

        service = FinalRankingService()
        response = service.rank_candidates(
            candidates=candidates,
            feature_vectors=feature_vectors,
            behavioral_intels=behavioral_intels,
            reliability_profiles=reliability_profiles,
            parsed_jd=jd,
            strategy=RankingStrategyType.BALANCED,
        )

        assert isinstance(response, RankingResponse)
        assert response.total_candidates_evaluated == 2
        assert len(response.ranked_candidates) == 2
        # CAND_0000001 should be ranked 1st
        assert response.ranked_candidates[0].candidate_id == "CAND_0000001"
        assert response.ranked_candidates[0].rank == 1
        assert response.ranked_candidates[1].candidate_id == "CAND_0000002"
        assert response.ranked_candidates[1].rank == 2

        # Verify evaluator output
        assert "evaluation_verdict" in response.ranking_metadata


class TestRankingEvaluator:
    def test_shortlist_evaluator_metrics(self):
        jd = _make_parsed_jd()
        score = RankingScore(candidate_id="CAND_001", final_score=0.85, reliability_score=0.90)
        trace = RecruiterReasoningTrace(
            candidate_id="CAND_001",
            rule_evaluations=[],
            raw_signals_captured={"candidate_experience_years": 6.5, "matching_skills_count": 3},
            decision_steps=[],
            final_adjustments={},
        )
        explanation = RankingExplanation(summary="Strong", strengths=["Skills"], gaps=[], fit_verdict="Strong Match")
        
        ranked = [
            RankedCandidate(
                candidate_id="CAND_001",
                rank=1,
                final_score=0.85,
                confidence=0.90,
                score_details=score,
                explanation=explanation,
                reasoning_trace=trace,
            )
        ]

        summary = RankingEvaluator.evaluate_shortlist(ranked, jd, top_n=1)
        assert summary["average_experience_top_n"] == 6.5
        assert summary["average_reliability_top_n"] == 0.90
        assert summary["recommendation_rate"] == 1.0


class TestRankingMetrics:
    def test_ndcg_precision_mrr_calculations(self):
        score_dummy = RankingScore(candidate_id="dummy", final_score=0.0)
        ranked = [
            RankedCandidate(candidate_id="CAND_001", rank=1, final_score=0.90, confidence=0.9, score_details=score_dummy),
            RankedCandidate(candidate_id="CAND_002", rank=2, final_score=0.80, confidence=0.9, score_details=score_dummy),
            RankedCandidate(candidate_id="CAND_003", rank=3, final_score=0.70, confidence=0.9, score_details=score_dummy),
        ]
        # Ground truth relevance: CAND_001 (relevance 3), CAND_002 (relevance 0), CAND_003 (relevance 2)
        ground_truth = {"CAND_001": 3, "CAND_002": 0, "CAND_003": 2}

        # DCG calculation check:
        # DCG@3 = 3/log2(2) + 0/log2(3) + 2/log2(4) = 3 + 0 + 2/2 = 4.0
        # IDCG@3 (ideal order: 3, 2, 0) = 3/log2(2) + 2/log2(3) + 0/log2(4) = 3 + 2/1.585 = 3 + 1.262 = 4.262
        # NDCG@3 should be approx 4.0 / 4.262 = 0.938

        ndcg = RankingMetrics.calculate_ndcg(ranked, ground_truth, k=3)
        assert 0.85 <= ndcg <= 1.0

        # Precision@2 check (threshold >= 1): CAND_001 (3, relevant), CAND_002 (0, irrelevant) -> 1/2 = 0.50
        prec = RankingMetrics.calculate_precision_at_k(ranked, ground_truth, k=2, relevance_threshold=1)
        assert prec == 0.50

        # MRR check: first relevant (threshold >= 1) is CAND_001 at rank 1 -> reciprocal rank = 1.0
        mrr = RankingMetrics.calculate_mrr(ranked, ground_truth, relevance_threshold=1)
        assert mrr == 1.0
