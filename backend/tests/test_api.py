"""Integration and Endpoint Tests for Phase 14 Production APIs.

Verifies correct routing, validation, responses, and metrics.
"""

import json
from pathlib import Path
from unittest.mock import patch
import pytest
from flask import Flask
from flask.testing import FlaskClient

from app import create_app
from models.candidate_pool import CandidatePool
from models.hybrid_candidate import HybridCandidate
from models.retrieval_score import RetrievalScore


def get_test_candidate_data() -> list[dict]:
    """Helper to return candidate dictionary data for test environment database setup."""
    return [
        {
            "candidate_id": "CAND_0000001",
            "profile": {
                "anonymized_name": "Alice Smith",
                "headline": "Lead Backend Dev",
                "summary": "Building Python services at Google.",
                "location": "New York",
                "country": "USA",
                "years_of_experience": 10.0,
                "current_title": "Lead Backend Dev",
                "current_company": "Google",
                "current_company_size": "10001+",
                "current_industry": "Technology",
            },
            "career_history": [
                {
                    "company": "Google",
                    "title": "Lead Backend Dev",
                    "start_date": "2020-01-01",
                    "end_date": None,
                    "duration_months": 77,
                    "is_current": True,
                    "industry": "Technology",
                    "company_size": "10001+",
                    "description": "Designing microservices on AWS using Docker.",
                }
            ],
            "education": [],
            "skills": [
                {
                    "name": "Python",
                    "proficiency": "expert",
                    "endorsements": 80,
                }
            ],
            "certifications": [],
            "languages": [],
            "redrob_signals": {
                "profile_completeness_score": 90.0,
                "signup_date": "2020-01-01",
                "last_active_date": "2026-06-01",
                "open_to_work_flag": True,
                "profile_views_received_30d": 30,
                "applications_submitted_30d": 2,
                "recruiter_response_rate": 1.0,
                "avg_response_time_hours": 1.0,
                "skill_assessment_scores": {},
                "connection_count": 500,
                "endorsements_received": 10,
                "notice_period_days": 30,
                "expected_salary_range_inr_lpa": {"min": 50.0, "max": 60.0},
                "preferred_work_mode": "remote",
                "willing_to_relocate": True,
                "github_activity_score": 90.0,
                "search_appearance_30d": 100,
                "saved_by_recruiters_30d": 20,
                "interview_completion_rate": 1.0,
                "offer_acceptance_rate": 1.0,
                "verified_email": True,
                "verified_phone": True,
                "linkedin_connected": True,
            },
        },
        {
            "candidate_id": "CAND_0000002",
            "profile": {
                "anonymized_name": "Bob Jones",
                "headline": "ML Engineer",
                "summary": "Building classification algorithms.",
                "location": "London",
                "country": "UK",
                "years_of_experience": 3.0,
                "current_title": "ML Engineer",
                "current_company": "Stripe",
                "current_company_size": "1001-5000",
                "current_industry": "Finance",
            },
            "career_history": [
                {
                    "company": "Stripe",
                    "title": "ML Engineer",
                    "start_date": "2023-01-01",
                    "end_date": None,
                    "duration_months": 41,
                    "is_current": True,
                    "industry": "Finance",
                    "company_size": "1001-5000",
                    "description": "Training fraud models.",
                }
            ],
            "education": [],
            "skills": [
                {
                    "name": "PyTorch",
                    "proficiency": "advanced",
                    "endorsements": 34,
                }
            ],
            "certifications": [],
            "languages": [],
            "redrob_signals": {
                "profile_completeness_score": 85.0,
                "signup_date": "2023-01-01",
                "last_active_date": "2026-05-15",
                "open_to_work_flag": False,
                "profile_views_received_30d": 15,
                "applications_submitted_30d": 1,
                "recruiter_response_rate": 0.80,
                "avg_response_time_hours": 3.5,
                "skill_assessment_scores": {},
                "connection_count": 200,
                "endorsements_received": 5,
                "notice_period_days": 60,
                "expected_salary_range_inr_lpa": {"min": 30.0, "max": 40.0},
                "preferred_work_mode": "hybrid",
                "willing_to_relocate": False,
                "github_activity_score": 45.0,
                "search_appearance_30d": 40,
                "saved_by_recruiters_30d": 5,
                "interview_completion_rate": 0.90,
                "offer_acceptance_rate": 0.80,
                "verified_email": True,
                "verified_phone": True,
                "linkedin_connected": False,
            },
        },
    ]


@pytest.fixture
def test_client(tmp_path: Path) -> FlaskClient:
    """Creates a Flask test client with a mock candidates.jsonl database."""
    # 1. Write mock candidates JSONL file
    dataset_file = tmp_path / "test_candidates.jsonl"
    data = get_test_candidate_data()
    with open(dataset_file, "w", encoding="utf-8") as f:
        for entry in data:
            f.write(json.dumps(entry) + "\n")


    # 2. Boot app in testing mode
    app = create_app("testing")
    app.config["DATASET_PATH"] = dataset_file

    with app.test_client() as client:
        yield client


def test_api_health(test_client: FlaskClient):
    """Verifies GET /api/v1/health returns health metadata."""
    response = test_client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert data.get("status") in ("healthy", "degraded")
    assert "candidate_count" in data
    assert data.get("candidate_count") == 2


def test_api_version(test_client: FlaskClient):
    """Verifies GET /api/v1/version returns status and version metadata."""
    response = test_client.get("/api/v1/version")
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert data.get("service") == "candidate-ranking-system"
    assert "version" in data


def test_api_metrics(test_client: FlaskClient):
    """Verifies GET /api/v1/metrics returns system performance metrics."""
    response = test_client.get("/api/v1/metrics")
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "ndcg_at_5" in data
    assert "precision_at_5" in data
    assert "system_latency_avg_ms" in data


def test_api_jd_analyze(test_client: FlaskClient):
    """Verifies POST /api/v1/jd/analyze parses job description strings."""
    payload = {
        "job_description": "We are seeking a Senior Software Engineer with strong experience in Python, SQL, and AWS."
    }
    response = test_client.post("/api/v1/jd/analyze", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "parsed_jd" in data
    assert "requirements" in data
    assert data["parsed_jd"]["job_title"] is not None


def test_api_jd_analyze_validation_error(test_client: FlaskClient):
    """Verifies POST /api/v1/jd/analyze rejects empty or short strings."""
    payload = {"job_description": "Too short"}
    response = test_client.post("/api/v1/jd/analyze", json=payload)
    assert response.status_code == 400

    data = response.get_json()
    assert data is not None
    assert "error" in data


def test_api_retrieve(test_client: FlaskClient):
    """Verifies POST /api/v1/retrieve yields candidates matching JD."""
    payload = {
        "job_description": "Seeking Python Software Developer with Flask experience.",
        "limit": 5
    }
    response = test_client.post("/api/v1/retrieve", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "fused_candidates" in data


@patch("services.hybrid_retrieval_service.HybridRetrievalService.retrieve_candidate_pool")
def test_api_rank(mock_retrieve, test_client: FlaskClient):
    """Verifies POST /api/v1/rank retrieves, scores, and sorts pool."""
    # 1. Setup mock candidate pool matching our database IDs
    mock_pool = CandidatePool(
        query_id="POOL_TEST",
        job_title="Lead Backend Dev",
        candidates=[
            HybridCandidate(
                candidate_id="CAND_0000001",
                retrieval_rank=1,
                coverage_score=0.9,
                retrieval_score=RetrievalScore(final_retrieval_score=0.9, fusion_strategy="rrf")
            ),
            HybridCandidate(
                candidate_id="CAND_0000002",
                retrieval_rank=2,
                coverage_score=0.5,
                retrieval_score=RetrievalScore(final_retrieval_score=0.6, fusion_strategy="rrf")
            )
        ],
        candidate_count=2
    )
    mock_retrieve.return_value = mock_pool

    # 2. Call Rank Endpoint
    payload = {
        "job_description": "We need a Lead Backend Developer with Python experience.",
        "strategy": "balanced",
        "limit": 5
    }
    response = test_client.post("/api/v1/rank", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert data["job_title"] is not None
    assert len(data["ranked_candidates"]) == 2
    assert data["ranked_candidates"][0]["candidate_id"] == "CAND_0000001"
    assert "applied_weights" in data


def test_api_explain(test_client: FlaskClient):
    """Verifies POST /api/v1/explain returns structured fit verdict and details."""
    payload = {
        "candidate_id": "CAND_0000001",
        "job_description": "We are seeking a Senior Developer with expert Python and AWS expertise."
    }
    response = test_client.post("/api/v1/explain", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert data["candidate_id"] == "CAND_0000001"
    assert "fit_verdict" in data
    assert "strengths" in data
    assert "reasoning" in data


def test_api_copilot_report(test_client: FlaskClient):
    """Verifies POST /api/v1/copilot/report generates the recruiter summary and interview focus details."""
    payload = {
        "candidate_id": "CAND_0000001",
        "job_description": "We are seeking a Senior Developer with expert Python and AWS expertise."
    }
    response = test_client.post("/api/v1/copilot/report", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert data["candidate_id"] == "CAND_0000001"
    assert "recruiter_summary" in data
    assert "hire_recommendation" in data
    assert "interview_focus" in data


def test_api_copilot_compare(test_client: FlaskClient):
    """Verifies POST /api/v1/copilot/compare compares two candidates side-by-side."""
    payload = {
        "candidate_id_a": "CAND_0000001",
        "candidate_id_b": "CAND_0000002",
        "job_description": "We are seeking a Senior Developer with expert Python and AWS expertise."
    }
    response = test_client.post("/api/v1/copilot/compare", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "winner" in data
    assert "winner_reason" in data


def test_api_copilot_compare_multi(test_client: FlaskClient):
    """Verifies POST /api/v1/copilot/compare compares multiple candidates side-by-side using list payload."""
    payload = {
        "candidate_ids": ["CAND_0000001", "CAND_0000002"],
        "job_description": "We are seeking a Senior Developer with expert Python and AWS expertise."
    }
    response = test_client.post("/api/v1/copilot/compare", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "winner" in data
    assert "winner_reason" in data
    assert "strength_comparison" in data
    assert "CAND_0000001" in data["strength_comparison"]
    assert "CAND_0000002" in data["strength_comparison"]



def test_api_copilot_decision(test_client: FlaskClient):
    """Verifies POST /api/v1/copilot/decision outputs a submit proposal and risk summary."""
    payload = {
        "candidate_id": "CAND_0000001",
        "job_description": "We are seeking a Senior Developer with expert Python and AWS expertise."
    }
    response = test_client.post("/api/v1/copilot/decision", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "decision" in data
    assert "risk_summary" in data


def test_api_get_candidate(test_client: FlaskClient):
    """Verifies GET /api/v1/candidates/<candidate_id> returns raw candidate profile details."""
    response = test_client.get("/api/v1/candidates/CAND_0000001")
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert data["candidate_id"] == "CAND_0000001"
    assert "profile" in data
    assert "career_history" in data
    assert "skills" in data


@patch("services.hybrid_retrieval_service.HybridRetrievalService.retrieve_candidate_pool")
def test_api_submission_export(mock_retrieve, test_client: FlaskClient):
    """Verifies POST /api/v1/submission/export ranks pool and writes CSV."""
    # 1. Setup mock candidate pool matching our database IDs
    mock_pool = CandidatePool(
        query_id="POOL_TEST",
        job_title="Lead Backend Dev",
        candidates=[
            HybridCandidate(
                candidate_id="CAND_0000001",
                retrieval_rank=1,
                coverage_score=0.9,
                retrieval_score=RetrievalScore(final_retrieval_score=0.9, fusion_strategy="rrf")
            ),
            HybridCandidate(
                candidate_id="CAND_0000002",
                retrieval_rank=2,
                coverage_score=0.5,
                retrieval_score=RetrievalScore(final_retrieval_score=0.6, fusion_strategy="rrf")
            )
        ],
        candidate_count=2
    )
    mock_retrieve.return_value = mock_pool

    payload = {
        "job_description": "We need a Lead Backend Developer with Python experience."
    }
    response = test_client.post("/api/v1/submission/export", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "exportPath" in data
    assert "sha256Hash" in data
    assert data["rowCount"] == 2


def test_api_report_export(test_client: FlaskClient):
    """Verifies POST /api/v1/report/export writes a recruiter dossier in various formats."""
    payload = {
        "candidate_id": "CAND_0000001",
        "format_type": "markdown"
    }
    response = test_client.post("/api/v1/report/export", json=payload)
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert "filePath" in data
    assert "content" in data
    assert data["format"] == "markdown"



