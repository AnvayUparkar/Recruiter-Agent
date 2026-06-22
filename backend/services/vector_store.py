"""Vector Store mapping service.

Maintains bidirectional mappings between string candidate_ids
and integer vector_ids, and caches text hashes and metadata.
"""

from typing import Dict, Optional, Tuple
from utils.logger import get_logger

logger = get_logger(__name__)


class VectorStore:
    """Manages string candidate_id to integer vector_id mapping conversions and metadata."""

    def __init__(self):
        """Initializes empty lookup mappings."""
        self._candidate_to_vector: Dict[str, int] = {}
        self._vector_to_candidate: Dict[int, str] = {}
        self._hashes: Dict[str, str] = {}
        self._metadata: Dict[str, dict] = {}
        self._next_vector_id: int = 0

    def add_vector(
        self, candidate_id: str, vector_id: Optional[int] = None, text_hash: str = "", metadata: Optional[dict] = None
    ) -> int:
        """Adds a candidate mapping entry. Auto-assigns vector_id if not provided.

        Args:
            candidate_id: Unique candidate string.
            vector_id: Pre-assigned integer ID. If None, auto-allocates next ID.
            text_hash: Hash of the profile source text.
            metadata: Associated auditing metadata dictionary.

        Returns:
            int: The assigned vector_id.
        """
        if vector_id is None:
            vector_id = self._next_vector_id
            self._next_vector_id += 1

        self._candidate_to_vector[candidate_id] = vector_id
        self._vector_to_candidate[vector_id] = candidate_id
        self._hashes[candidate_id] = text_hash
        self._metadata[candidate_id] = metadata or {}

        # Adjust next_vector_id sequence boundary
        if vector_id >= self._next_vector_id:
            self._next_vector_id = vector_id + 1

        return vector_id

    def get_vector_id(self, candidate_id: str) -> Optional[int]:
        """Gets the integer vector ID mapped to a candidate string.

        Args:
            candidate_id: Target candidate identifier.
        """
        return self._candidate_to_vector.get(candidate_id)

    def get_candidate_id(self, vector_id: int) -> Optional[str]:
        """Gets the candidate string mapped to an integer vector ID.

        Args:
            vector_id: Target vector index.
        """
        return self._vector_to_candidate.get(vector_id)

    def remove_vector(self, candidate_id: str) -> Optional[int]:
        """Removes a candidate mapping entry by string ID.

        Args:
            candidate_id: Target candidate identifier.

        Returns:
            Optional[int]: The vector_id removed, if existed.
        """
        vector_id = self._candidate_to_vector.pop(candidate_id, None)
        if vector_id is not None:
            self._vector_to_candidate.pop(vector_id, None)
            self._hashes.pop(candidate_id, None)
            self._metadata.pop(candidate_id, None)
            logger.debug(f"Removed vector mapping for candidate '{candidate_id}' (vector_id={vector_id})")
        return vector_id

    def update_vector(
        self, candidate_id: str, new_text_hash: str, metadata: Optional[dict] = None
    ) -> Tuple[int, bool]:
        """Updates or adds candidate text hash and metadata. Retains existing vector ID.

        Args:
            candidate_id: Target candidate identifier.
            new_text_hash: Updated hash of source text.
            metadata: Updated metadata.

        Returns:
            Tuple[int, bool]: (vector_id, is_new_candidate)
        """
        vector_id = self.get_vector_id(candidate_id)
        is_new = False
        if vector_id is None:
            vector_id = self.add_vector(candidate_id, text_hash=new_text_hash, metadata=metadata)
            is_new = True
        else:
            self._hashes[candidate_id] = new_text_hash
            if metadata:
                self._metadata[candidate_id] = metadata
        return vector_id, is_new

    def vector_exists(self, candidate_id: str) -> bool:
        """Checks if a mapping entry exists for the candidate.

        Args:
            candidate_id: Target candidate identifier.
        """
        return candidate_id in self._candidate_to_vector

    def count_vectors(self) -> int:
        """Returns the total number of mapped candidates."""
        return len(self._candidate_to_vector)

    def get_mappings(self) -> dict:
        """Returns the entire internal state structure suitable for serialization."""
        return {
            "candidate_to_vector": self._candidate_to_vector,
            "vector_to_candidate": self._vector_to_candidate,
            "hashes": self._hashes,
            "metadata": self._metadata,
            "next_vector_id": self._next_vector_id,
        }

    def load_mappings(self, state: dict) -> None:
        """Loads and overwrites mappings from serialized dict states.

        Args:
            state: Serialized dictionary state.
        """
        self._candidate_to_vector = state.get("candidate_to_vector", {})
        # Convert keys in vector_to_candidate to integers (json/pickle deserialization support)
        vec_to_cand = state.get("vector_to_candidate", {})
        self._vector_to_candidate = {int(k): v for k, v in vec_to_cand.items()}
        self._hashes = state.get("hashes", {})
        self._metadata = state.get("metadata", {})
        self._next_vector_id = state.get("next_vector_id", len(self._candidate_to_vector))
        logger.info(f"Loaded {len(self._candidate_to_vector)} mappings into VectorStore.")

    def clear(self) -> None:
        """Wipes the mapping entries and resets vector ID counters."""
        self._candidate_to_vector.clear()
        self._vector_to_candidate.clear()
        self._hashes.clear()
        self._metadata.clear()
        self._next_vector_id = 0
        logger.info("Cleared all internal mappings from VectorStore.")
