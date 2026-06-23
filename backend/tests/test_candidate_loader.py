"""Unit tests for the Candidate Loading and Ingestion Streaming Infrastructure.

Tests loaders, managers, batchers, repositories, and stats monitors.
"""

import gzip
import json
from datetime import date
from pathlib import Path
import pytest

from models import Candidate
from services.file_manager import FileManager
from services.ingestion_stats import IngestionStats
from services.candidate_loader import CandidateLoader
from services.batch_processor import BatchProcessor
from services.candidate_repository import JSONLCandidateRepository
from utils.exceptions import DatasetNotFoundError


@pytest.fixture
def mock_candidate_data() -> list[dict]:
    """Returns standard candidate profiles for ingestion tests."""
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
def temp_jsonl_file(tmp_path: Path, mock_candidate_data: list[dict]) -> Path:
    """Fixture writing mock profiles into a temporary .jsonl file."""
    file_path = tmp_path / "test_candidates.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        for entry in mock_candidate_data:
            f.write(json.dumps(entry) + "\n")
    return file_path


@pytest.fixture
def temp_gzipped_file(tmp_path: Path, mock_candidate_data: list[dict]) -> Path:
    """Fixture writing mock profiles into a temporary .jsonl.gz file."""
    file_path = tmp_path / "test_candidates.jsonl.gz"
    with gzip.open(file_path, "wt", encoding="utf-8") as f:
        for entry in mock_candidate_data:
            f.write(json.dumps(entry) + "\n")
    return file_path


def test_file_manager_operations(temp_jsonl_file: Path, tmp_path: Path):
    """Tests FileManager file verification, sizes, and lines counts."""
    fm = FileManager(data_dir=tmp_path)
    assert fm.file_exists(temp_jsonl_file) is True
    assert fm.get_file_size(temp_jsonl_file) > 0
    assert fm.count_lines(temp_jsonl_file) == 2

    # Verify exception on missing file
    missing_file = tmp_path / "missing.jsonl"
    with pytest.raises(DatasetNotFoundError):
        fm.get_file_size(missing_file)

    with pytest.raises(DatasetNotFoundError):
        fm.count_lines(missing_file)


def test_file_manager_gzip(temp_gzipped_file: Path):
    """Tests FileManager count_lines on compressed gz files."""
    fm = FileManager()
    assert fm.file_exists(temp_gzipped_file) is True
    assert fm.count_lines(temp_gzipped_file) == 2


def test_candidate_loader_streaming(temp_jsonl_file: Path):
    """Tests loader iterate_raw_records and iterate_candidates checks."""
    loader = CandidateLoader()
    results = list(loader.iterate_candidates(temp_jsonl_file))

    assert len(results) == 2
    assert results[0].success is True
    assert results[0].candidate.candidate_id == "CAND_0000001"
    assert results[1].success is True
    assert results[1].candidate.candidate_id == "CAND_0000002"


def test_candidate_loader_malformed_handling(tmp_path: Path):
    """Tests loader recovery when encountering corrupted JSON and invalid schemas."""
    file_path = tmp_path / "corrupted.jsonl"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("{invalid_json_here}\n")  # Row 1: malformed
        f.write('{"candidate_id": "CAND_INVALID", "profile": {}}\n')  # Row 2: invalid schema

    loader = CandidateLoader()
    results = list(loader.iterate_candidates(file_path))

    assert len(results) == 2
    assert results[0].success is False
    assert results[0].error_message == "Malformed JSON"

    assert results[1].success is False
    assert results[1].error_message == "Schema validation failed"


def test_candidate_loader_gzip_streaming(temp_gzipped_file: Path):
    """Tests CandidateLoader streaming on compressed gzip files."""
    loader = CandidateLoader()
    results = list(loader.iterate_candidates(temp_gzipped_file))
    assert len(results) == 2
    assert results[0].candidate.candidate_id == "CAND_0000001"


def test_candidate_loader_lookups(temp_jsonl_file: Path):
    """Tests load_candidate search by ID and load_batch batch creation."""
    loader = CandidateLoader()
    c1 = loader.get_candidate_by_id("CAND_0000001", temp_jsonl_file)
    assert c1 is not None
    assert c1.candidate_id == "CAND_0000001"
    assert c1.profile.anonymized_name == "Alice Smith"

    # Search non-existent
    c_none = loader.get_candidate_by_id("CAND_9999999", temp_jsonl_file)
    assert c_none is None

    # Load batch check
    batch = loader.load_batch(temp_jsonl_file, batch_size=1)
    assert len(batch) == 1
    assert batch[0].candidate_id == "CAND_0000001"


def test_batch_processor_grouping(temp_jsonl_file: Path):
    """Tests splitting candidate and record streams into sub-lists."""
    loader = CandidateLoader()
    candidates = list(loader.yield_valid_candidates(temp_jsonl_file))

    processor = BatchProcessor()
    batches = list(processor.batch_candidates(candidates, batch_size=1))
    assert len(batches) == 2
    assert len(batches[0]) == 1
    assert batches[0][0].candidate_id == "CAND_0000001"
    assert batches[1][0].candidate_id == "CAND_0000002"


def test_ingestion_stats_reporting():
    """Tests statistical timing metrics, counts, and report structure."""
    stats = IngestionStats()
    stats.start_timer()
    stats.record_success()
    stats.record_success()
    stats.record_failure(is_skipped=False)
    stats.record_failure(is_skipped=True)
    stats.finish_timer()

    report = stats.generate_report()
    assert report["total_records"] == 4
    assert report["valid_records"] == 2
    assert report["invalid_records"] == 1
    assert report["skipped_records"] == 1
    assert report["processing_time_seconds"] >= 0.0
    assert report["average_speed_records_per_second"] >= 0.0
    assert report["peak_memory_mb"] >= 0.0


def test_jsonl_candidate_repository(temp_jsonl_file: Path):
    """Tests JSONLCandidateRepository lookup, single-pass and filters."""
    repo = JSONLCandidateRepository(temp_jsonl_file)

    # find_by_id
    c1 = repo.find_by_id("CAND_0000001")
    assert c1 is not None
    assert c1.candidate_id == "CAND_0000001"

    # find_many single-pass search
    candidates = repo.find_many(["CAND_0000001", "CAND_0000002"])
    assert len(candidates) == 2

    # search_by_title filter
    ml_devs = list(repo.search_by_title("ML Engineer"))
    assert len(ml_devs) == 1
    assert ml_devs[0].candidate_id == "CAND_0000002"

    # search_by_skill filter
    python_devs = list(repo.search_by_skill("Python"))
    assert len(python_devs) == 1
    assert python_devs[0].candidate_id == "CAND_0000001"

    # get_statistics
    stats = repo.get_statistics()
    assert stats["storage_type"] == "JSONL"
    assert stats["total_candidate_records"] == 2


@pytest.fixture
def temp_json_file(tmp_path: Path, mock_candidate_data: list[dict]) -> Path:
    """Fixture writing mock profiles into a temporary .json file as a JSON array."""
    file_path = tmp_path / "test_candidates.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(mock_candidate_data, f)
    return file_path


def test_candidate_loader_json_streaming(temp_json_file: Path):
    """Tests loader iterate_candidates works with JSON arrays."""
    loader = CandidateLoader()
    results = list(loader.iterate_candidates(temp_json_file))

    assert len(results) == 2
    assert results[0].success is True
    assert results[0].candidate.candidate_id == "CAND_0000001"
    assert results[1].success is True
    assert results[1].candidate.candidate_id == "CAND_0000002"


def test_candidate_loader_json_lookups(temp_json_file: Path):
    """Tests load_candidate search by ID and load_batch batch creation for JSON arrays."""
    loader = CandidateLoader()
    c1 = loader.get_candidate_by_id("CAND_0000001", temp_json_file)
    assert c1 is not None
    assert c1.candidate_id == "CAND_0000001"

    # Search non-existent
    c_none = loader.get_candidate_by_id("CAND_9999999", temp_json_file)
    assert c_none is None

    # Load batch check
    batch = loader.load_batch(temp_json_file, batch_size=1)
    assert len(batch) == 1
    assert batch[0].candidate_id == "CAND_0000001"


def test_json_candidate_repository_with_json_file(temp_json_file: Path):
    """Tests JSONLCandidateRepository lookup and statistics with JSON files."""
    repo = JSONLCandidateRepository(temp_json_file)

    # find_by_id
    c1 = repo.find_by_id("CAND_0000001")
    assert c1 is not None
    assert c1.candidate_id == "CAND_0000001"

    # find_many single-pass search
    candidates = repo.find_many(["CAND_0000001", "CAND_0000002"])
    assert len(candidates) == 2

    # get_statistics
    stats = repo.get_statistics()
    assert stats["storage_type"] == "JSON"
    assert stats["total_candidate_records"] == 2
