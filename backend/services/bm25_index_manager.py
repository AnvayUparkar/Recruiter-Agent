"""BM25 Index Manager singleton service.

Controls memory caching, persistent writing, loading, and self-healing
rebuilds of active BM25 index instances.
"""

import os
import json
import pickle
import threading
from pathlib import Path
from typing import Dict, List, Optional, Set
from rank_bm25 import BM25Okapi
from models.candidate_profile import CandidateProfile
from models.bm25_metadata import Bm25Metadata
from services.bm25_tokenizer import Bm25Tokenizer
from services.bm25_preprocessor import Bm25Preprocessor
from services.bm25_builder import Bm25Builder
from utils.logger import get_logger

logger = get_logger(__name__)


class Bm25IndexManager:
    """Singleton Manager controlling loaded BM25 indexes and document mappings."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(Bm25IndexManager, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, data_dir: Optional[Path] = None):
        """Initializes directories and variables if not previously initialized."""
        if self._initialized:
            return

        if data_dir is None:
            # Set default path relative to backend directory
            base_dir = Path(__file__).resolve().parent.parent
            self.data_dir = base_dir / "data" / "indexes" / "bm25"
        else:
            self.data_dir = Path(data_dir)

        # File paths configurations
        self.index_path = self.data_dir / "bm25.pkl"
        self.corpus_path = self.data_dir / "corpus.pkl"
        self.metadata_path = self.data_dir / "metadata.json"
        self.vocabulary_path = self.data_dir / "vocabulary.pkl"

        os.makedirs(self.data_dir, exist_ok=True)

        self._index: Optional[BM25Okapi] = None
        self.candidate_ids: List[str] = []
        self.documents: List[str] = []
        self.vocabulary: Set[str] = set()

        self.tokenizer = Bm25Tokenizer()
        self.builder = Bm25Builder(tokenizer=self.tokenizer)
        self.lock = threading.RLock()

        self._initialized = True

    def get_index(self) -> BM25Okapi:
        """Retrieves the active loaded BM25 index. Loads from disk if not present in memory.

        Returns:
            BM25Okapi: Loaded index instance.
        """
        if self._index is None:
            with self.lock:
                if self._index is None:
                    try:
                        self.load_index()
                    except Exception as e:
                        logger.error(f"Failed loading BM25 index: {e}. Attempting recovery...")
                        success = self.recover_index()
                        if not success:
                            # Re-initialize an empty index if recovery fails
                            logger.warning("Recovery failed. Creating empty default index.")
                            self.create_index(force_recreate=True)
        return self._index

    def create_index(self, force_recreate: bool = False) -> None:
        """Constructs an empty active index.

        Args:
            force_recreate: Clear current mapping and delete files.
        """
        with self.lock:
            if self._index is not None and not force_recreate:
                return

            self._index = None
            self.candidate_ids = []
            self.documents = []
            self.vocabulary = set()
            logger.info("Created empty active BM25 index.")

    def save_index(self) -> None:
        """Serializes current index binary and mapping structures to disk files."""
        if self._index is None:
            logger.warning("Attempted to save uninitialized active index.")
            return

        with self.lock:
            try:
                # 1. Serialise BM25 index using builder
                self.builder.save_index(self._index, self.index_path)

                # 2. Serialise mappings (candidate_ids and documents)
                corpus_data = {
                    "candidate_ids": self.candidate_ids,
                    "documents": self.documents,
                }
                with open(self.corpus_path, "wb") as f:
                    pickle.dump(corpus_data, f, protocol=pickle.HIGHEST_PROTOCOL)

                # 3. Serialise vocabulary
                with open(self.vocabulary_path, "wb") as f:
                    pickle.dump(self.vocabulary, f, protocol=pickle.HIGHEST_PROTOCOL)

                # 4. Save JSON Metadata file
                avg_doc_len = 0.0
                if self._index.corpus_size > 0:
                    avg_doc_len = float(self._index.avgdl)

                info = Bm25Metadata(
                    index_name="bm25.pkl",
                    algorithm="BM25Okapi",
                    candidate_count=len(self.candidate_ids),
                    token_count=len(self.vocabulary),
                    average_document_length=round(avg_doc_len, 2),
                    storage_size_mb=round(os.path.getsize(self.index_path) / (1024 * 1024), 2)
                    if self.index_path.exists() else 0.0,
                )
                with open(self.metadata_path, "w", encoding="utf-8") as f:
                    json.dump(info.model_dump(), f, indent=4, default=str)

                logger.info("Successfully serialized BM25 index status and corpus metrics.")
            except Exception as e:
                logger.error(f"Failed BM25 index serialization: {e}")
                raise

    def load_index(self) -> None:
        """Loads BM25 index files from disk into memory."""
        if not self.index_path.exists() or not self.corpus_path.exists() or not self.metadata_path.exists():
            raise FileNotFoundError("Disk BM25 index state files are missing.")

        with self.lock:
            # 1. Load mappings
            with open(self.corpus_path, "rb") as f:
                corpus_data = pickle.load(f)
            self.candidate_ids = corpus_data.get("candidate_ids", [])
            self.documents = corpus_data.get("documents", [])

            # 2. Load vocabulary
            if self.vocabulary_path.exists():
                with open(self.vocabulary_path, "rb") as f:
                    self.vocabulary = pickle.load(f)

            # 3. Load BM25 Index
            self._index = self.builder.load_index(self.index_path)
            logger.info(f"Loaded BM25 index successfully. Count: {len(self.candidate_ids)}")

    def rebuild_index(self, candidate_profiles: List[CandidateProfile]) -> None:
        """Rebuilds the BM25 index from scratch using candidate profiles.

        Args:
            candidate_profiles: List of CandidateProfiles.
        """
        if not candidate_profiles:
            logger.warning("Empty candidate list passed to rebuild_index.")
            return

        with self.lock:
            self.candidate_ids = [p.candidate_id for p in candidate_profiles]
            self.documents = [Bm25Preprocessor.build_document(p) for p in candidate_profiles]

            # Rebuild corpus and vocabulary
            tokenized_corpus = self.builder.build_corpus(self.documents)
            vocab = set()
            for doc_tokens in tokenized_corpus:
                vocab.update(doc_tokens)
            self.vocabulary = vocab

            self._index = self.builder.build_index(tokenized_corpus)
            self.save_index()

    def delete_index(self) -> None:
        """Wipes active index state and removes files."""
        with self.lock:
            self._index = None
            self.candidate_ids = []
            self.documents = []
            self.vocabulary = set()

            for path in [self.index_path, self.corpus_path, self.metadata_path, self.vocabulary_path]:
                if path.exists():
                    try:
                        path.unlink()
                        logger.debug(f"Removed file: {path}")
                    except OSError as e:
                        logger.error(f"Failed removing file '{path}': {e}")
            logger.info("Cleared all active BM25 index files.")

    def recover_index(self) -> bool:
        """Attempts to recover the BM25 index by reading cached records from SQLite."""
        logger.warning("Triggering automatic BM25 index recovery from SQLite cache database...")
        try:
            # Lazy import to avoid circular dependency
            from services.embedding_cache import EmbeddingCache
            from models.candidate_profile import CandidateProfile
            cache = EmbeddingCache()

            conn = cache._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT key, metadata FROM embeddings")
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

            logger.info(f"Rebuilding BM25 index using {len(cand_rows)} candidate records...")
            
            # Reconstruct dummy CandidateProfiles from metadata details to rebuild text
            profiles = []
            for row in cand_rows:
                key = row["key"]
                meta = json.loads(row["metadata"])
                
                # Fetch full Candidate object to rebuild profile or mock it from metadata
                # Since we want to rebuild document representations and cache metadata contains
                # years_experience and summary, we can construct a dummy profile
                # that has enough technical info
                # Wait, can we fetch the Candidate from CandidateRepository?
                # Yes, using JSONLCandidateRepository or CandidateLoader if we have the file,
                # but let's build a clean CandidateProfile using metadata if possible
                # Or check if we can query CandidateRepository!
                # Let's search if there is a repository or database we can load from.
                # Yes, we have CandidateRepository or we can read from the dataset file!
                # Wait, let's see: `JSONLCandidateRepository` loads candidates.
                # But since recovery is a fallback, we can construct the profiles using the sqlite cache metadata!
                # Wait! Let's check how the sqlite cache metadata looks. It contains:
                # model_name, embedding_dimension, token_count, source_type, etc.
                # It does NOT contain the full technical profile!
                # To get the full technical profile, we should load candidate records from `JSONLCandidateRepository`!
                # Let's import JSONLCandidateRepository and check if we can query it!
                # Let's check if the default dataset file exists in config or database:
                # In config.py or repositories.
                from services.candidate_repository import JSONLCandidateRepository
                from config import Config
                
                dataset_path = Config.DATASET_PATH if hasattr(Config, "DATASET_PATH") else (
                    Path(__file__).resolve().parent.parent.parent / "[PUB] India_runs_data_and_ai_challenge" / "India_runs_data_and_ai_challenge" / "sample_candidates.json"
                )
                repo = JSONLCandidateRepository(dataset_path)
                
                # Retrieve actual candidate list
                candidates = []
                for row in cand_rows:
                    cand_id = row["key"]
                    c = repo.find_by_id(cand_id)
                    if c:
                        candidates.append(c)
                
                # Profile candidates to build CandidateProfiles
                from services.candidate_profiler import CandidateProfiler
                profiler = CandidateProfiler()
                profiles = [profiler.profile_candidate(c) for c in candidates]
                
            if not profiles:
                logger.warning("No candidate profiles could be loaded from repository. Recovery aborted.")
                return False
                
            self.rebuild_index(profiles)
            return True
        except Exception as e:
            logger.critical(f"BM25 Index recovery failed: {e}", exc_info=True)
            return False

    def index_info(self) -> dict:
        """Returns details of the active BM25 index."""
        idx = self.get_index()
        return {
            "algorithm": "BM25Okapi",
            "candidate_count": len(self.candidate_ids),
            "vocabulary_size": len(self.vocabulary),
            "corpus_size": idx.corpus_size if idx else 0,
        }
