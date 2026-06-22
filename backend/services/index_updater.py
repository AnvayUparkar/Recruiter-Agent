"""FAISS Index Updater service.

Supports CRUD candidate vector updates (insert, update, delete)
on the active FAISS index without rebuilding it.
"""

from typing import List, Optional
import numpy as np
import faiss
from services.faiss_index_manager import FaissIndexManager
from utils.logger import get_logger

logger = get_logger(__name__)


class IndexUpdater:
    """Manages incremental additions, deletions, and edits within active FAISS index structures."""

    def __init__(self, manager: Optional[FaissIndexManager] = None):
        """Initializes the IndexUpdater.

        Args:
            manager: FaissIndexManager instance.
        """
        self.manager = manager or FaissIndexManager()

    def add_candidate(
        self, candidate_id: str, embedding: List[float], text_hash: str = "", metadata: Optional[dict] = None
    ) -> int:
        """Inserts a new candidate vector into the active index.

        Args:
            candidate_id: Unique candidate identifier.
            embedding: Raw vector list.
            text_hash: Hash of source text.
            metadata: Associated metadata.

        Returns:
            int: The allocated vector_id.
        """
        index = self.manager.get_index()
        store = self.manager.vector_store

        if store.vector_exists(candidate_id):
            logger.info(f"Candidate '{candidate_id}' already indexed. Redirecting to update_candidate.")
            self.update_candidate(candidate_id, embedding, text_hash, metadata)
            return store.get_vector_id(candidate_id)

        # Dimension checks
        if len(embedding) != self.manager.dimension:
            raise ValueError(
                f"Dimension mismatch. Index configured for {self.manager.dimension}, got {len(embedding)}."
            )

        # Allocate ID in mapping
        vector_id = store.add_vector(candidate_id, text_hash=text_hash, metadata=metadata)

        # Insert to FAISS
        np_vector = np.array([embedding], dtype=np.float32)
        faiss.normalize_L2(np_vector)
        np_ids = np.array([vector_id], dtype=np.int64)

        index.add_with_ids(np_vector, np_ids)
        self.manager.save_index()
        logger.info(f"Incrementally added candidate '{candidate_id}' (vector_id={vector_id}) to FAISS index.")
        return vector_id

    def remove_candidate(self, candidate_id: str) -> None:
        """Removes a candidate vector from the active index.

        Args:
            candidate_id: Target candidate identifier.
        """
        index = self.manager.get_index()
        store = self.manager.vector_store

        vector_id = store.get_vector_id(candidate_id)
        if vector_id is None:
            logger.debug(f"Attempted to remove non-existent candidate: '{candidate_id}'")
            return

        # Delete from FAISS index using selector array
        ids_to_remove = np.array([vector_id], dtype=np.int64)
        index.remove_ids(faiss.IDSelectorArray(ids_to_remove))

        # Delete from mapping
        store.remove_vector(candidate_id)
        self.manager.save_index()
        logger.info(f"Incrementally removed candidate '{candidate_id}' (vector_id={vector_id}) from FAISS index.")

    def update_candidate(
        self, candidate_id: str, embedding: List[float], text_hash: str = "", metadata: Optional[dict] = None
    ) -> None:
        """Updates a candidate's vector and metadata by removing and re-inserting.

        Args:
            candidate_id: Target candidate identifier.
            embedding: Updated vector.
            text_hash: Updated text hash.
            metadata: Updated metadata.
        """
        # FAISS does not support direct vector mutation; we must execute remove-then-insert.
        self.remove_candidate(candidate_id)
        self.add_candidate(candidate_id, embedding, text_hash, metadata)
        logger.debug(f"Successfully updated candidate vector details for '{candidate_id}'.")

    def batch_update(self, candidates_data: List[dict]) -> None:
        """Batch inserts or updates multiple candidate vectors efficiently.

        Args:
            candidates_data: List of dicts, each containing:
              {'candidate_id': str, 'embedding': List[float], 'text_hash': str, 'metadata': dict}
        """
        if not candidates_data:
            return

        index = self.manager.get_index()
        store = self.manager.vector_store

        # 1. Clean existing records to prevent duplicates
        for item in candidates_data:
            cand_id = item["candidate_id"]
            if store.vector_exists(cand_id):
                # Remove candidate from FAISS and store
                v_id = store.get_vector_id(cand_id)
                ids_to_remove = np.array([v_id], dtype=np.int64)
                index.remove_ids(faiss.IDSelectorArray(ids_to_remove))
                store.remove_vector(cand_id)

        # 2. Add candidates in batch
        vectors = []
        ids = []
        for item in candidates_data:
            cand_id = item["candidate_id"]
            emb = item["embedding"]
            text_hash = item.get("text_hash", "")
            meta = item.get("metadata", {})

            if len(emb) != self.manager.dimension:
                logger.error(f"Dimension mismatch for batch update candidate '{cand_id}'. Skipped.")
                continue

            v_id = store.add_vector(cand_id, text_hash=text_hash, metadata=meta)
            vectors.append(emb)
            ids.append(v_id)

        if vectors:
            np_vectors = np.array(vectors, dtype=np.float32)
            faiss.normalize_L2(np_vectors)
            np_ids = np.array(ids, dtype=np.int64)

            # IVF / PQ index check for training
            if not index.is_trained:
                index.train(np_vectors)

            index.add_with_ids(np_vectors, np_ids)
            self.manager.save_index()
            logger.info(f"Batch updated {len(ids)} candidates inside active FAISS index.")
