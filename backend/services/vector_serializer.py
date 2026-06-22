"""Vector Serializer service.

Handles disk reading/writing of FAISS binary indexes, candidate mappings,
and index metadata.
"""

import pickle
import json
import os
from pathlib import Path
from typing import Dict, Optional
import faiss
from utils.logger import get_logger

logger = get_logger(__name__)


class VectorSerializer:
    """Manages serialization and deserialization of FAISS indexes and mapping state."""

    @staticmethod
    def save_index(index: faiss.Index, path: Path) -> None:
        """Saves a binary FAISS index to the specified disk path.

        Args:
            index: Loaded FAISS index instance.
            path: Target file path.
        """
        try:
            os.makedirs(path.parent, exist_ok=True)
            faiss.write_index(index, str(path))
            logger.info(f"Successfully serialized FAISS index to {path}")
        except Exception as e:
            logger.error(f"Failed to serialize FAISS index to {path}: {e}")
            raise

    @staticmethod
    def load_index(path: Path) -> faiss.Index:
        """Loads a binary FAISS index from disk.

        Args:
            path: Target index file path.

        Returns:
            faiss.Index: Loaded FAISS index instance.
        """
        if not path.exists():
            raise FileNotFoundError(f"FAISS index file not found at: {path}")
        try:
            index = faiss.read_index(str(path))
            logger.info(f"Successfully deserialized FAISS index from {path}")
            return index
        except Exception as e:
            logger.error(f"Failed to load FAISS index from {path}: {e}")
            raise

    @staticmethod
    def save_mapping(mapping: Dict, path: Path) -> None:
        """Saves candidate string-integer maps using pickle.

        Args:
            mapping: Mappings dictionary.
            path: Target file path.
        """
        try:
            os.makedirs(path.parent, exist_ok=True)
            with open(path, "wb") as f:
                pickle.dump(mapping, f, protocol=pickle.HIGHEST_PROTOCOL)
            logger.info(f"Successfully serialized candidate vector mappings to {path}")
        except Exception as e:
            logger.error(f"Failed to save mappings to {path}: {e}")
            raise

    @staticmethod
    def load_mapping(path: Path) -> Dict:
        """Loads candidate mapping dictionary from disk.

        Args:
            path: Target file path.

        Returns:
            Dict: Deserialized mapping state.
        """
        if not path.exists():
            raise FileNotFoundError(f"Mapping file not found at: {path}")
        try:
            with open(path, "rb") as f:
                mapping = pickle.load(f)
            logger.info(f"Successfully deserialized candidate vector mappings from {path}")
            return mapping
        except Exception as e:
            logger.error(f"Failed to load mapping from {path}: {e}")
            raise

    @staticmethod
    def save_metadata(metadata: Dict, path: Path) -> None:
        """Saves metadata configuration state to disk as JSON.

        Args:
            metadata: Metadata dictionary.
            path: Target file path.
        """
        try:
            os.makedirs(path.parent, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=4, default=str)
            logger.info(f"Successfully saved index metadata to {path}")
        except Exception as e:
            logger.error(f"Failed to save metadata to {path}: {e}")
            raise

    @staticmethod
    def load_metadata(path: Path) -> Dict:
        """Loads metadata configuration state from JSON.

        Args:
            path: Target file path.

        Returns:
            Dict: Parsed metadata fields.
        """
        if not path.exists():
            raise FileNotFoundError(f"Metadata file not found at: {path}")
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load metadata from {path}: {e}")
            raise
