"""FAISS Index Manager singleton service.

Orchestrates loading, saving, creating, rebuilding, and automatic recovery
of active FAISS index instances.
"""

import os
import json
import threading
from pathlib import Path
from typing import Dict, List, Optional
import faiss
from models.vector_index_metadata import VectorIndexMetadata
from services.vector_serializer import VectorSerializer
from services.vector_store import VectorStore
from services.index_builder import IndexBuilder
from utils.logger import get_logger

logger = get_logger(__name__)


class FaissIndexManager:
    """Singleton Manager controlling loaded FAISS indexes and mapping states."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(FaissIndexManager, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, data_dir: Optional[Path] = None):
        """Initializes directories and variables if not previously initialized."""
        if self._initialized:
            return

        if data_dir is None:
            # Set default path relative to backend directory
            base_dir = Path(__file__).resolve().parent.parent
            self.data_dir = base_dir / "data" / "indexes"
        else:
            self.data_dir = Path(data_dir)

        # File paths configurations
        self.index_path = self.data_dir / "faiss.index"
        self.mapping_path = self.data_dir / "vector_mapping.pkl"
        self.metadata_path = self.data_dir / "metadata.json"

        os.makedirs(self.data_dir, exist_ok=True)

        self._index: Optional[faiss.Index] = None
        self.vector_store = VectorStore()
        self.index_builder = IndexBuilder()
        self.serializer = VectorSerializer()
        self.lock = threading.RLock()

        # Configuration defaults
        self.index_type = "IndexHNSWFlat"
        self.dimension = 1024
        self.model_name = "BAAI/bge-large-en-v1.5"

        self._initialized = True

    def get_index(self) -> faiss.Index:
        """Retrieves the active loaded FAISS index. Loads from disk if not present in memory.

        Returns:
            faiss.Index: Loaded FAISS index wrapper.
        """
        if self._index is None:
            with self.lock:
                if self._index is None:
                    try:
                        self.load_index()
                    except Exception as e:
                        logger.error(f"Failed loading FAISS index: {e}. Attempting recovery...")
                        success = self.recover_index()
                        if not success:
                            # Re-initialize an empty index if recovery fails
                            logger.warning("Recovery failed. Creating empty default index.")
                            self.create_index(self.index_type, self.dimension)
        return self._index

    def create_index(
        self, index_type: str = "IndexHNSWFlat", dimension: int = 1024, force_recreate: bool = False
    ) -> None:
        """Constructs an empty active index.

        Args:
            index_type: FAISS layout string.
            dimension: Dimensionality.
            force_recreate: Clear current mapping and delete files.
        """
        with self.lock:
            if self._index is not None and not force_recreate:
                return

            self.index_type = index_type
            self.dimension = dimension
            self._index = self.index_builder.build_index(index_type, dimension)
            if force_recreate:
                self.vector_store.clear()
            logger.info(f"Created empty active {index_type} (dim={dimension}).")

    def save_index(self) -> None:
        """Serializes current index binary and mapping dictionaries to disk files."""
        if self._index is None:
            logger.warning("Attempted to save uninitialized active index.")
            return

        with self.lock:
            try:
                # 1. Serialise FAISS binary
                self.serializer.save_index(self._index, self.index_path)

                # 2. Serialise mappings
                mappings_dict = self.vector_store.get_mappings()
                self.serializer.save_mapping(mappings_dict, self.mapping_path)

                # 3. Save JSON Metadata file
                info = VectorIndexMetadata(
                    index_name="faiss.index",
                    index_type=self.index_type,
                    embedding_dimension=self.dimension,
                    candidate_count=self.vector_store.count_vectors(),
                    model_name=self.model_name,
                    faiss_version=faiss.__version__,
                    storage_size_mb=round(os.path.getsize(self.index_path) / (1024 * 1024), 2)
                    if self.index_path.exists() else 0.0,
                )
                self.serializer.save_metadata(info.model_dump(), self.metadata_path)
                logger.info("Successfully serialized index status and mapping metrics.")
            except Exception as e:
                logger.error(f"Failed serialization: {e}")
                raise

    def load_index(self) -> None:
        """Loads index state files from disk into memory."""
        if not self.index_path.exists() or not self.mapping_path.exists() or not self.metadata_path.exists():
            raise FileNotFoundError("Disk index state files are missing.")

        # 1. Load mappings
        mapping_dict = self.serializer.load_mapping(self.mapping_path)
        self.vector_store.load_mappings(mapping_dict)

        # 2. Load Metadata
        meta_dict = self.serializer.load_metadata(self.metadata_path)
        self.index_type = meta_dict.get("index_type", "IndexHNSWFlat")
        self.dimension = meta_dict.get("embedding_dimension", 1024)
        self.model_name = meta_dict.get("model_name", "BAAI/bge-large-en-v1.5")

        # 3. Load FAISS Binary
        self._index = self.serializer.load_index(self.index_path)
        logger.info(f"Loaded FAISS index successfully. Count: {self.vector_store.count_vectors()}")

    def rebuild_index(self, vectors: List[List[float]], candidate_ids: List[str], text_hashes: List[str]) -> None:
        """Rebuilds the index from scratch using raw embedding vectors.

        Args:
            vectors: Raw list of float vector arrays.
            candidate_ids: Mapped candidate IDs.
            text_hashes: Associated text hashes.
        """
        if not vectors:
            logger.warning("Empty vector list passed to rebuild_index.")
            return

        with self.lock:
            dimension = len(vectors[0])
            self.dimension = dimension
            self._index = self.index_builder.build_index(self.index_type, dimension)
            self.vector_store.clear()

            ids = []
            for idx, cand_id in enumerate(candidate_ids):
                v_id = self.vector_store.add_vector(cand_id, text_hash=text_hashes[idx])
                ids.append(v_id)

            self.index_builder.populate_index(self._index, vectors, ids)
            self.save_index()

    def delete_index(self) -> None:
        """Wipes the active index state and removes disk files."""
        with self.lock:
            self._index = None
            self.vector_store.clear()

            for path in [self.index_path, self.mapping_path, self.metadata_path]:
                if path.exists():
                    try:
                        path.unlink()
                        logger.debug(f"Removed file: {path}")
                    except OSError as e:
                        logger.error(f"Failed removing file '{path}': {e}")
            logger.info("Cleared all active FAISS index state files.")

    def recover_index(self) -> bool:
        """Attempts to rebuild index automatically from SQLite embedding cache."""
        logger.warning("Triggering automatic index recovery from SQLite cache database...")
        try:
            # Lazy import to avoid circular dependency
            from services.embedding_cache import EmbeddingCache
            cache = EmbeddingCache()

            conn = cache._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT key, embedding, text_hash, metadata FROM embeddings")
            rows = cursor.fetchall()
            conn.close()

            if not rows:
                logger.warning("No cache records available for recovery.")
                return False

            # Filter out job description records (they start with "JD_")
            cand_rows = [r for r in rows if not r["key"].startswith("JD_")]
            if not cand_rows:
                logger.warning("No candidate records found in SQLite database cache.")
                return False

            logger.info(f"Rebuilding index using {len(cand_rows)} candidate records...")
            vectors = []
            ids = []

            self.vector_store.clear()
            for row in cand_rows:
                key = row["key"]
                emb = json.loads(row["embedding"])
                text_hash = row["text_hash"]
                meta = json.loads(row["metadata"])

                v_id = self.vector_store.add_vector(key, text_hash=text_hash, metadata=meta)
                vectors.append(emb)
                ids.append(v_id)

            dimension = len(vectors[0])
            self.dimension = dimension
            self._index = self.index_builder.build_index(self.index_type, dimension)
            self.index_builder.populate_index(self._index, vectors, ids)
            self.save_index()
            return True
        except Exception as e:
            logger.critical(f"Index recovery failed: {e}", exc_info=True)
            return False

    def index_info(self) -> dict:
        """Returns diagnostic details of the active index state."""
        idx = self.get_index()
        return {
            "index_type": self.index_type,
            "dimension": self.dimension,
            "candidate_count": self.vector_store.count_vectors(),
            "is_trained": idx.is_trained if idx else False,
            "ntotal": idx.ntotal if idx else 0,
            "model_name": self.model_name,
        }
