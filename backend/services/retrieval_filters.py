"""Retrieval Filters service.

Removes obviously irrelevant candidates from the fused pool BEFORE the
Ranking Engine assigns final scores. This is a pre-ranking gate, not a
ranking operation.

Filters operate on HybridCandidate objects and are config-driven, meaning
all thresholds are passed at construction time (or via the apply_filters
call) rather than hard-coded.

Implemented Filters:
  - minimum_experience_filter  — drops candidates below a years-experience floor
  - location_filter            — drops candidates whose location is incompatible
  - skill_coverage_filter      — drops candidates whose JD coverage is too low
  - activity_filter            — drops candidates with poor behavioral/availability signals

Design principles:
  - Filters are additive (AND logic) and short-circuiting.
  - The filter chain is ordered from cheapest to most expensive.
  - No ranking signal is computed here.

Used by:
  - candidate_pool_generator.py  (applies filter chain after fusion)
  - hybrid_retrieval_service.py  (optional pre-pool gate)
"""

from typing import Dict, List, Optional
from models.hybrid_candidate import HybridCandidate
from utils.logger import get_logger

logger = get_logger(__name__)


class RetrievalFilters:
    """Collection of lightweight pre-ranking candidate filters."""

    def __init__(
        self,
        min_experience_years: float = 0.0,
        min_coverage_score: float = 0.0,
        min_activity_score: float = 0.0,
        location_whitelist: Optional[List[str]] = None,
    ) -> None:
        """Initializes filter thresholds.

        Args:
            min_experience_years: Minimum required years of experience.
                                  0.0 means no experience filter.
            min_coverage_score:   Minimum required JD skill coverage fraction.
                                  0.0 means no coverage filter.
            min_activity_score:   Minimum behavioral/availability score.
                                  0.0 means no activity filter.
            location_whitelist:   Allowed locations (case-insensitive partial match).
                                  None or empty means no location filter.
        """
        self.min_experience_years = min_experience_years
        self.min_coverage_score = min_coverage_score
        self.min_activity_score = min_activity_score
        self.location_whitelist = [loc.lower() for loc in (location_whitelist or [])]

    # ── Individual Filters ────────────────────────────────────────────────────

    def minimum_experience_filter(
        self,
        candidates: List[HybridCandidate],
        min_years: Optional[float] = None,
        candidate_experience_map: Optional[Dict[str, float]] = None,
    ) -> List[HybridCandidate]:
        """Removes candidates below the minimum years-of-experience threshold.

        Because HybridCandidate does not carry raw candidate data (separation
        of concerns), caller must supply a candidate_experience_map:
            {candidate_id: years_of_experience}

        If no map is provided, all candidates pass this filter.

        Args:
            candidates:               List to filter.
            min_years:                Threshold override (defaults to instance value).
            candidate_experience_map: {candidate_id: years_experience} lookup.

        Returns:
            List[HybridCandidate]: Filtered list.
        """
        threshold = min_years if min_years is not None else self.min_experience_years
        if threshold <= 0.0 or not candidate_experience_map:
            return candidates

        passed = [
            c for c in candidates
            if candidate_experience_map.get(c.candidate_id, 0.0) >= threshold
        ]
        dropped = len(candidates) - len(passed)
        if dropped:
            logger.debug(
                f"experience_filter: dropped {dropped} candidates "
                f"(threshold={threshold:.1f} yrs)."
            )
        return passed

    def location_filter(
        self,
        candidates: List[HybridCandidate],
        location_whitelist: Optional[List[str]] = None,
        candidate_location_map: Optional[Dict[str, str]] = None,
    ) -> List[HybridCandidate]:
        """Removes candidates whose location does not match any allowed location.

        If no whitelist or no location map is provided, all candidates pass.

        Args:
            candidates:             List to filter.
            location_whitelist:     Override whitelist (case-insensitive partial match).
            candidate_location_map: {candidate_id: location_string} lookup.

        Returns:
            List[HybridCandidate]: Filtered list.
        """
        whitelist = location_whitelist or self.location_whitelist
        if not whitelist or not candidate_location_map:
            return candidates

        whitelist_lower = [loc.lower() for loc in whitelist]

        def location_matches(cand_id: str) -> bool:
            loc = candidate_location_map.get(cand_id, "").lower()
            return any(allowed in loc for allowed in whitelist_lower)

        passed = [c for c in candidates if location_matches(c.candidate_id)]
        dropped = len(candidates) - len(passed)
        if dropped:
            logger.debug(
                f"location_filter: dropped {dropped} candidates "
                f"(whitelist={whitelist})."
            )
        return passed

    def skill_coverage_filter(
        self,
        candidates: List[HybridCandidate],
        min_coverage: Optional[float] = None,
    ) -> List[HybridCandidate]:
        """Removes candidates whose JD skill coverage score falls below threshold.

        coverage_score is already computed by the pool generator using the
        JD required skills vs. the candidate's matched_skills.

        Args:
            candidates:   List to filter.
            min_coverage: Threshold override (defaults to instance value).

        Returns:
            List[HybridCandidate]: Filtered list.
        """
        threshold = min_coverage if min_coverage is not None else self.min_coverage_score
        if threshold <= 0.0:
            return candidates

        passed = [c for c in candidates if c.coverage_score >= threshold]
        dropped = len(candidates) - len(passed)
        if dropped:
            logger.debug(
                f"skill_coverage_filter: dropped {dropped} candidates "
                f"(min_coverage={threshold:.2f})."
            )
        return passed

    def activity_filter(
        self,
        candidates: List[HybridCandidate],
        min_activity: Optional[float] = None,
        candidate_activity_map: Optional[Dict[str, float]] = None,
    ) -> List[HybridCandidate]:
        """Removes candidates with poor availability or responsiveness signals.

        Operates on an externally provided activity score map.
        If no map is provided, all candidates pass.

        Args:
            candidates:             List to filter.
            min_activity:           Activity score threshold override.
            candidate_activity_map: {candidate_id: activity_score} lookup.

        Returns:
            List[HybridCandidate]: Filtered list.
        """
        threshold = min_activity if min_activity is not None else self.min_activity_score
        if threshold <= 0.0 or not candidate_activity_map:
            return candidates

        passed = [
            c for c in candidates
            if candidate_activity_map.get(c.candidate_id, 1.0) >= threshold
        ]
        dropped = len(candidates) - len(passed)
        if dropped:
            logger.debug(
                f"activity_filter: dropped {dropped} candidates "
                f"(min_activity={threshold:.2f})."
            )
        return passed

    # ── Filter Chain ──────────────────────────────────────────────────────────

    def apply_filters(
        self,
        candidates: List[HybridCandidate],
        candidate_experience_map: Optional[Dict[str, float]] = None,
        candidate_location_map: Optional[Dict[str, str]] = None,
        candidate_activity_map: Optional[Dict[str, float]] = None,
    ) -> List[HybridCandidate]:
        """Applies all configured filters sequentially (cheapest-first).

        Args:
            candidates:               Pool to filter.
            candidate_experience_map: {id: years_experience}.
            candidate_location_map:   {id: location_string}.
            candidate_activity_map:   {id: activity_score}.

        Returns:
            List[HybridCandidate]: Filtered pool, preserving original order.
        """
        before = len(candidates)
        candidates = self.skill_coverage_filter(candidates)
        candidates = self.minimum_experience_filter(candidates, candidate_experience_map=candidate_experience_map)
        candidates = self.location_filter(candidates, candidate_location_map=candidate_location_map)
        candidates = self.activity_filter(candidates, candidate_activity_map=candidate_activity_map)
        after = len(candidates)
        logger.info(f"RetrievalFilters: {before} → {after} candidates after filter chain.")
        return candidates

    def apply_filter_chain(
        self,
        candidates: List[HybridCandidate],
        filters: Optional[Dict] = None,
        candidate_experience_map: Optional[Dict[str, float]] = None,
        candidate_location_map: Optional[Dict[str, str]] = None,
        candidate_activity_map: Optional[Dict[str, float]] = None,
    ) -> List[HybridCandidate]:
        """Applies a dynamic filter chain driven by a runtime config dict.

        Supported filter keys in `filters`:
          - min_experience   (float)
          - location         (str or List[str])
          - min_coverage     (float)
          - min_activity     (float)

        Args:
            candidates:  Pool to filter.
            filters:     Runtime config dict.
            candidate_experience_map, candidate_location_map,
            candidate_activity_map:  Lookup maps.

        Returns:
            List[HybridCandidate]: Filtered pool.
        """
        if not filters:
            return candidates

        if "min_coverage" in filters:
            candidates = self.skill_coverage_filter(
                candidates, min_coverage=float(filters["min_coverage"])
            )
        if "min_experience" in filters:
            candidates = self.minimum_experience_filter(
                candidates,
                min_years=float(filters["min_experience"]),
                candidate_experience_map=candidate_experience_map,
            )
        if "location" in filters:
            loc = filters["location"]
            whitelist = loc if isinstance(loc, list) else [loc]
            candidates = self.location_filter(
                candidates,
                location_whitelist=whitelist,
                candidate_location_map=candidate_location_map,
            )
        if "min_activity" in filters:
            candidates = self.activity_filter(
                candidates,
                min_activity=float(filters["min_activity"]),
                candidate_activity_map=candidate_activity_map,
            )

        return candidates
