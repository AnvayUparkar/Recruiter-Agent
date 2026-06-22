"""Unit tests for candidate schemas, models, and validator utilities.

Exercises validation errors, helper properties, and data parsing logic.
"""

from datetime import date
import pytest
from pydantic import ValidationError

from models import (
    Candidate,
    Profile,
    CareerHistory,
    Education,
    Skill,
    Certification,
    Language,
    RedrobSignals,
    CompanySize,
    EducationTier,
    SkillProficiency,
    LanguageProficiency,
    PreferredWorkMode,
)
from services.schema_validator import validate_candidate, parse_candidate, parse_batch


@pytest.fixture
def valid_candidate_dict() -> dict:
    """Fixture returning a standard valid candidate profile dictionary matching schema."""
    return {
        "candidate_id": "CAND_1234567",
        "profile": {
            "anonymized_name": "John Doe",
            "headline": "Lead ML Systems Engineer",
            "summary": "Experienced engineer designing large-scale ML systems.",
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
                "duration_months": 29,
                "is_current": True,
                "industry": "Telecommunications",
                "company_size": "10001+",
                "description": "Building production search and recommendation pipelines on Kubernetes and AWS.",
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
                "description": "Maintained legacy applications.",
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


def test_profile_validation():
    """Tests the constraints on years_of_experience and company size."""
    # Valid profile instantiation
    p = Profile(
        anonymized_name="Candidate A",
        headline="DevOps Specialist",
        summary="Experienced DevOps Engineer.",
        location="Berlin",
        country="Germany",
        years_of_experience=5.0,
        current_title="Senior Devops",
        current_company="Fintech Corp",
        current_company_size=CompanySize.MEDIUM,
        current_industry="Finance",
    )
    assert p.years_of_experience == 5.0

    # Test out-of-bounds experience
    with pytest.raises(ValidationError):
        Profile(
            anonymized_name="Candidate A",
            headline="Dev",
            summary="Summary",
            location="Berlin",
            country="Germany",
            years_of_experience=55.0,  # Max is 50
            current_title="Senior Dev",
            current_company="Fintech Corp",
            current_company_size="1-10",
            current_industry="Finance",
        )


def test_career_history_properties():
    """Tests career history derived properties (tenure, product company, keywords)."""
    job = CareerHistory(
        company="Google Inc.",
        title="Staff Engineer",
        start_date=date(2022, 1, 1),
        end_date=None,
        duration_months=24,
        is_current=True,
        industry="Tech",
        company_size=CompanySize.ENTERPRISE,
        description="Developing search algorithms on Kubernetes at high scale in production.",
    )

    assert job.tenure_years == 2.0
    assert job.is_product_company is True
    assert job.has_production_keywords is True

    # Test service company detection
    consulting_job = CareerHistory(
        company="Cognizant Tech Solutions",
        title="Consultant",
        start_date=date(2018, 1, 1),
        end_date=date(2020, 1, 1),
        duration_months=24,
        is_current=False,
        industry="Tech",
        company_size=CompanySize.ENTERPRISE,
        description="Internal bug fixing.",
    )
    assert consulting_job.is_product_company is False
    assert consulting_job.has_production_keywords is False


def test_education_year_constraint():
    """Tests year validator checks on academic range."""
    # Invalid range: end_year before start_year
    with pytest.raises(ValidationError) as exc_info:
        Education(
            institution="IIT",
            degree="M.Tech",
            field_of_study="AI",
            start_year=2024,
            end_year=2020,  # Invalid
            tier=EducationTier.TIER_1,
        )
    assert "end_year" in str(exc_info.value)


def test_skill_strength_score():
    """Tests the score conversion of proficiency enums."""
    s = Skill(
        name="Go",
        proficiency=SkillProficiency.EXPERT,
        endorsements=10,
        duration_months=48,
    )
    assert s.skill_strength_score() == 1.00

    s2 = Skill(
        name="Java",
        proficiency=SkillProficiency.BEGINNER,
        endorsements=0,
    )
    assert s2.skill_strength_score() == 0.25


def test_certification_recency():
    """Tests certification years and recency detection logic."""
    c1 = Certification(name="CKA", issuer="Linux Foundation", year=2024)
    assert c1.is_recent(2026) is True

    c2 = Certification(name="CKA", issuer="Linux Foundation", year=2015)
    assert c2.is_recent(2026) is False


def test_language_strength():
    """Tests the language validation and strength score."""
    l = Language(language="Spanish", proficiency=LanguageProficiency.CONVERSATIONAL)
    assert l.language_score() == 0.50


def test_redrob_signals():
    """Tests activity date logic, compensation ranges and verification status."""
    signals = RedrobSignals(
        profile_completeness_score=80.0,
        signup_date=date(2022, 1, 1),
        last_active_date=date(2026, 6, 1),
        open_to_work_flag=True,
        profile_views_received_30d=50,
        applications_submitted_30d=2,
        recruiter_response_rate=0.90,
        avg_response_time_hours=5.0,
        skill_assessment_scores={"Go": 85.0},
        connection_count=100,
        endorsements_received=15,
        notice_period_days=60,
        expected_salary_range_inr_lpa={"min": 15.0, "max": 20.0},
        preferred_work_mode=PreferredWorkMode.REMOTE,
        willing_to_relocate=False,
        github_activity_score=40.0,
        search_appearance_30d=15,
        saved_by_recruiters_30d=5,
        interview_completion_rate=1.0,
        offer_acceptance_rate=-1.0,
        verified_email=True,
        verified_phone=True,
        linkedin_connected=True,
    )

    assert signals.days_since_last_active(date(2026, 6, 15)) == 14
    assert signals.is_recently_active(date(2026, 6, 15), days=30) is True
    assert signals.has_verified_profile() is True

    # Test invalid date ranges
    with pytest.raises(ValidationError):
        RedrobSignals(
            profile_completeness_score=80.0,
            signup_date=date(2026, 6, 1),
            last_active_date=date(2022, 1, 1),  # Active before signup
            open_to_work_flag=True,
            profile_views_received_30d=0,
            applications_submitted_30d=0,
            recruiter_response_rate=0.0,
            avg_response_time_hours=0.0,
            skill_assessment_scores={},
            connection_count=0,
            endorsements_received=0,
            notice_period_days=30,
            expected_salary_range_inr_lpa={"min": 10.0, "max": 12.0},
            preferred_work_mode="remote",
            willing_to_relocate=False,
            github_activity_score=-1.0,
            search_appearance_30d=0,
            saved_by_recruiters_30d=0,
            interview_completion_rate=1.0,
            offer_acceptance_rate=1.0,
            verified_email=True,
            verified_phone=False,
            linkedin_connected=False,
        )


def test_candidate_regex_and_aggregate(valid_candidate_dict):
    """Tests regex constraints on candidate IDs and verifies aggregate helpers."""
    candidate = Candidate.model_validate(valid_candidate_dict)
    assert candidate.candidate_id == "CAND_1234567"
    assert candidate.total_years_experience == 8.5
    assert candidate.current_role == "Lead ML Systems Engineer"
    assert candidate.current_company == "Airtel"
    assert len(candidate.top_skills) == 2
    assert candidate.top_skills[0].name == "Python"  # Sorted expert first
    assert candidate.average_tenure == pytest.approx(38.5 / 12.0)
    assert "Lead ML Systems Engineer" in candidate.candidate_summary

    # Test invalid ID pattern
    invalid_dict = valid_candidate_dict.copy()
    invalid_dict["candidate_id"] = "CAND_1234"  # Less than 7 digits
    with pytest.raises(ValidationError):
        Candidate.model_validate(invalid_dict)


def test_schema_validator(valid_candidate_dict):
    """Tests the service-level schema validation and batch parsing functionalities."""
    is_valid, errors = validate_candidate(valid_candidate_dict)
    assert is_valid is True
    assert errors is None

    # Test parsing valid dictionary
    candidate_obj = parse_candidate(valid_candidate_dict)
    assert isinstance(candidate_obj, Candidate)

    # Test parsing invalid candidate
    invalid_dict = valid_candidate_dict.copy()
    invalid_dict["candidate_id"] = "WRONG_ID"
    is_valid, errors = validate_candidate(invalid_dict)
    assert is_valid is False
    assert len(errors) > 0

    candidate_obj = parse_candidate(invalid_dict)
    assert candidate_obj is None

    # Test batch streaming generator
    def data_stream():
        yield valid_candidate_dict
        yield invalid_dict

    parsed_items = list(parse_batch(data_stream()))
    assert len(parsed_items) == 2
    assert isinstance(parsed_items[0][0], Candidate)
    assert parsed_items[0][1] is None

    assert parsed_items[1][0] is None
    assert parsed_items[1][1] is not None
