"""Embedding Validator service.

Provides validations and repair helpers for embedding vectors
to prevent corrupted vectors (NaNs, dimension mismatch, infs) from propagating.
"""

import math
from typing import List, Tuple
from utils.logger import get_logger

logger = get_logger(__name__)


class EmbeddingValidator:
    """Validates vector dimensionalities and mathematical safety constraints."""

    @staticmethod
    def validate_embedding(
        embedding: List[float], expected_dim: int
    ) -> Tuple[bool, List[str]]:
        """Validates a single embedding vector for conformity.

        Args:
            embedding: The raw vector list.
            expected_dim: Expected dimensionality.

        Returns:
            Tuple[bool, List[str]]: (is_valid, list_of_error_strings)
        """
        errors = []

        # 1. Null or empty check
        if not embedding:
            errors.append("Embedding is empty or null.")
            return False, errors

        # 2. Dimension check
        if len(embedding) != expected_dim:
            errors.append(
                f"Dimension mismatch. Expected {expected_dim}, got {len(embedding)}."
            )

        # 3. Finite element checks (NaN, Inf)
        nan_indices = []
        inf_indices = []
        for idx, val in enumerate(embedding):
            if math.isnan(val):
                nan_indices.append(idx)
            elif math.isinf(val):
                inf_indices.append(idx)

        if nan_indices:
            errors.append(f"Contains NaN value(s) at index/indices: {nan_indices[:10]}...")
        if inf_indices:
            errors.append(f"Contains Infinite value(s) at index/indices: {inf_indices[:10]}...")

        return len(errors) == 0, errors

    @staticmethod
    def validate_batch(
        embeddings: List[List[float]], expected_dim: int
    ) -> List[Tuple[bool, List[str]]]:
        """Validates a batch of vectors.

        Args:
            embeddings: List of vector lists.
            expected_dim: Expected dimensionality.

        Returns:
            List[Tuple[bool, List[str]]]: List of validation outcomes.
        """
        return [
            EmbeddingValidator.validate_embedding(vec, expected_dim)
            for vec in embeddings
        ]

    @staticmethod
    def repair_if_possible(embedding: List[float], expected_dim: int) -> List[float]:
        """Attempts to fix minor anomalies (e.g. padding/truncation, replacing NaNs).

        Args:
            embedding: The raw candidate vector.
            expected_dim: Target dimension size.

        Returns:
            List[float]: The repaired and re-normalized vector.
        """
        if not embedding:
            logger.warning("Attempted to repair an empty embedding. Returning zero vector.")
            return [0.0] * expected_dim

        repaired = list(embedding)

        # 1. Adjust length mismatch
        if len(repaired) < expected_dim:
            logger.warning(f"Embedding too short ({len(repaired)}). Padding with zeros.")
            repaired.extend([0.0] * (expected_dim - len(repaired)))
        elif len(repaired) > expected_dim:
            logger.warning(f"Embedding too long ({len(repaired)}). Truncating.")
            repaired = repaired[:expected_dim]

        # 2. Replace non-finites
        has_anomaly = False
        for idx, val in enumerate(repaired):
            if not math.isfinite(val):
                repaired[idx] = 0.0
                has_anomaly = True

        if has_anomaly:
            logger.warning("Replaced non-finite values (NaN/Inf) with 0.0.")

        # 3. L2 Re-normalization
        square_sum = sum(x**2 for x in repaired)
        magnitude = math.sqrt(square_sum)

        if magnitude > 0:
            repaired = [x / magnitude for x in repaired]
        else:
            # Entirely zero vector after cleaning, set first element to 1.0 to be L2 valid
            repaired[0] = 1.0
            logger.warning("Repaired zero-magnitude vector by setting first element to 1.0.")

        return repaired
