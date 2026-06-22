"""Unit and Integration Tests for Phase 15: AI Recruiter Copilot & Hiring Intelligence Engine.

Covers:
    - Summary Generation (RecruiterSummaryGenerator)
    - Recommendation Logic (HireRecommendationEngine)
    - Interview Plans (InterviewPlanner)
    - Risk Analysis (RiskAnalysisEngine)
    - Insights Generation (RecruiterInsights)
    - Comparison Logic (CandidateComparison)
    - Hiring Decisions (CopilotService.generate_hiring_decision)
    - Evidence Generation (Factual, unsupported-claim-free logs)
    - Batch Reports (CopilotService.generate_batch_reports)
    - Performance Requirements (Top 100 Candidates under 30 seconds on CPU)
"""

import json
import time
from datetime import date
from pathlib import Path
from typing import List

import pytest

from models.candidate import Candidate
from models.profile import Profile, CompanySize
from models.career_history import CareerHistory
from models.education import Education, EducationTier
from models.skill import Skill, SkillProficiency
from models.language import Language, LanguageProficiency
from models.redrob_signals import RedrobSignals, PreferredWorkMode, ExpectedSalaryRange
from models.parsed_jd import ParsedJD
from models.jd_requirements import Requirement, RequirementImportance
from models.feature_vector import FeatureVector
from models.technical_features import TechnicalFeatures
from models.career_features import CareerFeatures
from models.leadership_features import LeadershipFeatures
from models.execution_features import ExecutionFeatures
from models.market_features import MarketFeatures
from models.matching_features import MatchingFeatures
from models.behavioral_intelligence import BehavioralIntelligence
from models.reliability_profile import ReliabilityProfile
from models.fraud_profile import FraudProfile
from models.consistency_profile import ConsistencyProfile
from models.anomaly_profile import AnomalyProfile
from models.hire_recommendation import RecommendationTier

from services.recruiter_summary_generator import RecruiterSummaryGenerator
from services.strengths_extractor import StrengthsExtractor
from services.risk_analysis_engine import RiskAnalysisEngine
from services.hire_recommendation_engine import HireRecommendationEngine
from services.interview_planner import InterviewPlanner
from services.candidate_comparison import CandidateComparison
from services.recruiter_insights import RecruiterInsights
from services.recruiter_copilot import RecruiterCopilot
from services.hiring_report_service import HiringReportService
from services.copilot_service import CopilotService

# ─────────────────────────────────────────────────────────────────────────────
# MOCK FIXTURES & BUILDERS
# ─────────────────────────────────────────────────────────────────────────────

def _make_mock_candidate(
    candidate_id: str,
    years_exp: float = 6.0,
    notice_period_days: int = 15,
    average_tenure: float = 3.0,
    recruiter_response_rate: float = 0.95,
    skills_list: List[str] = None,
) -> Candidate:
    skills_list = skills_list or ["Python", "SQL", "Machine Learning"]
    skills = [
        Skill(name=name, proficiency=SkillProficiency.ADVANCED, endorsements=10)
        for name in skills_list
    ]

    career_history = [
        CareerHistory(
            company="FinTech Corp",
            title="Senior Engineer",
            start_date=date(2023, 1, 1),
            end_date=None,
            duration_months=42,
            is_current=True,
            industry="Finance",
            company_size=CompanySize.MEDIUM,
            description="Working on machine learning models in production environments.",
        ),
        CareerHistory(
            company="Software Solutions",
            title="Software Developer",
            start_date=date(2020, 1, 1),
            end_date=date(2022, 12, 31),
            duration_months=36,
            is_current=False,
            industry="Technology",
            company_size=CompanySize.SMALL,
            description="Developing web APIs and databases.",
        ),
    ]

    signals = RedrobSignals(
        profile_completeness_score=95.0,
        signup_date=date(2020, 1, 1),
        last_active_date=date(2026, 6, 12),
        open_to_work_flag=True,
        profile_views_received_30d=45,
        applications_submitted_30d=5,
        recruiter_response_rate=recruiter_response_rate,
        avg_response_time_hours=2.0,
        skill_assessment_scores={},
        connection_count=350,
        endorsements_received=25,
        notice_period_days=notice_period_days,
        expected_salary_range_inr_lpa=ExpectedSalaryRange(min=20.0, max=30.0),
        preferred_work_mode=PreferredWorkMode.REMOTE,
        willing_to_relocate=True,
        github_activity_score=75.0,
        search_appearance_30d=150,
        saved_by_recruiters_30d=10,
        interview_completion_rate=0.98,
        offer_acceptance_rate=0.85,
        verified_email=True,
        verified_phone=True,
        linkedin_connected=True,
    )

    return Candidate(
        candidate_id=candidate_id,
        profile=Profile(
            anonymized_name=f"Mock Candidate {candidate_id}",
            headline="Senior Backend & Machine Learning Developer",
            summary="Strong backgrounds in Python development and data systems.",
            location="Mumbai",
            country="India",
            years_of_experience=years_exp,
            current_title="Senior Engineer",
            current_company="FinTech Corp",
            current_company_size=CompanySize.MEDIUM,
            current_industry="Finance",
        ),
        career_history=career_history,
        education=[
            Education(
                institution="IIT Bombay",
                degree="B.Tech",
                field_of_study="Computer Science",
                start_year=2016,
                end_year=2020,
                tier=EducationTier.TIER_1,
            )
        ],
        skills=skills,
        certifications=[],
        languages=[Language(language="English", proficiency=LanguageProficiency.PROFESSIONAL)],
        redrob_signals=signals,
    )


def _make_mock_feature_vector(
    candidate_id: str,
    retrieval_exp: float = 0.85,
    leadership_score: float = 0.80,
    matching_score: float = 0.85,
) -> FeatureVector:
    return FeatureVector(
        candidate_id=candidate_id,
        technical_features=TechnicalFeatures(
            retrieval_experience_score=retrieval_exp,
            ranking_experience_score=0.80,
            recommendation_experience_score=0.75,
            vector_db_experience_score=0.85,
            production_ml_score=0.90,
            llm_score=0.70,
            evaluation_score=0.80,
            distributed_systems_score=0.75,
            python_score=0.95,
            open_source_score=0.60,
            github_score=0.80,
        ),
        career_features=CareerFeatures(
            years_experience_score=0.80,
            growth_rate_score=0.85,
            stability_score=0.90,
            startup_score=0.50,
            average_tenure_score=0.85,
        ),
        leadership_features=LeadershipFeatures(
            people_management_score=leadership_score,
            technical_leadership_score=leadership_score,
            mentorship_score=leadership_score,
            cross_functional_score=leadership_score,
            ownership_score=leadership_score,
            decision_making_score=leadership_score,
        ),
        execution_features=ExecutionFeatures(
            ci_cd_deployment_score=0.80,
            infrastructure_score=0.85,
            observability_score=0.75,
            optimization_score=0.80,
        ),
        market_features=MarketFeatures(
            salary_fit_score=0.90,
            location_fit_score=0.85,
            notice_period_score=0.95,
            relocation_willingness=0.90,
        ),
        matching_features=MatchingFeatures(
            skill_coverage_score=matching_score,
            keyword_coverage_score=matching_score,
            semantic_alignment_score=matching_score,
            experience_alignment_score=matching_score,
            industry_alignment_score=matching_score,
            location_alignment_score=matching_score,
            career_alignment_score=matching_score,
        ),
        overall_feature_strength=0.85,
    )


def _make_mock_behavioral_intel(
    candidate_id: str,
    availability_score: float = 0.85,
    responsiveness_score: float = 0.90,
) -> BehavioralIntelligence:
    return BehavioralIntelligence(
        candidate_id=candidate_id,
        behavioral_score=0.85,
        trust_score=0.90,
        availability_score=availability_score,
        engagement_score=0.80,
        responsiveness_score=responsiveness_score,
        join_probability=0.85,
        recruiter_friendliness=0.90,
        confidence=0.90,
        evidence=["Quick responses verified", "Prefers immediate start"],
    )


def _make_mock_reliability_profile(
    candidate_id: str,
    reliability_score: float = 0.90,
    fraud_risk: float = 0.05,
) -> ReliabilityProfile:
    return ReliabilityProfile(
        candidate_id=candidate_id,
        quality_score=0.85,
        fraud_penalty=fraud_risk,
        consistency_score=0.90,
        reliability_score=reliability_score,
        behavioral_score=0.85,
        trust_score=0.90,
        confidence=0.90,
        fraud_profile=FraudProfile(
            candidate_id=candidate_id,
            skill_stuffing_risk=fraud_risk,
            timeline_risk=fraud_risk,
            identity_risk=0.01,
            experience_risk=fraud_risk,
            anomaly_risk=0.02,
            overall_fraud_risk=fraud_risk,
            confidence=0.90,
        ),
        consistency_profile=ConsistencyProfile(
            candidate_id=candidate_id,
            career_consistency=0.90,
            timeline_consistency=0.85,
            skill_consistency=0.95,
            title_consistency=0.90,
            experience_consistency=0.85,
            consistency_score=0.90,
            confidence=0.90,
        ),
        anomaly_profile=AnomalyProfile(
            candidate_id=candidate_id,
            anomaly_count=0,
            severity_score=0.0,
            anomaly_types=[],
            risk_score=0.0,
        ),
        evidence=["Consistent career logs", "Verified contacts"],
    )


@pytest.fixture
def sample_jd() -> ParsedJD:
    return ParsedJD(
        job_title="Senior ML Engineer",
        company_name="InnovateCorp",
        experience_range=(3.0, 10.0),
        must_have=[
            Requirement(name="Python", importance=RequirementImportance.CRITICAL),
            Requirement(name="SQL", importance=RequirementImportance.IMPORTANT),
            Requirement(name="Machine Learning", importance=RequirementImportance.IMPORTANT),
        ],
        nice_to_have=[
            Requirement(name="Retrieval", importance=RequirementImportance.OPTIONAL),
        ],
        raw_text="Looking for a Senior ML Engineer with Python, SQL, and Machine Learning experience. Retrieval is a plus.",
    )


@pytest.fixture
def mock_candidate_dict_data() -> List[dict]:
    # Formulate dictionaries matching candidate database serializations
    return [
        {
            "candidate_id": "CAND_0000001",
            "profile": {
                "anonymized_name": "Alice Smith",
                "headline": "Lead ML Developer",
                "summary": "Expert Python developer specializing in Machine Learning.",
                "location": "Bengaluru",
                "country": "India",
                "years_of_experience": 8.0,
                "current_title": "Lead ML Developer",
                "current_company": "TechCorp",
                "current_company_size": "501-1000",
                "current_industry": "Technology",
            },
            "career_history": [
                {
                    "company": "TechCorp",
                    "title": "Lead ML Developer",
                    "start_date": "2021-01-01",
                    "end_date": None,
                    "duration_months": 65,
                    "is_current": True,
                    "industry": "Technology",
                    "company_size": "501-1000",
                    "description": "Designing retrieval algorithms in Python.",
                }
            ],
            "education": [],
            "skills": [
                {"name": "Python", "proficiency": "expert", "endorsements": 50},
                {"name": "SQL", "proficiency": "advanced", "endorsements": 30},
                {"name": "Machine Learning", "proficiency": "advanced", "endorsements": 25},
            ],
            "certifications": [],
            "languages": [],
            "redrob_signals": {
                "profile_completeness_score": 95.0,
                "signup_date": "2021-01-01",
                "last_active_date": "2026-06-10",
                "open_to_work_flag": True,
                "profile_views_received_30d": 50,
                "applications_submitted_30d": 12,
                "recruiter_response_rate": 0.98,
                "avg_response_time_hours": 1.5,
                "skill_assessment_scores": {},
                "connection_count": 450,
                "endorsements_received": 15,
                "notice_period_days": 15,
                "expected_salary_range_inr_lpa": {"min": 35.0, "max": 50.0},
                "preferred_work_mode": "remote",
                "willing_to_relocate": True,
                "github_activity_score": 85.0,
                "search_appearance_30d": 250,
                "saved_by_recruiters_30d": 18,
                "interview_completion_rate": 1.0,
                "offer_acceptance_rate": 0.90,
                "verified_email": True,
                "verified_phone": True,
                "linkedin_connected": True,
            },
        },
        {
            "candidate_id": "CAND_0000002",
            "profile": {
                "anonymized_name": "Bob Jones",
                "headline": "Software Engineer",
                "summary": "Backend developer working on databases.",
                "location": "Delhi",
                "country": "India",
                "years_of_experience": 4.0,
                "current_title": "Software Engineer",
                "current_company": "App Studio",
                "current_company_size": "51-200",
                "current_industry": "Technology",
            },
            "career_history": [
                {
                    "company": "App Studio",
                    "title": "Software Engineer",
                    "start_date": "2022-06-01",
                    "end_date": None,
                    "duration_months": 48,
                    "is_current": True,
                    "industry": "Technology",
                    "company_size": "51-200",
                    "description": "Building standard database apps.",
                }
            ],
            "education": [],
            "skills": [
                {"name": "Python", "proficiency": "intermediate", "endorsements": 10},
                {"name": "SQL", "proficiency": "intermediate", "endorsements": 5},
            ],
            "certifications": [],
            "languages": [],
            "redrob_signals": {
                "profile_completeness_score": 80.0,
                "signup_date": "2022-06-01",
                "last_active_date": "2026-06-01",
                "open_to_work_flag": False,
                "profile_views_received_30d": 10,
                "applications_submitted_30d": 1,
                "recruiter_response_rate": 0.50,
                "avg_response_time_hours": 12.0,
                "skill_assessment_scores": {},
                "connection_count": 80,
                "endorsements_received": 2,
                "notice_period_days": 90,
                "expected_salary_range_inr_lpa": {"min": 15.0, "max": 22.0},
                "preferred_work_mode": "onsite",
                "willing_to_relocate": False,
                "github_activity_score": 10.0,
                "search_appearance_30d": 15,
                "saved_by_recruiters_30d": 1,
                "interview_completion_rate": 0.70,
                "offer_acceptance_rate": 0.60,
                "verified_email": True,
                "verified_phone": True,
                "linkedin_connected": False,
            },
        },
    ]


@pytest.fixture
def temp_dataset_file(tmp_path: Path, mock_candidate_dict_data: List[dict]) -> Path:
    file_path = tmp_path / "candidates.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        for item in mock_candidate_dict_data:
            f.write(json.dumps(item) + "\n")
    return file_path

# ─────────────────────────────────────────────────────────────────────────────
# UNIT TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_summary_generation(sample_jd):
    """Tests summary generation for accuracy, length, and presence of key signals."""
    candidate = _make_mock_candidate("CAND_0000001", skills_list=["Python", "SQL", "Machine Learning", "Retrieval"])
    rp = _make_mock_reliability_profile("CAND_0000001", reliability_score=0.95)

    summary = RecruiterSummaryGenerator.generate_summary(candidate, rp, sample_jd)
    
    assert isinstance(summary, str)
    assert len(summary) > 20
    assert "senior engineer" in summary.lower() or "python" in summary.lower()
    assert "reliability" in summary.lower() or "high" in summary.lower() or "strong" in summary.lower()


def test_recommendation_logic(sample_jd):
    """Tests that final score and profile thresholds translate correctly to hiring tiers."""
    candidate = _make_mock_candidate("CAND_0000001")
    bi = _make_mock_behavioral_intel("CAND_0000001", availability_score=0.85)

    # 1. Strong Hire scenario: final_score > 0.90, rel_score > 0.85, avail_score > 0.70
    rp_strong = _make_mock_reliability_profile("CAND_0000001", reliability_score=0.92)
    rec_strong = HireRecommendationEngine.generate_recommendation(
        candidate=candidate,
        final_score=0.94,
        confidence=0.90,
        behavioral_intel=bi,
        reliability_profile=rp_strong,
        parsed_jd=sample_jd
    )
    assert rec_strong.recommendation == RecommendationTier.STRONG_HIRE
    assert len(rec_strong.evidence) > 0
    assert any("must-have skill coverage" in ev for ev in rec_strong.evidence)

    # 2. Hire scenario: final_score > 0.80
    rp_hire = _make_mock_reliability_profile("CAND_0000001", reliability_score=0.80)
    rec_hire = HireRecommendationEngine.generate_recommendation(
        candidate=candidate,
        final_score=0.85,
        confidence=0.88,
        behavioral_intel=bi,
        reliability_profile=rp_hire,
        parsed_jd=sample_jd
    )
    assert rec_hire.recommendation == RecommendationTier.HIRE

    # 3. Reject scenario: otherwise
    rec_reject = HireRecommendationEngine.generate_recommendation(
        candidate=candidate,
        final_score=0.45,
        confidence=0.75,
        behavioral_intel=bi,
        reliability_profile=rp_hire,
        parsed_jd=sample_jd
    )
    assert rec_reject.recommendation == RecommendationTier.REJECT
    assert len(rec_reject.risks) >= 0


def test_strengths_and_weaknesses(sample_jd):
    """Tests strengths and weaknesses extraction."""
    candidate = _make_mock_candidate("CAND_0000001", skills_list=["Python", "SQL"])
    fv = _make_mock_feature_vector("CAND_0000001", retrieval_exp=0.90, matching_score=0.70)

    strengths = StrengthsExtractor.extract_strengths(candidate, fv, sample_jd)
    weaknesses = StrengthsExtractor.extract_weaknesses(candidate, fv, sample_jd)

    assert isinstance(strengths, list)
    assert isinstance(weaknesses, list)
    assert len(strengths) > 0
    assert any("competence" in s.lower() or "experience" in s.lower() or "stability" in s.lower() for s in strengths)


def test_risk_analysis():
    """Tests the detection of availability gaps, weak responsiveness, skill gaps, or fraud indications."""
    candidate_at_risk = _make_mock_candidate(
        "CAND_0000002",
        notice_period_days=90,
        recruiter_response_rate=0.45
    )
    bi = _make_mock_behavioral_intel("CAND_0000002", availability_score=0.30, responsiveness_score=0.40)
    rp = _make_mock_reliability_profile("CAND_0000002", reliability_score=0.55, fraud_risk=0.65)
    fv = _make_mock_feature_vector("CAND_0000002")

    risk_report = RiskAnalysisEngine.analyze_risks(candidate_at_risk, bi, rp, fv)
    assert risk_report["risk_score"] > 0.50
    detected = risk_report["detected_risks"]
    assert any("availability" in r.lower() or "notice" in r.lower() for r in detected)
    assert any("fraud" in r.lower() or "credibility" in r.lower() for r in detected)
    assert any("responsiveness" in r.lower() or "response rate" in r.lower() for r in detected)


def test_interview_plans():
    """Tests interview question mapping based on profile scores and risk flags."""
    candidate = _make_mock_candidate("CAND_0000001", skills_list=["Python", "SQL", "Machine Learning", "Retrieval"])
    fv = _make_mock_feature_vector("CAND_0000001", retrieval_exp=0.85, leadership_score=0.80)
    risk_report = {
        "risk_score": 40.0,
        "detected_risks": ["Potential fraud indicator on timeline verification"]
    }

    plan = InterviewPlanner.generate_plan(candidate, fv, risk_report)

    assert plan.estimated_interview_rounds >= 2
    assert len(plan.technical_questions) > 0
    assert len(plan.leadership_questions) > 0
    assert len(plan.risk_validation_questions) > 0

    # Confirm correct mapping: retrieval_experience_score > 0.80 should map to retrieval question
    assert any("retrieval" in q.lower() for q in plan.technical_questions)
    # Confirm leadership mapping
    assert any("influence" in q.lower() or "leadership" in q.lower() or "decision" in q.lower() for q in plan.leadership_questions)
    # Confirm risk questions maps to fraud validation
    assert any("verification" in q.lower() or "timeline" in q.lower() or "role" in q.lower() for q in plan.risk_validation_questions)


def test_recruiter_insights(sample_jd):
    """Tests that candidate insights are correctly categorized and prioritized."""
    candidate = _make_mock_candidate("CAND_0000001", notice_period_days=90)
    rp = _make_mock_reliability_profile("CAND_0000001", fraud_risk=0.60)
    fv = _make_mock_feature_vector("CAND_0000001", leadership_score=0.85)

    insights = RecruiterInsights.generate_insights(candidate, rp, fv)
    assert len(insights) >= 2
    
    # Assert prioritization sorts critical and high severity to the top
    severities = [i.severity for i in insights]
    sorted_severities = sorted(severities, key=lambda x: {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "INFO": 1}.get(x, 1), reverse=True)
    assert severities == sorted_severities


def test_candidate_comparison(sample_jd):
    """Tests pairwise comparisons delta scoring and winner explanations."""
    cand_a = _make_mock_candidate("CAND_0000001", skills_list=["Python", "SQL", "Machine Learning"])
    cand_b = _make_mock_candidate("CAND_0000002", skills_list=["Python"])

    fv_a = _make_mock_feature_vector("CAND_0000001", matching_score=0.90)
    fv_b = _make_mock_feature_vector("CAND_0000002", matching_score=0.40)

    from models.ranking_score import RankingScore
    score_a = RankingScore(candidate_id="CAND_0000001", final_score=0.92, raw_score=0.90, calibrated_score=0.92, confidence=0.90, ranking_strategy="default")
    score_b = RankingScore(candidate_id="CAND_0000002", final_score=0.52, raw_score=0.50, calibrated_score=0.52, confidence=0.85, ranking_strategy="default")

    rp_a = _make_mock_reliability_profile("CAND_0000001", reliability_score=0.95)
    rp_b = _make_mock_reliability_profile("CAND_0000002", reliability_score=0.60)

    comp = CandidateComparison.compare_candidates(
        candidate_a=cand_a, fv_a=fv_a, score_a=score_a, rp_a=rp_a,
        candidate_b=cand_b, fv_b=fv_b, score_b=score_b, rp_b=rp_b
    )

    assert comp.winner == "CAND_0000001"
    assert comp.winner_reason != ""
    assert comp.feature_differences["matching_score_diff"] > 0.0
    assert comp.decision_confidence > 0.5


def test_report_service_exports():
    """Verifies markdown and HTML generation and glassmorphic formatting validation."""
    report = RecruiterCopilot.generate_report(
        candidate=_make_mock_candidate("CAND_0000001"),
        final_score=0.92,
        confidence=0.90,
        feature_vector=_make_mock_feature_vector("CAND_0000001"),
        behavioral_intel=_make_mock_behavioral_intel("CAND_0000001"),
        reliability_profile=_make_mock_reliability_profile("CAND_0000001"),
        parsed_jd=ParsedJD(
            job_title="Engineer",
            company_name="A",
            experience_range=(2.0, 5.0),
            must_have=[Requirement(name="Python", importance=RequirementImportance.CRITICAL)]
        )
    )

    md = HiringReportService.generate_report(report, format_type="markdown")
    html = HiringReportService.generate_report(report, format_type="html")

    assert "# Recruiter Intelligence Report" in md
    assert "<title>Recruiter Copilot Report" in html
    assert "Outfit" in html  # Premium typography verify
    assert "backdrop-filter" in html  # Glassmorphic style verify

# ─────────────────────────────────────────────────────────────────────────────
# INTEGRATION & END-TO-END TESTS (CopilotService)
# ─────────────────────────────────────────────────────────────────────────────

def test_copilot_service_integration(temp_dataset_file, sample_jd):
    """Tests end-to-end recruiter candidate evaluation using the CopilotService."""
    service = CopilotService(dataset_path=temp_dataset_file)

    # Test single candidate report
    report = service.generate_candidate_report("CAND_0000001", sample_jd)
    assert report is not None
    assert report.candidate_id == "CAND_0000001"
    assert report.hire_recommendation.recommendation in list(RecommendationTier)
    assert len(report.evidence) > 0

    # Test hiring decision object packing
    decision = service.generate_hiring_decision("CAND_0000001", sample_jd)
    assert decision is not None
    assert decision.decision in ["Submit to Hiring Manager", "Hold / Backup Stage", "Reject / Archive Profile"]
    assert decision.confidence > 0.5
    assert len(decision.supporting_evidence) > 0

    # Test comparison interface
    comparison = service.compare_candidates("CAND_0000001", "CAND_0000002", sample_jd)
    assert comparison is not None
    assert comparison.winner == "CAND_0000001"
    assert comparison.decision_confidence > 0.6


def test_copilot_service_batch_reports(temp_dataset_file, sample_jd):
    """Tests batch report generations."""
    service = CopilotService(dataset_path=temp_dataset_file)
    reports = service.generate_batch_reports(["CAND_0000001", "CAND_0000002"], sample_jd)

    assert len(reports) == 2
    assert "CAND_0000001" in reports
    assert "CAND_0000002" in reports

# ─────────────────────────────────────────────────────────────────────────────
# PERFORMANCE REQUIREMENT BENCHMARK
# ─────────────────────────────────────────────────────────────────────────────

def test_batch_performance_scale(tmp_path, sample_jd, mock_candidate_dict_data):
    """Ensures reports for 100 Candidates are compiled in < 30 seconds on CPU."""
    # Build 100 mock candidate dicts based on the mock data template
    large_list = []
    base_candidate_1 = mock_candidate_dict_data[0]
    base_candidate_2 = mock_candidate_dict_data[1]

    for idx in range(100):
        # Create varying IDs like CAND_0000100 to CAND_0000199
        cid = f"CAND_{1000000 + idx}"
        template = base_candidate_1 if idx % 2 == 0 else base_candidate_2
        cand_dict = template.copy()
        cand_dict["candidate_id"] = cid
        large_list.append(cand_dict)

    performance_dataset = tmp_path / "perf_candidates.jsonl"
    with open(performance_dataset, "w", encoding="utf-8") as f:
        for entry in large_list:
            f.write(json.dumps(entry) + "\n")

    # Ingest using CopilotService and benchmark
    service = CopilotService(dataset_path=performance_dataset)
    target_ids = [c["candidate_id"] for c in large_list]

    start_time = time.time()
    reports = service.generate_batch_reports(target_ids, sample_jd)
    duration = time.time() - start_time

    print(f"\n[Performance Benchmark] Compiled {len(reports)} candidate reports in {duration:.3f} seconds.")

    assert len(reports) == 100
    assert duration < 30.0, f"Compilation took {duration:.2f}s, which exceeds the 30 seconds performance budget."
