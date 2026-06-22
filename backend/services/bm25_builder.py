"""BM25 Index Builder service.

Builds tokenized document corpuses and constructs, saves, and loads
BM25Okapi lexical indexes.
"""

import pickle
import os
from pathlib import Path
from typing import List, Optional
from rank_bm25 import BM25Okapi
from services.bm25_tokenizer import Bm25Tokenizer
from utils.logger import get_logger

logger = get_logger(__name__)


class Bm25Builder:
    """Builder factory for rank_bm25 indices."""

    def __init__(self, tokenizer: Optional[Bm25Tokenizer] = None):
        """Initializes the Bm25Builder.

        Args:
            tokenizer: Bm25Tokenizer utility instance.
        """
        self.tokenizer = tokenizer or Bm25Tokenizer()

    def build_corpus(self, documents: List[str]) -> List[List[str]]:
        """Tokenizes raw documents into a grouped corpus format.

        Args:
            documents: List of raw candidate text documents.

        Returns:
            List[List[str]]: Tokenized corpus.
        """
        logger.info(f"Tokenizing {len(documents)} documents for BM25 corpus...")
        return self.tokenizer.tokenize_batch(documents)

    def build_index(self, tokenized_corpus: List[List[str]]) -> BM25Okapi:
        """Constructs a BM25Okapi index from a tokenized corpus.

        Args:
            tokenized_corpus: Grouped lists of tokens.

        Returns:
            BM25Okapi: Initialized index.
        """
        logger.info("Building BM25Okapi index structure...")
        return BM25Okapi(tokenized_corpus)

    @staticmethod
    def save_index(index: BM25Okapi, path: Path) -> None:
        """Serializes the BM25 index object to disk.

        Args:
            index: Initialized BM25Okapi index.
            path: Target file path.
        """
        try:
            os.makedirs(path.parent, exist_ok=True)
            with open(path, "wb") as f:
                pickle.dump(index, f, protocol=pickle.HIGHEST_PROTOCOL)
            logger.info(f"Successfully serialized BM25 index to {path}")
        except Exception as e:
            logger.error(f"Failed to serialize BM25 index to {path}: {e}")
            raise

    @staticmethod
    def load_index(path: Path) -> BM25Okapi:
        """Deserializes the BM25 index object from disk.

        Args:
            path: Target file path.

        Returns:
            BM25Okapi: Loaded index.
        """
        if not path.exists():
            raise FileNotFoundError(f"BM25 index file not found at: {path}")
        try:
            with open(path, "rb") as f:
                index = pickle.load(f)
            logger.info(f"Successfully deserialized BM25 index from {path}")
            return index
        except Exception as e:
            logger.error(f"Failed to load BM25 index from {path}: {e}")
            raise
