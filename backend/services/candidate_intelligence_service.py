"""Candidate Intelligence Service orchestrator.

Integrates streaming candidate ingestion with CandidateProfiler to produce structured profiles.
"""

from typing import Iterable, Iterator, List
from models.candidate import Candidate
from models.candidate_profile import CandidateProfile
from services.candidate_profiler import CandidateProfiler
from utils.logger import get_logger

logger = get_logger(__name__)


class CandidateIntelligenceService:
    """Orchestrates candidate profiling pipeline, supporting batching and streaming processing."""

    def __init__(self, profiler: CandidateProfiler = None):
        """Initializes CandidateIntelligenceService.

        Args:
            profiler: CandidateProfiler instance.
        """
        self.profiler = profiler or CandidateProfiler()

    def build_candidate_intelligence(self, candidate: Candidate) -> CandidateProfile:
        """Profiles a single candidate.

        Args:
            candidate: Candidate aggregate.

        Returns:
            CandidateProfile: Resulting intelligence profile.
        """
        return self.profiler.profile_candidate(candidate)

    def build_batch_profiles(self, candidates: List[Candidate]) -> List[CandidateProfile]:
        """Profiles a list of candidates in a batch.

        Args:
            candidates: List of Candidate aggregates.

        Returns:
            List[CandidateProfile]: List of computed profiles.
        """
        return [self.build_candidate_intelligence(c) for c in candidates]

    def profile_stream(self, stream: Iterable[Candidate]) -> Iterator[CandidateProfile]:
        """Streams candidate profiles using a generator to ensure minimal memory overhead.

        Args:
            stream: Iterable of Candidate aggregates.

        Yields:
            CandidateProfile: Next evaluated candidate profile.
        """
        for candidate in stream:
            try:
                yield self.build_candidate_intelligence(candidate)
            except Exception as e:
                candidate_id = getattr(candidate, "candidate_id", "Unknown")
                logger.error(
                    f"Failed profiling candidate {candidate_id}: {e}",
                    exc_info=True
                )
