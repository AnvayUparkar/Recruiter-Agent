"""Ranking Strategy service — Phase 13: Final Recruiter Ranking Engine.

Defines alternative ranking paradigms (Balanced, Technical-First, Engagement-First) and maps weight modifications.
"""

from enum import Enum
from typing import Dict
from utils.logger import get_logger

logger = get_logger(__name__)


class RankingStrategyType(str, Enum):
    """Supported candidate ranking strategies."""

    BALANCED = "balanced"
    TECHNICAL_FIRST = "technical_first"
    ENGAGEMENT_FIRST = "engagement_first"


class RankingStrategy:
    """Modifies weights based on chosen recruitment strategies."""

    @staticmethod
    def adjust_weights(
        base_weights: Dict[str, float], strategy: RankingStrategyType
    ) -> Dict[str, float]:
        """Adjusts and normalises weights according to a strategy.

        Args:
            base_weights: Base weight dictionary.
            strategy: Desired ranking strategy.

        Returns:
            Dict[str, float]: Strategy-adapted, normalized weight dictionary.
        """
        adjusted = base_weights.copy()
        logger.info(f"Applying ranking strategy adjustments for: {strategy.value}")

        if strategy == RankingStrategyType.TECHNICAL_FIRST:
            # Shift weight heavily into technical depth and JD alignment
            adjusted["technical"] = base_weights.get("technical", 0.35) * 1.5
            adjusted["matching"] = base_weights.get("matching", 0.15) * 1.3
            adjusted["behavioral"] = base_weights.get("behavioral", 0.15) * 0.5
            adjusted["market"] = base_weights.get("market", 0.03) * 0.5
        elif strategy == RankingStrategyType.ENGAGEMENT_FIRST:
            # Shift weight heavily into active behavioral engagement and market signals
            adjusted["behavioral"] = base_weights.get("behavioral", 0.15) * 2.0
            adjusted["market"] = base_weights.get("market", 0.03) * 2.0
            adjusted["technical"] = base_weights.get("technical", 0.35) * 0.7
            adjusted["matching"] = base_weights.get("matching", 0.15) * 0.7

        # Re-normalise weights to sum to 1.0
        total = sum(adjusted.values())
        if total > 0.0:
            for key in adjusted:
                adjusted[key] = round(adjusted[key] / total, 4)

            # Re-verify and correct sum rounding errors
            diff = round(1.0 - sum(adjusted.values()), 4)
            if diff != 0.0:
                largest_key = max(adjusted, key=adjusted.get)
                adjusted[largest_key] = round(adjusted[largest_key] + diff, 4)

        return adjusted
