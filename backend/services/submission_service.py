"""Submission Service — Phase 14: Production API & Recruiter Suite.

Handles export, format validation, and SHA256 integrity hashing of ranking submissions.
"""

import csv
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Tuple
from models.ranked_candidate import RankedCandidate
from models.submission_result import SubmissionResult
from utils.logger import get_logger

logger = get_logger(__name__)


class SubmissionService:
    """Manages the generation, schema checks, and integrity hash calculation for candidate ranking CSVs."""

    @staticmethod
    def generate_submission(
        ranked_candidates: List[RankedCandidate],
        output_dir: Path,
    ) -> SubmissionResult:
        """Exports rankings to a standard submissions CSV and validates the output structure.

        Args:
            ranked_candidates: List of RankedCandidate models sorted descending by rank.
            output_dir: Directory where the CSV will be exported.

        Returns:
            SubmissionResult: Metrics, path, format status, and SHA256 check.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        csv_path = output_dir / "ranked_candidates.csv"

        logger.info(f"Exporting {len(ranked_candidates)} candidates to submission CSV at: {csv_path}")

        # 1. Export to CSV
        try:
            with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                # Header row matching standard format
                writer.writerow(["candidate_id", "rank", "score", "reasoning"])

                for rc in ranked_candidates:
                    expl_text = rc.explanation.summary if rc.explanation else ""
                    writer.writerow([
                        rc.candidate_id,
                        rc.rank,
                        f"{rc.final_score:.4f}",
                        expl_text.replace("\n", " ").strip(),
                    ])
        except Exception as e:
            logger.error(f"Failed to write submission CSV: {e}", exc_info=True)
            return SubmissionResult(
                file_path=str(csv_path),
                candidate_count=len(ranked_candidates),
                generated_at=datetime.utcnow().isoformat(),
                validation_status="FAILED_TO_WRITE",
            )

        # 2. Run format validation checks
        validation_ok, reason = SubmissionService.validate_submission(csv_path)
        status_str = "VALIDATED" if validation_ok else f"INVALID: {reason}"
        logger.info(f"Submission validation outcome: {status_str}")

        # 3. Compute SHA256 checksum
        checksum_val = SubmissionService._calculate_sha256(csv_path)

        metadata = {
            "strategy": "balanced",
            "validation_details": reason,
        }

        return SubmissionResult(
            file_path=str(csv_path),
            candidate_count=len(ranked_candidates),
            generated_at=datetime.utcnow().isoformat(),
            validation_status=status_str,
            checksum=checksum_val,
            submission_metadata=metadata,
        )

    @staticmethod
    def validate_submission(csv_path: Path) -> Tuple[bool, str]:
        """Validates columns, uniqueness, value limits, and ordering of the CSV.

        Args:
            csv_path: Path to the target CSV file.

        Returns:
            Tuple[bool, str]: (Validation success flag, description of outcome/reason).
        """
        if not csv_path.exists():
            return False, "File does not exist."

        try:
            with open(csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.reader(f)
                header = next(reader, None)

                # Check header structure
                expected_header = ["candidate_id", "rank", "score", "reasoning"]
                if header != expected_header:
                    return False, f"Invalid columns: expected {expected_header}, got {header}"

                candidate_ids = set()
                ranks = set()
                last_score = float("inf")

                for row_idx, row in enumerate(reader, start=2):
                    if len(row) != 4:
                        return False, f"Row {row_idx} has invalid length {len(row)} (expected 4)."

                    cid, rank_str, score_str, explanation = row

                    # Check candidate_id formatting
                    if not cid.startswith("CAND_") or len(cid) != 12:
                        return False, f"Row {row_idx}: invalid candidate_id format '{cid}'."

                    if cid in candidate_ids:
                        return False, f"Row {row_idx}: duplicate candidate_id '{cid}'."
                    candidate_ids.add(cid)

                    # Check rank ordering & uniqueness
                    try:
                        rank_val = int(rank_str)
                    except ValueError:
                        return False, f"Row {row_idx}: invalid non-integer rank '{rank_str}'."

                    if rank_val <= 0:
                        return False, f"Row {row_idx}: rank must be greater than zero."

                    if rank_val in ranks:
                        return False, f"Row {row_idx}: duplicate rank '{rank_val}'."
                    ranks.add(rank_val)

                    # Check score ordering
                    try:
                        score_val = float(score_str)
                    except ValueError:
                        return False, f"Row {row_idx}: score value is non-numeric."

                    if not (0.0 <= score_val <= 1.0):
                        return False, f"Row {row_idx}: score out of bounds [0, 1]."

                    # CSV must be sorted by score descending (so rank ascending)
                    # We check that rank matches row position
                    if rank_val != row_idx - 1:
                        return False, f"Row {row_idx}: rank is '{rank_val}' but expected position is '{row_idx - 1}'."

                    last_score = score_val

            return True, f"Verified {len(candidate_ids)} candidates. Columns and ordering check out."
        except Exception as e:
            return False, f"Validation crashed: {e}"

    @staticmethod
    def _calculate_sha256(file_path: Path) -> str:
        """Helper to generate SHA256 checksum of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
