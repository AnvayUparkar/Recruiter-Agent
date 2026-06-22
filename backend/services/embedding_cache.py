"""Embedding Cache service.

Provides SQLite-based persistent storage for generated embeddings
to prevent redundant computational overhead.
"""

import os
import json
import sqlite3
import threading
from pathlib import Path
from typing import Dict, List, Optional
from utils.logger import get_logger

logger = get_logger(__name__)


class EmbeddingCache:
    """Persistent SQLite database cache for candidate and JD embeddings."""

    def __init__(self, db_path: Optional[Path] = None):
        """Initializes the database connection and schema.

        Args:
            db_path: Path to the SQLite DB file. Defaults to 'data/embeddings_cache.db'.
        """
        if db_path is None:
            # Set default path relative to backend directory
            base_dir = Path(__file__).resolve().parent.parent
            self.db_path = base_dir / "data" / "embeddings_cache.db"
        else:
            self.db_path = Path(db_path)

        # Create parent directories
        os.makedirs(self.db_path.parent, exist_ok=True)
        self.lock = threading.Lock()
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Retrieves a thread-safe connection to SQLite."""
        conn = sqlite3.connect(str(self.db_path), timeout=30.0)
        # Return row dictionaries instead of tuples
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Initializes the DB schema if it does not exist."""
        with self.lock:
            conn = self._get_connection()
            try:
                with conn:
                    conn.execute(
                        """
                        CREATE TABLE IF NOT EXISTS embeddings (
                            key TEXT PRIMARY KEY,
                            embedding TEXT NOT NULL,
                            text_hash TEXT NOT NULL,
                            metadata TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                        """
                    )
                    # Index on text_hash for faster queries
                    conn.execute(
                        "CREATE INDEX IF NOT EXISTS idx_text_hash ON embeddings (text_hash)"
                    )
            except sqlite3.Error as e:
                logger.critical(f"Failed initializing SQLite cache database: {e}")
                raise
            finally:
                conn.close()

    def save_embedding(
        self, key: str, embedding: List[float], text_hash: str, metadata: dict
    ) -> None:
        """Saves a generated embedding record into the SQLite cache.

        Args:
            key: Target identifier (candidate_id or JD id).
            embedding: The raw vector list.
            text_hash: Hash of the source text.
            metadata: Associated auditing metadata dictionary.
        """
        with self.lock:
            conn = self._get_connection()
            try:
                embedding_json = json.dumps(embedding)
                metadata_json = json.dumps(metadata)
                with conn:
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO embeddings (key, embedding, text_hash, metadata)
                        VALUES (?, ?, ?, ?)
                        """,
                        (key, embedding_json, text_hash, metadata_json),
                    )
                logger.debug(f"Cached embedding saved for key: '{key}'")
            except sqlite3.Error as e:
                logger.error(f"Failed saving embedding cache for key '{key}': {e}")
            finally:
                conn.close()

    def load_embedding(self, key: str) -> Optional[Dict]:
        """Loads a cached record from the database.

        Args:
            key: Target identifier.

        Returns:
            Optional[Dict]: Dictionary containing key details, or None.
        """
        with self.lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT embedding, text_hash, metadata FROM embeddings WHERE key = ?",
                    (key,),
                )
                row = cursor.fetchone()
                if row:
                    return {
                        "embedding": json.loads(row["embedding"]),
                        "text_hash": row["text_hash"],
                        "metadata": json.loads(row["metadata"]),
                    }
            except sqlite3.Error as e:
                logger.error(f"Failed loading cached embedding for key '{key}': {e}")
            finally:
                conn.close()
        return None

    def exists(self, key: str, text_hash: str) -> bool:
        """Checks if a cached record exists and matches the provided hash.

        Args:
            key: Target identifier.
            text_hash: Hash of the current text version.

        Returns:
            bool: True if cache hit occurs and text remains identical.
        """
        with self.lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT 1 FROM embeddings WHERE key = ? AND text_hash = ?",
                    (key, text_hash),
                )
                return cursor.fetchone() is not None
            except sqlite3.Error as e:
                logger.error(f"Failed checking cache existence for key '{key}': {e}")
            finally:
                conn.close()
        return False

    def invalidate(self, key: str) -> None:
        """Removes a key's record from the cache.

        Args:
            key: Target identifier.
        """
        with self.lock:
            conn = self._get_connection()
            try:
                with conn:
                    conn.execute("DELETE FROM embeddings WHERE key = ?", (key,))
                logger.info(f"Invalidated cache for key: '{key}'")
            except sqlite3.Error as e:
                logger.error(f"Failed invalidating cache for key '{key}': {e}")
            finally:
                conn.close()

    def clear(self) -> None:
        """Wipes the entire cache database."""
        with self.lock:
            conn = self._get_connection()
            try:
                with conn:
                    conn.execute("DELETE FROM embeddings")
                logger.info("Cleared all records from SQLite embedding cache.")
            except sqlite3.Error as e:
                logger.error(f"Failed clearing embedding cache: {e}")
            finally:
                conn.close()
