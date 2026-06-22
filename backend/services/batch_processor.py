"""Batch Processor service for dividing candidate streams.

Groups high-volume iterators into manageable lists (batches) to facilitate
bulk vector indexing and parallel processing.
"""

from typing import Any, Dict, Generator, Iterable, List

from models.candidate import Candidate
from utils.logger import get_logger

logger = get_logger(__name__)


class BatchProcessor:
    """Provides memory-efficient chunking mechanisms for iterables."""

    @staticmethod
    def batch_generator(
        stream: Iterable[Any], batch_size: int = 500
    ) -> Generator[List[Any], None, None]:
        """Groups items from any iterable into lists of batch_size.

        Enforces low RAM footprint by avoiding loading full sequences.

        Args:
            stream: Source iterator yielding elements.
            batch_size: Number of elements per batch.

        Yields:
            List[Any]: Chunks of elements.
        """
        if batch_size <= 0:
            raise ValueError("batch_size must be a positive integer.")

        batch = []
        for item in stream:
            batch.append(item)
            if len(batch) >= batch_size:
                yield batch
                batch = []  # Clear memory reference

        if batch:
            yield batch

    def batch_candidates(
        self, candidate_stream: Iterable[Candidate], batch_size: int = 500
    ) -> Generator[List[Candidate], None, None]:
        """Splits a stream of Candidate objects into batches.

        Args:
            candidate_stream: Iterator yielding Candidate instances.
            batch_size: Limit number of candidates in each list.
        """
        logger.debug(f"Starting candidate batch partition (size: {batch_size})")
        yield from self.batch_generator(candidate_stream, batch_size)

    def batch_records(
        self, record_stream: Iterable[Dict[str, Any]], batch_size: int = 500
    ) -> Generator[List[Dict[str, Any]], None, None]:
        """Splits a stream of raw dictionaries into batches.

        Args:
            record_stream: Iterator yielding dictionary profiles.
            batch_size: Limit number of items in each list.
        """
        logger.debug(f"Starting record dict batch partition (size: {batch_size})")
        yield from self.batch_generator(record_stream, batch_size)
