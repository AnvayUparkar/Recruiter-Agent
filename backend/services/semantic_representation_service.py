"""Semantic Representation orchestration service.

Top-level service coordinating candidate and JD text compilation,
caching, validation, and semantic comparisons.
"""

from typing import Iterable, Iterator, List, Optional
from models.candidate_profile import CandidateProfile
from models.parsed_jd import ParsedJD
from models.embedding_record import EmbeddingRecord
from models.semantic_match import SemanticMatch
from services.embedding_service import EmbeddingService
from services.similarity_engine import SimilarityEngine
from utils.logger import get_logger

logger = get_logger(__name__)


class SemanticRepresentationService:
    """Orchestrates candidate and JD representations and similarity matchups."""

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        similarity_engine: Optional[SimilarityEngine] = None,
    ):
        """Initializes the SemanticRepresentationService.

        Args:
            embedding_service: EmbeddingService orchestrator instance.
            similarity_engine: SimilarityEngine distance calculator instance.
        """
        self.embedding_service = embedding_service or EmbeddingService()
        self.similarity_engine = similarity_engine or SimilarityEngine()

    def build_candidate_representation(
        self,
        candidate_profile: CandidateProfile,
        model_name: str = "BAAI/bge-large-en-v1.5",
        force_refresh: bool = False,
    ) -> EmbeddingRecord:
        """Processes candidate profile into a cached/validated EmbeddingRecord.

        Args:
            candidate_profile: Profile from intelligence engine.
            model_name: Model identifier.
            force_refresh: Skip cache lookups.

        Returns:
            EmbeddingRecord: Saved vector representation.
        """
        return self.embedding_service.embed_candidate(
            candidate_profile, model_name, force_refresh
        )

    def build_jd_representation(
        self,
        parsed_jd: ParsedJD,
        model_name: str = "BAAI/bge-large-en-v1.5",
        force_refresh: bool = False,
    ) -> EmbeddingRecord:
        """Processes job description into a cached/validated EmbeddingRecord.

        Args:
            parsed_jd: Parsed job description requirements.
            model_name: Model identifier.
            force_refresh: Skip cache lookups.

        Returns:
            EmbeddingRecord: Saved vector representation.
        """
        return self.embedding_service.embed_jd(
            parsed_jd, model_name, force_refresh
        )

    def build_batch_representations(
        self,
        profiles: List[CandidateProfile],
        model_name: str = "BAAI/bge-large-en-v1.5",
        batch_size: int = 32,
        force_refresh: bool = False,
    ) -> List[EmbeddingRecord]:
        """Calculates embedding records for a batch of candidate profiles.

        Args:
            profiles: List of CandidateProfiles.
            model_name: Model identifier.
            batch_size: Batch inference chunk size.
            force_refresh: Skip cache lookups.

        Returns:
            List[EmbeddingRecord]: List of generated records.
        """
        return self.embedding_service.embed_batch(
            profiles, model_name, batch_size, force_refresh
        )

    def build_representation_stream(
        self,
        profiles: Iterable[CandidateProfile],
        model_name: str = "BAAI/bge-large-en-v1.5",
        batch_size: int = 32,
        force_refresh: bool = False,
    ) -> Iterator[EmbeddingRecord]:
        """Streams candidate profiles and yields embedding records in memory-safe chunks.

        Args:
            profiles: Iterable stream of profiles.
            model_name: Model identifier.
            batch_size: Chunks allocation size.
            force_refresh: Skip cache lookups.

        Yields:
            EmbeddingRecord: Vector records.
        """
        chunk = []
        for profile in profiles:
            chunk.append(profile)
            if len(chunk) >= batch_size:
                records = self.build_batch_representations(
                    chunk, model_name, batch_size, force_refresh
                )
                for record in records:
                    yield record
                chunk = []

        if chunk:
            records = self.build_batch_representations(
                chunk, model_name, batch_size, force_refresh
            )
            for record in records:
                yield record

    def compare_candidate_to_jd(
        self,
        candidate_profile: CandidateProfile,
        parsed_jd: ParsedJD,
        model_name: str = "BAAI/bge-large-en-v1.5",
        force_refresh: bool = False,
    ) -> SemanticMatch:
        """Performs full comparison pipeline for a single candidate profile against a JD.

        Args:
            candidate_profile: Candidate intelligence profile.
            parsed_jd: Parsed job description requirements.
            model_name: Model identifier.
            force_refresh: Skip cache check.

        Returns:
            SemanticMatch: Score metrics and structural alignment indicators.
        """
        cand_record = self.build_candidate_representation(
            candidate_profile, model_name, force_refresh
        )
        jd_record = self.build_jd_representation(
            parsed_jd, model_name, force_refresh
        )

        return self.similarity_engine.semantic_match(
            candidate_record=cand_record,
            jd_record=jd_record,
            candidate_profile=candidate_profile,
            parsed_jd=parsed_jd,
        )

    def get_top_matches(
        self,
        parsed_jd: ParsedJD,
        candidate_profiles: List[CandidateProfile],
        model_name: str = "BAAI/bge-large-en-v1.5",
        top_n: int = 10,
        force_refresh: bool = False,
    ) -> List[SemanticMatch]:
        """Matches candidate profiles against a JD in batch and returns the sorted top N list.

        Args:
            parsed_jd: Parsed job description requirements.
            candidate_profiles: List of candidate profiles.
            model_name: Model identifier.
            top_n: Number of matches to return.
            force_refresh: Skip cache checks.

        Returns:
            List[SemanticMatch]: Top N matched records sorted by similarity descending.
        """
        jd_record = self.build_jd_representation(parsed_jd, model_name, force_refresh)
        candidate_records = self.build_batch_representations(
            candidate_profiles, model_name, batch_size=32, force_refresh=force_refresh
        )

        return self.similarity_engine.top_matches(
            jd_record=jd_record,
            candidate_records=candidate_records,
            top_n=top_n,
            candidate_profiles=candidate_profiles,
            parsed_jd=parsed_jd,
        )
