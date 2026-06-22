"""Unit Tests for Submission Service.

Tests CSV file generation, formatting, duplicate checks, rank sorting, and SHA256 integrity.
"""

import csv
import pytest
from pathlib import Path
from services.submission_service import SubmissionService
from test_dashboard import _make_mock_ranked_candidate



def test_submission_service_valid_flow(tmp_path: Path):
    """Verifies that a well-formed ranked list exports and validates successfully."""
    # 1. Setup mock ranked candidates (sorted descending)
    rc1 = _make_mock_ranked_candidate("CAND_0000001", 0.95)
    rc2 = _make_mock_ranked_candidate("CAND_0000002", 0.82)
    # Correct ranking positions
    rc1.rank = 1
    rc2.rank = 2

    candidates = [rc1, rc2]

    # 2. Generate submission CSV
    result = SubmissionService.generate_submission(candidates, tmp_path)

    # 3. Check result properties
    assert result.candidate_count == 2
    assert "VALIDATED" in result.validation_status
    assert result.checksum is not None
    assert Path(result.file_path).exists()

    # 4. Verify CSV content structure
    with open(Path(result.file_path), mode="r", newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        assert header == ["candidate_id", "rank", "final_score", "confidence", "explanation"]

        row1 = next(reader)
        assert row1[0] == "CAND_0000001"
        assert row1[1] == "1"
        assert row1[2] == "0.9500"

        row2 = next(reader)
        assert row2[0] == "CAND_0000002"
        assert row2[1] == "2"
        assert row2[2] == "0.8200"


def test_submission_validation_duplicate_candidate_id(tmp_path: Path):
    """Verifies that duplicate candidate IDs are detected and fail validation."""
    rc1 = _make_mock_ranked_candidate("CAND_0000001", 0.95)
    rc2 = _make_mock_ranked_candidate("CAND_0000001", 0.82)  # Duplicate ID
    rc1.rank = 1
    rc2.rank = 2

    candidates = [rc1, rc2]
    result = SubmissionService.generate_submission(candidates, tmp_path)

    assert "INVALID" in result.validation_status
    assert "duplicate candidate_id" in result.validation_status


def test_submission_validation_out_of_order_ranks(tmp_path: Path):
    """Verifies that non-sequential rank indices fail validation checks."""
    rc1 = _make_mock_ranked_candidate("CAND_0000001", 0.95)
    rc2 = _make_mock_ranked_candidate("CAND_0000002", 0.82)
    rc1.rank = 1
    rc2.rank = 3  # Gap in ranks (expected 2)

    candidates = [rc1, rc2]
    result = SubmissionService.generate_submission(candidates, tmp_path)

    assert "INVALID" in result.validation_status
    assert "expected position" in result.validation_status
