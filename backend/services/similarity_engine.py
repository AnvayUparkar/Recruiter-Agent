"""Similarity Engine service.

Provides NumPy-vectorized cosine similarity and semantic match calculations
to compare candidate and JD embeddings.
"""

from typing import List, Optional
import numpy as np
from models.embedding_record import EmbeddingRecord
from models.semantic_match import SemanticMatch
from models.candidate_profile import CandidateProfile
from models.parsed_jd import ParsedJD
from utils.logger import get_logger

logger = get_logger(__name__)


class SimilarityEngine:
    """Computes cosine distances and generates semantic match explanations."""

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Calculates the cosine similarity score between two float vectors.

        Args:
            v1: First embedding vector.
            v2: Second embedding vector.

        Returns:
            float: Similarity score between -1.0 and 1.0.
        """
        arr1 = np.array(v1, dtype=np.float32)
        arr2 = np.array(v2, dtype=np.float32)

        dot = np.dot(arr1, arr2)
        norm1 = np.linalg.norm(arr1)
        norm2 = np.linalg.norm(arr2)

        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0

        score = float(dot / (norm1 * norm2))
        return float(np.clip(score, -1.0, 1.0))

    @staticmethod
    def batch_similarity(v1: List[float], matrix: List[List[float]]) -> List[float]:
        """Calculates cosine similarity scores between a single vector and a matrix.

        Args:
            v1: Reference query embedding vector.
            matrix: 2D array of candidate vectors.

        Returns:
            List[float]: Match scores mapped in sequence.
        """
        if not matrix:
            return []

        arr1 = np.array(v1, dtype=np.float32)
        arr_matrix = np.array(matrix, dtype=np.float32)

        dot_products = np.dot(arr_matrix, arr1)
        norms_matrix = np.linalg.norm(arr_matrix, axis=1)
        norm_v1 = np.linalg.norm(arr1)

        # Handle division by zero
        norms_matrix[norms_matrix == 0.0] = 1e-9
        if norm_v1 == 0.0:
            return [0.0] * len(matrix)

        similarities = dot_products / (norms_matrix * norm_v1)
        return np.clip(similarities, -1.0, 1.0).astype(float).tolist()

    def semantic_match(
        self,
        candidate_record: EmbeddingRecord,
        jd_record: EmbeddingRecord,
        candidate_profile: Optional[CandidateProfile] = None,
        parsed_jd: Optional[ParsedJD] = None,
    ) -> SemanticMatch:
        """Calculates similarities and derives structured capability alignments.

        Args:
            candidate_record: Stored embedding for candidate.
            jd_record: Stored embedding for job description.
            candidate_profile: Optional CandidateProfile to extract alignment dimensions.
            parsed_jd: Optional ParsedJD to align requirements.

        Returns:
            SemanticMatch: Rich match outcome record.
        """
        score = self.cosine_similarity(candidate_record.embedding, jd_record.embedding)
        confidence = 0.95 if candidate_record.model_name == jd_record.model_name else 0.70

        matching_dims = []
        reasons = []

        # Map candidate profile features to JD expectations to explain match
        if candidate_profile and parsed_jd:
            tech = candidate_profile.technical_profile
            must_names = {r.name.lower() for r in parsed_jd.must_have}
            good_names = {r.name.lower() for r in parsed_jd.good_to_have}

            # Heuristic check for alignment dimensions
            alignments = [
                ("retrieval", tech.retrieval_experience, "retrieval", "search"),
                ("ranking", tech.ranking_experience, "ranking", "ltr"),
                ("vector_database", tech.vector_database_experience, "vector", "milvus", "qdrant", "faiss"),
                ("llm", tech.llm_experience, "llm", "rag", "openai", "gpt"),
                ("python", tech.python_experience, "python", "py"),
                ("distributed_systems", tech.distributed_systems_experience, "distributed", "spark", "kubernetes"),
                ("production_ml", tech.production_ml_experience, "production", "mlops"),
            ]

            for dim_key, exp_score, *keywords in alignments:
                # If candidate has skill AND JD demands matching concepts
                has_experience = exp_score >= 0.5
                jd_demands = any(
                    any(kw in req_name for kw in keywords)
                    for req_name in (must_names | good_names)
                )

                if has_experience and jd_demands:
                    matching_dims.append(dim_key)
                    reasons.append(
                        f"Aligned capability in '{dim_key}' (score: {exp_score:.2f}) matching role requirements."
                    )

        if not reasons:
            reasons.append(f"Semantic match similarity index of {score:.2f} using {candidate_record.model_name}.")

        return SemanticMatch(
            candidate_id=candidate_record.candidate_id,
            similarity_score=round(score, 4),
            confidence=confidence,
            matching_dimensions=matching_dims,
            matching_reasons=reasons,
        )

    def top_matches(
        self,
        jd_record: EmbeddingRecord,
        candidate_records: List[EmbeddingRecord],
        top_n: int = 10,
        candidate_profiles: Optional[List[CandidateProfile]] = None,
        parsed_jd: Optional[ParsedJD] = None,
    ) -> List[SemanticMatch]:
        """Calculates similarity metrics in batch and returns sorted matches.

        Args:
            jd_record: Reference job description embedding.
            candidate_records: List of candidate embedding records.
            top_n: Number of records to return.
            candidate_profiles: Optional list of matching CandidateProfile instances.
            parsed_jd: Optional ParsedJD instance.

        Returns:
            List[SemanticMatch]: Top N matches sorted descending.
        """
        if not candidate_records:
            return []

        matrix = [rec.embedding for rec in candidate_records]
        scores = self.batch_similarity(jd_record.embedding, matrix)

        # Match profiles to candidates mapping for rich explanation details
        profile_map = {}
        if candidate_profiles:
            profile_map = {p.candidate_id: p for p in candidate_profiles}

        matches = []
        for idx, rec in enumerate(candidate_records):
            score = scores[idx]
            cand_profile = profile_map.get(rec.candidate_id)

            match_obj = self.semantic_match(
                candidate_record=rec,
                jd_record=jd_record,
                candidate_profile=cand_profile,
                parsed_jd=parsed_jd,
            )
            # Update score calculated in batch
            match_obj.similarity_score = round(score, 4)
            matches.append(match_obj)

        # Sort matches descending by score
        matches.sort(key=lambda m: m.similarity_score, reverse=True)
        return matches[:top_n]
