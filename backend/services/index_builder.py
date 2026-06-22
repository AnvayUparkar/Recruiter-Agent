"""FAISS Index Builder service.

Provides factories to construct, train, and populate different FAISS index types
(Flat, HNSW, IVF, PQ) using vector mapping values.
"""

from typing import Dict, List, Optional
import numpy as np
import faiss
from utils.logger import get_logger

logger = get_logger(__name__)


class IndexBuilder:
    """Builder factory for FAISS index configurations."""

    @staticmethod
    def build_flat_index(dimension: int) -> faiss.Index:
        """Constructs an exact brute-force Inner Product (Cosine) index with ID mapping.

        Args:
            dimension: Dimensionality of vector space.
        """
        # Exact search on Inner Product (METRIC_INNER_PRODUCT)
        base_index = faiss.IndexFlatIP(dimension)
        return faiss.IndexIDMap(base_index)

    @staticmethod
    def build_hnsw_index(dimension: int, M: int = 32) -> faiss.Index:
        """Constructs a Hierarchical Navigable Small World index with ID mapping.

        Args:
            dimension: Dimensionality of vector space.
            M: Number of connections per node (default 32).
        """
        base_index = faiss.IndexHNSWFlat(dimension, M, faiss.METRIC_INNER_PRODUCT)
        # Set HNSW search hyperparameters
        base_index.hnsw.efConstruction = 64
        base_index.hnsw.efSearch = 32
        return faiss.IndexIDMap(base_index)

    @staticmethod
    def build_ivf_index(dimension: int, nlist: int = 100) -> faiss.Index:
        """Constructs an Inverted File (partition cluster) index.

        Args:
            dimension: Dimensionality of vector space.
            nlist: Number of clusters (centroids).
        """
        quantizer = faiss.IndexFlatIP(dimension)
        base_index = faiss.IndexIVFFlat(quantizer, dimension, nlist, faiss.METRIC_INNER_PRODUCT)
        return faiss.IndexIDMap(base_index)

    @staticmethod
    def build_pq_index(dimension: int, nlist: int = 100, M: int = 8, nbits: int = 8) -> faiss.Index:
        """Constructs a Product Quantization index to reduce memory footprint.

        Args:
            dimension: Dimensionality of vector space.
            nlist: Number of centroids.
            M: Number of sub-vector divisions.
            nbits: Number of bits per sub-vector.
        """
        quantizer = faiss.IndexFlatIP(dimension)
        base_index = faiss.IndexIVFPQ(quantizer, dimension, nlist, M, nbits, faiss.METRIC_INNER_PRODUCT)
        return faiss.IndexIDMap(base_index)

    def build_index(self, index_type: str, dimension: int, **kwargs) -> faiss.Index:
        """Constructs and returns an unpopulated FAISS index wrapped in ID Map.

        Args:
            index_type: Key name ("IndexFlatIP", "IndexHNSWFlat", "IndexIVFFlat", "IndexIVFPQ").
            dimension: Vector space dimension.

        Returns:
            faiss.Index: Configured index instance.
        """
        itype = index_type.lower()
        if "flat" in itype:
            logger.info(f"Building Flat Inner Product FAISS index (dim={dimension}).")
            return self.build_flat_index(dimension)
        elif "hnsw" in itype:
            M = kwargs.get("M", 32)
            logger.info(f"Building HNSW Flat Inner Product FAISS index (dim={dimension}, M={M}).")
            return self.build_hnsw_index(dimension, M=M)
        elif "ivfflat" in itype:
            nlist = kwargs.get("nlist", 100)
            logger.info(f"Building IVF Flat FAISS index (dim={dimension}, nlist={nlist}).")
            return self.build_ivf_index(dimension, nlist=nlist)
        elif "ivfpq" in itype:
            nlist = kwargs.get("nlist", 100)
            M = kwargs.get("M", 8)
            nbits = kwargs.get("nbits", 8)
            logger.info(f"Building IVF PQ FAISS index (dim={dimension}, nlist={nlist}, M={M}, nbits={nbits}).")
            return self.build_pq_index(dimension, nlist=nlist, M=M, nbits=nbits)
        else:
            logger.warning(f"Unknown index type '{index_type}'. Defaulting to IndexHNSWFlat.")
            return self.build_hnsw_index(dimension)

    def populate_index(
        self, index: faiss.Index, vectors: List[List[float]], ids: List[int]
    ) -> None:
        """Pre-normalizes vectors, executes training pass if needed, and inserts elements.

        Args:
            index: Loaded FAISS index wrapper.
            vectors: Raw embedding lists.
            ids: Target custom integer IDs.
        """
        if not vectors:
            return

        # Convert to float32 numpy array
        np_vectors = np.array(vectors, dtype=np.float32)
        np_ids = np.array(ids, dtype=np.int64)

        # FAISS inner product matches cosine similarity when vectors are L2-normalized
        faiss.normalize_L2(np_vectors)

        # IVF and PQ index structures require clustering training before additions
        if not index.is_trained:
            logger.info("FAISS index is not trained. Running centroid clustering training pass...")
            # Training requires at least a minimum number of points, check size
            if len(vectors) < 2:
                # Provide dummy training with duplicated vectors if too small to prevent failure
                training_data = np.repeat(np_vectors, 256, axis=0)
                index.train(training_data)
            else:
                index.train(np_vectors)
            logger.info("Centroid training pass completed successfully.")

        index.add_with_ids(np_vectors, np_ids)
        logger.info(f"Successfully inserted {len(ids)} vectors into active FAISS index.")
