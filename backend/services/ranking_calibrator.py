"""Ranking Calibrator service — Phase 13: Final Recruiter Ranking Engine.

Normalises and stretches candidate scores in a pool to prevent compression.
"""

from typing import List
from models.ranking_score import RankingScore
from utils.logger import get_logger

logger = get_logger(__name__)


class RankingCalibrator:
    """Calibrates and normalises scores across a pool of candidates."""

    @staticmethod
    def calibrate_pool(scores: List[RankingScore], target_min: float = 0.20, target_max: float = 0.95) -> None:
        """Applies min-max range stretching on candidate final scores in place.

        Guarantees that candidates are spread across the target_min to target_max range,
        preventing clustering / score compression, while maintaining strict relative order.

        Args:
            scores: List of candidate RankingScore objects.
            target_min: Lowest calibrated score to assign.
            target_max: Highest calibrated score to assign.
        """
        if not scores:
            return

        if len(scores) == 1:
            # For a single candidate, clamp their score close to the top target
            scores[0].final_score = round(max(target_min, min(target_max, scores[0].final_score)), 4)
            return

        current_scores = [s.final_score for s in scores]
        min_val = min(current_scores)
        max_val = max(current_scores)
        span = max_val - min_val

        logger.info(f"Calibrating pool of size {len(scores)}. Raw range: [{min_val:.4f}, {max_val:.4f}]")

        if span < 0.01:
            # If all scores are almost identical, spread them slightly or clamp them
            logger.info("Pool score span is too narrow. Normalising to target range median.")
            for s in scores:
                s.final_score = round((target_min + target_max) / 2.0, 4)
            return

        for s in scores:
            # Perform min-max stretch to [target_min, target_max]
            normalized = (s.final_score - min_val) / span
            calibrated = target_min + normalized * (target_max - target_min)
            s.final_score = round(calibrated, 4)

        logger.info(f"Calibration completed. Stretched range: [{target_min}, {target_max}]")
