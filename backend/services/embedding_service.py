"""Core Embedding service.

Orchestrates caching, generation, and validation of embeddings for
candidates and job descriptions.
"""

import time
import hashlib
from typing import Dict, List, Optional
from models.candidate_profile import CandidateProfile
from models.parsed_jd import ParsedJD
from models.embedding_metadata import EmbeddingMetadata, EmbeddingSourceType
from models.embedding_record import EmbeddingRecord
from services.embedding_cache import EmbeddingCache
from services.embedding_generator import EmbeddingGenerator
from services.embedding_validator import EmbeddingValidator
from utils.logger import get_logger

logger = get_logger(__name__)


class EmbeddingService:
    """Core service for embedding generation pipeline with cache checks and validations."""

    def __init__(
        self,
        generator: Optional[EmbeddingGenerator] = None,
        cache: Optional[EmbeddingCache] = None,
        validator: Optional[EmbeddingValidator] = None,
    ):
        """Initializes the EmbeddingService.

        Args:
            generator: EmbeddingGenerator utility instance.
            cache: EmbeddingCache persistent instance.
            validator: EmbeddingValidator safety instance.
        """
        self.generator = generator or EmbeddingGenerator()
        self.cache = cache or EmbeddingCache()
        self.validator = validator or EmbeddingValidator()

    def _calculate_hash(self, text: str) -> str:
        """Helper to compute SHA-256 hash of a text block."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def _estimate_token_count(self, text: str, model_name: str) -> int:
        """Counts tokens using model tokenizer if available, or falls back to heuristic."""
        try:
            model_wrapper = self.generator.model_manager.get_model(model_name)
            if hasattr(model_wrapper, "tokenizer") and model_wrapper.tokenizer:
                return len(model_wrapper.tokenizer.encode(text))
        except Exception:
            pass
        # Fallback approximation: 1 word ~ 1.3 tokens
        return int(len(text.split()) * 1.3)

    def embed_candidate(
        self,
        profile: CandidateProfile,
        model_name: str = "BAAI/bge-large-en-v1.5",
        force_refresh: bool = False,
    ) -> EmbeddingRecord:
        """Generates validated embedding for candidate profile, using cache if available.

        Args:
            profile: Candidate intelligence profile.
            model_name: Model name.
            force_refresh: Skip cache check.

        Returns:
            EmbeddingRecord: Output record.
        """
        text = self.generator.build_candidate_embedding_text(profile)
        text_hash = self._calculate_hash(text)
        cand_id = profile.candidate_id

        # 1. Cache Check
        if not force_refresh:
            cached = self.cache.load_embedding(cand_id)
            if cached and cached["text_hash"] == text_hash:
                meta = cached["metadata"]
                # Re-validate model compatibility
                if meta.get("model_name") == model_name:
                    logger.debug(f"Cache hit for candidate embedding '{cand_id}'")
                    return EmbeddingRecord(
                        candidate_id=cand_id,
                        embedding=cached["embedding"],
                        embedding_dimension=len(cached["embedding"]),
                        model_name=model_name,
                        text_hash=text_hash,
                        metadata=EmbeddingMetadata(**meta),
                    )

        # 2. Cache Miss: Generate
        logger.debug(f"Cache miss for candidate embedding '{cand_id}'. Generating...")
        start_time = time.time()
        vector = self.generator.generate_embedding(text, model_name)
        duration = time.time() - start_time

        # 3. Validate and Repair
        info = self.generator.model_manager.model_info(model_name)
        expected_dim = info["dimension"]
        is_valid, errors = self.validator.validate_embedding(vector, expected_dim)

        if not is_valid:
            logger.warning(
                f"Validation warnings for candidate '{cand_id}' vector: {errors}. Attempting repair..."
            )
            vector = self.validator.repair_if_possible(vector, expected_dim)

        # 4. Construct metadata & record
        token_count = self._estimate_token_count(text, model_name)
        metadata = EmbeddingMetadata(
            model_name=model_name,
            embedding_dimension=expected_dim,
            generation_time=duration,
            token_count=token_count,
            source_type=EmbeddingSourceType.SUMMARY,
        )

        record = EmbeddingRecord(
            candidate_id=cand_id,
            embedding=vector,
            embedding_dimension=expected_dim,
            model_name=model_name,
            text_hash=text_hash,
            metadata=metadata,
        )

        # 5. Cache Save
        self.cache.save_embedding(
            cand_id, vector, text_hash, metadata.model_dump()
        )

        return record

    def embed_jd(
        self,
        jd: ParsedJD,
        model_name: str = "BAAI/bge-large-en-v1.5",
        force_refresh: bool = False,
    ) -> EmbeddingRecord:
        """Generates validated embedding for job description, using cache if available.

        Args:
            jd: Parsed job description requirements.
            model_name: Model name.
            force_refresh: Skip cache check.

        Returns:
            EmbeddingRecord: Output record.
        """
        text = self.generator.build_jd_embedding_text(jd)
        text_hash = self._calculate_hash(text)
        jd_id = f"JD_{jd.job_title}_{jd.company_name}".replace(" ", "_")

        # 1. Cache Check
        if not force_refresh:
            cached = self.cache.load_embedding(jd_id)
            if cached and cached["text_hash"] == text_hash:
                meta = cached["metadata"]
                if meta.get("model_name") == model_name:
                    logger.debug(f"Cache hit for JD embedding '{jd_id}'")
                    return EmbeddingRecord(
                        candidate_id=jd_id,
                        embedding=cached["embedding"],
                        embedding_dimension=len(cached["embedding"]),
                        model_name=model_name,
                        text_hash=text_hash,
                        metadata=EmbeddingMetadata(**meta),
                    )

        # 2. Cache Miss: Generate
        logger.debug(f"Cache miss for JD embedding '{jd_id}'. Generating...")
        start_time = time.time()
        vector = self.generator.generate_embedding(text, model_name)
        duration = time.time() - start_time

        # 3. Validate and Repair
        info = self.generator.model_manager.model_info(model_name)
        expected_dim = info["dimension"]
        is_valid, errors = self.validator.validate_embedding(vector, expected_dim)

        if not is_valid:
            logger.warning(
                f"Validation warnings for JD '{jd_id}' vector: {errors}. Attempting repair..."
            )
            vector = self.validator.repair_if_possible(vector, expected_dim)

        # 4. Construct metadata & record
        token_count = self._estimate_token_count(text, model_name)
        metadata = EmbeddingMetadata(
            model_name=model_name,
            embedding_dimension=expected_dim,
            generation_time=duration,
            token_count=token_count,
            source_type=EmbeddingSourceType.JD,
        )

        record = EmbeddingRecord(
            candidate_id=jd_id,
            embedding=vector,
            embedding_dimension=expected_dim,
            model_name=model_name,
            text_hash=text_hash,
            metadata=metadata,
        )

        # 5. Cache Save
        self.cache.save_embedding(
            jd_id, vector, text_hash, metadata.model_dump()
        )

        return record

    def embed_batch(
        self,
        profiles: List[CandidateProfile],
        model_name: str = "BAAI/bge-large-en-v1.5",
        batch_size: int = 32,
        force_refresh: bool = False,
    ) -> List[EmbeddingRecord]:
        """Profiles a batch of candidates, reusing cache entries and batch-encoding misses.

        Args:
            profiles: List of CandidateProfile.
            model_name: Model name.
            batch_size: Batch inference chunk size.
            force_refresh: Skip cache checks.

        Returns:
            List[EmbeddingRecord]: Calculated embedding records in the original order.
        """
        if not profiles:
            return []

        results_map: Dict[str, EmbeddingRecord] = {}
        misses_profiles: List[CandidateProfile] = []
        misses_texts: List[str] = []
        misses_hashes: List[str] = []

        # 1. Identify Hits vs Misses
        for profile in profiles:
            cand_id = profile.candidate_id
            text = self.generator.build_candidate_embedding_text(profile)
            text_hash = self._calculate_hash(text)

            has_hit = False
            if not force_refresh:
                cached = self.cache.load_embedding(cand_id)
                if cached and cached["text_hash"] == text_hash:
                    meta = cached["metadata"]
                    if meta.get("model_name") == model_name:
                        results_map[cand_id] = EmbeddingRecord(
                            candidate_id=cand_id,
                            embedding=cached["embedding"],
                            embedding_dimension=len(cached["embedding"]),
                            model_name=model_name,
                            text_hash=text_hash,
                            metadata=EmbeddingMetadata(**meta),
                        )
                        has_hit = True

            if not has_hit:
                misses_profiles.append(profile)
                misses_texts.append(text)
                misses_hashes.append(text_hash)

        # 2. Batch Process Misses
        if misses_profiles:
            logger.info(f"Cache miss batch size: {len(misses_profiles)} / {len(profiles)}")
            start_time = time.time()
            vectors = self.generator.generate_batch_embeddings(
                misses_texts, model_name, batch_size
            )
            duration_per_vector = (time.time() - start_time) / len(misses_profiles)

            info = self.generator.model_manager.model_info(model_name)
            expected_dim = info["dimension"]

            for idx, profile in enumerate(misses_profiles):
                cand_id = profile.candidate_id
                vector = vectors[idx]
                text = misses_texts[idx]
                text_hash = misses_hashes[idx]

                # Validate
                is_valid, errors = self.validator.validate_embedding(vector, expected_dim)
                if not is_valid:
                    logger.warning(
                        f"Validation warnings for candidate '{cand_id}' vector: {errors}. Attempting repair..."
                    )
                    vector = self.validator.repair_if_possible(vector, expected_dim)

                token_count = self._estimate_token_count(text, model_name)
                metadata = EmbeddingMetadata(
                    model_name=model_name,
                    embedding_dimension=expected_dim,
                    generation_time=duration_per_vector,
                    token_count=token_count,
                    source_type=EmbeddingSourceType.SUMMARY,
                )

                record = EmbeddingRecord(
                    candidate_id=cand_id,
                    embedding=vector,
                    embedding_dimension=expected_dim,
                    model_name=model_name,
                    text_hash=text_hash,
                    metadata=metadata,
                )

                # Save cache
                self.cache.save_embedding(
                    cand_id, vector, text_hash, metadata.model_dump()
                )
                results_map[cand_id] = record

        # 3. Reconstruct ordered list
        ordered_results = [results_map[p.candidate_id] for p in profiles]
        return ordered_results
