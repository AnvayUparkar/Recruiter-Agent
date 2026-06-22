"""Unit tests for Candidate Intelligence Engine components.

Verifies skill detection, career trajectory analysis, behavioral profiling,
market attractiveness, text formatting, and pipeline orchestration.
"""

from datetime import date
import pytest
from models.candidate import Candidate
from models.technical_profile import TechnicalProfile
from models.career_profile import CareerProfile
from models.behavioral_profile import BehavioralProfile
from models.market_profile import MarketProfile

from services.skill_analyzer import SkillAnalyzer
from services.career_analyzer import CareerAnalyzer
from services.behavioral_analyzer import BehavioralAnalyzer
from services.market_analyzer import MarketAnalyzer
from services.candidate_text_builder import CandidateTextBuilder
from services.candidate_profiler import CandidateProfiler
from services.candidate_intelligence_service import CandidateIntelligenceService


@pytest.fixture
def sample_candidate_dict() -> dict:
    """Fixture returning a standard valid candidate profile dictionary matching schema."""
    return {
        "candidate_id": "CAND_1234567",
        "profile": {
            "anonymized_name": "Jane Doe",
            "headline": "Lead ML Systems Engineer",
            "summary": "Experienced engineer designing large-scale ML systems and RAG pipelines.",
            "location": "Bangalore, Karnataka",
            "country": "India",
            "years_of_experience": 8.5,
            "current_title": "Lead ML Systems Engineer",
            "current_company": "Airtel",
            "current_company_size": "10001+",
            "current_industry": "Telecommunications",
        },
        "career_history": [
            {
                "company": "Airtel",
                "title": "Lead ML Systems Engineer",
                "start_date": "2024-01-01",
                "end_date": None,
                "duration_months": 30,
                "is_current": True,
                "industry": "Telecommunications",
                "company_size": "10001+",
                "description": "Building production search and recommendation pipelines using Elasticsearch and python.",
            },
            {
                "company": "TCS Services",
                "title": "Software Engineer",
                "start_date": "2020-01-01",
                "end_date": "2023-12-31",
                "duration_months": 48,
                "is_current": False,
                "industry": "IT Consulting",
                "company_size": "10001+",
                "description": "Maintained legacy application code.",
            },
        ],
        "education": [
            {
                "institution": "IIT Madras",
                "degree": "B.Tech",
                "field_of_study": "Computer Science",
                "start_year": 2016,
                "end_year": 2020,
                "grade": "8.5 CGPA",
                "tier": "tier_1",
            }
        ],
        "skills": [
            {
                "name": "Python",
                "proficiency": "expert",
                "endorsements": 45,
                "duration_months": 96,
            },
            {
                "name": "Kubernetes",
                "proficiency": "advanced",
                "endorsements": 12,
                "duration_months": 36,
            },
            {
                "name": "Elasticsearch",
                "proficiency": "advanced",
                "endorsements": 10,
                "duration_months": 24,
            },
        ],
        "certifications": [
            {
                "name": "AWS Certified Solutions Architect",
                "issuer": "Amazon Web Services",
                "year": 2024,
            }
        ],
        "languages": [{"language": "English", "proficiency": "native"}],
        "redrob_signals": {
            "profile_completeness_score": 95.0,
            "signup_date": "2020-01-01",
            "last_active_date": "2026-06-01",
            "open_to_work_flag": True,
            "profile_views_received_30d": 120,
            "applications_submitted_30d": 5,
            "recruiter_response_rate": 0.85,
            "avg_response_time_hours": 2.4,
            "skill_assessment_scores": {"Python": 92.0, "Kubernetes": 78.5},
            "connection_count": 350,
            "endorsements_received": 57,
            "notice_period_days": 30,
            "expected_salary_range_inr_lpa": {"min": 25.0, "max": 35.0},
            "preferred_work_mode": "hybrid",
            "willing_to_relocate": True,
            "github_activity_score": 85.0,
            "search_appearance_30d": 45,
            "saved_by_recruiters_30d": 12,
            "interview_completion_rate": 1.0,
            "offer_acceptance_rate": 0.90,
            "verified_email": True,
            "verified_phone": True,
            "linkedin_connected": True,
        },
    }


def test_skill_analyzer_detection(sample_candidate_dict):
    """Verifies that SkillAnalyzer detects explicit and implicit technologies."""
    candidate = Candidate.model_validate(sample_candidate_dict)
    analyzer = SkillAnalyzer()
    skills = analyzer.analyze_skills(candidate)

    # Python is explicitly declared and has python keywords
    assert skills["python"]["score"] > 0.5
    assert skills["python"]["confidence"] > 0.5

    # Elasticsearch matches retrieval keyword list
    assert skills["retrieval"]["score"] > 0.0
    assert skills["retrieval"]["confidence"] > 0.0

    # Recommendation is implicitly present in the career history description
    assert skills["recommendation"]["score"] > 0.0

    # No LLM keywords exist in career history or skills
    assert skills["llm"]["score"] == 0.0


def test_career_analyzer_metrics(sample_candidate_dict):
    """Verifies CareerAnalyzer stability indexes, product ratios, and growth."""
    candidate = Candidate.model_validate(sample_candidate_dict)
    analyzer = CareerAnalyzer()
    profile = analyzer.generate_career_profile(candidate)

    assert profile.years_experience == 8.5
    # Airtel is marked is_product_company=True in mock data, TCS is False (service company)
    assert profile.product_company_ratio > 0.0
    assert profile.average_tenure > 1.0
    assert 0.0 <= profile.career_stability <= 1.0
    assert profile.career_strength_score() > 0.0


def test_behavioral_analyzer_rates(sample_candidate_dict):
    """Verifies BehavioralAnalyzer scoring of notice periods, activity, and verifications."""
    candidate = Candidate.model_validate(sample_candidate_dict)
    analyzer = BehavioralAnalyzer()
    profile = analyzer.generate_behavioral_profile(candidate)

    assert 0.0 <= profile.availability_score <= 1.0
    assert 0.0 <= profile.responsiveness_score <= 1.0
    assert profile.interview_reliability == 1.0  # From signals
    assert profile.verification_score == 1.0  # Email, phone, and linkedin connected
    assert profile.behavioral_strength_score() > 0.0


def test_market_analyzer_scores(sample_candidate_dict):
    """Verifies MarketAnalyzer salary rating, recruiter interest, and relocation scores."""
    candidate = Candidate.model_validate(sample_candidate_dict)
    analyzer = MarketAnalyzer()
    profile = analyzer.generate_market_profile(candidate)

    assert 0.0 <= profile.recruiter_interest <= 1.0
    assert profile.relocation_score == 1.0  # Willing to relocate
    assert profile.salary_expectation_score > 0.0
    assert profile.market_strength_score() > 0.0

    # Check high-salary score drop
    sample_candidate_dict["redrob_signals"]["expected_salary_range_inr_lpa"]["min"] = 90.0
    sample_candidate_dict["redrob_signals"]["expected_salary_range_inr_lpa"]["max"] = 100.0
    cand_high_sal = Candidate.model_validate(sample_candidate_dict)
    profile_high = analyzer.generate_market_profile(cand_high_sal)
    assert profile_high.salary_expectation_score == 0.20


def test_candidate_text_builder(sample_candidate_dict):
    """Verifies that CandidateTextBuilder formats documents and summaries under 100 words."""
    candidate = Candidate.model_validate(sample_candidate_dict)
    tech = TechnicalProfile(retrieval_experience=0.8, python_experience=0.9, llm_experience=0.7)
    career = CareerProfile(years_experience=8.5, product_company_ratio=0.5, career_stability=0.8, average_tenure=3.0)
    behavioral = BehavioralProfile(availability_score=0.9, responsiveness_score=0.9, interview_reliability=1.0, verification_score=1.0)
    market = MarketProfile(recruiter_interest=0.8, salary_expectation_score=0.8, market_competitiveness=0.7)

    summary = CandidateTextBuilder.build_short_summary(candidate, tech, career, behavioral, market)
    assert len(summary.split()) < 100
    assert "Jane Doe" in summary

    doc = CandidateTextBuilder.build_candidate_document(candidate, tech, career, behavioral, market)
    assert "Candidate ID: CAND_1234567" in doc
    assert "Airtel" in doc
    assert "IIT Madras" in doc

    emb = CandidateTextBuilder.build_embedding_text(candidate, tech, career, behavioral, market)
    assert "Jane Doe" not in emb  # Embeddings should emphasize title, tech, skills
    assert "Lead ML Systems Engineer" in emb
    assert "retrieval systems" in emb


def test_candidate_profiler_orchestration(sample_candidate_dict):
    """Verifies CandidateProfiler orchestrates analyzers into a CandidateProfile."""
    candidate = Candidate.model_validate(sample_candidate_dict)
    profiler = CandidateProfiler()
    profile = profiler.profile_candidate(candidate)

    assert profile.candidate_id == "CAND_1234567"
    assert profile.overall_strength > 0.0
    assert len(profile.candidate_summary.split()) < 100
    assert profile.technical_profile.python_experience > 0.0


def test_candidate_intelligence_service_pipeline(sample_candidate_dict):
    """Verifies single, batch, and streaming candidate intelligence pipeline execution."""
    candidate = Candidate.model_validate(sample_candidate_dict)
    service = CandidateIntelligenceService()

    # Single
    prof = service.build_candidate_intelligence(candidate)
    assert prof.candidate_id == "CAND_1234567"

    # Batch
    batch = service.build_batch_profiles([candidate, candidate])
    assert len(batch) == 2
    assert batch[0].candidate_id == "CAND_1234567"

    # Stream
    stream_results = list(service.profile_stream([candidate, candidate]))
    assert len(stream_results) == 2
    assert stream_results[1].candidate_id == "CAND_1234567"
