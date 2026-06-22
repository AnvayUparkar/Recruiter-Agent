"""Feature Weight Manager service — Phase 13: Final Recruiter Ranking Engine.

Manages, validates, and normalises weight profiles for ranking dimensions.
"""

from typing import Dict, Optional
from models.parsed_jd import ParsedJD
from utils.logger import get_logger

logger = get_logger(__name__)

DEFAULT_WEIGHTS: Dict[str, float] = {
    "technical": 0.35,
    "career": 0.15,
    "behavioral": 0.15,
    "trust": 0.10,
    "matching": 0.15,
    "retrieval": 0.05,
    "leadership": 0.02,
    "market": 0.03,
}


class FeatureWeightManager:
    """Manages scoring weights for the ranking engine."""

    def __init__(self, default_weights: Optional[Dict[str, float]] = None):
        self.weights = default_weights or DEFAULT_WEIGHTS.copy()
        self._normalize_weights(self.weights)

    def get_weights_for_jd(self, parsed_jd: Optional[ParsedJD] = None) -> Dict[str, float]:
        """Derives weights by combining defaults with JD scoring profile parameters.

        Args:
            parsed_jd: The parsed Job Description model.

        Returns:
            Dict[str, float]: Normalized weight mapping summing to 1.0.
        """
        if not parsed_jd or not parsed_jd.scoring_profile:
            return self.weights.copy()

        jd_profile = parsed_jd.scoring_profile
        logger.info(f"Deriving weights from JD scoring profile: {jd_profile}")

        # Map JD scoring weights to ranking dimensions
        custom_weights = self.weights.copy()

        if "technical_weight" in jd_profile:
            custom_weights["technical"] = jd_profile["technical_weight"]
        if "career_weight" in jd_profile:
            custom_weights["career"] = jd_profile["career_weight"]
        if "behavioral_weight" in jd_profile:
            custom_weights["behavioral"] = jd_profile["behavioral_weight"]

        # Adapt culture and location weights to our trust, matching, and market dimensions
        if "culture_weight" in jd_profile:
            custom_weights["trust"] = jd_profile["culture_weight"] * 0.7
            custom_weights["market"] = jd_profile["culture_weight"] * 0.3
        if "location_weight" in jd_profile:
            custom_weights["matching"] = jd_profile["location_weight"]

        # Normalize to ensure they sum to exactly 1.0
        self._normalize_weights(custom_weights)
        return custom_weights

    def _normalize_weights(self, weights: Dict[str, float]) -> None:
        """Helper to in-place scale weights to sum to exactly 1.0."""
        total = sum(weights.values())
        if total <= 0.0:
            logger.warning("Sum of weights is zero or negative. Falling back to defaults.")
            weights.clear()
            weights.update(DEFAULT_WEIGHTS)
            return

        for key in weights:
            weights[key] = round(weights[key] / total, 4)

        # Handle minor floating-point deviation
        diff = round(1.0 - sum(weights.values()), 4)
        if diff != 0.0:
            # Add difference to the largest weight component
            largest_key = max(weights, key=weights.get)
            weights[largest_key] = round(weights[largest_key] + diff, 4)
