"""Vector Index Statistics service.

Generates diagnostic reports, health assessments, and memory usage estimations
for active FAISS index structures.
"""

import os
from typing import Dict, Optional
import numpy as np
import faiss
from services.faiss_index_manager import FaissIndexManager
from utils.logger import get_logger

logger = get_logger(__name__)


class VectorStatistics:
    """Computes indexing metadata, health scores, and RAM footprints."""

    def __init__(self, manager: Optional[FaissIndexManager] = None):
        """Initializes the VectorStatistics service.

        Args:
            manager: FaissIndexManager instance.
        """
        self.manager = manager or FaissIndexManager()

    def estimate_memory_mb(self) -> float:
        """Estimates RAM allocation size in MB based on active vector sizes and HNSW link factors.

        Returns:
            float: Estimated memory usage in Megabytes.
        """
        count = self.manager.vector_store.count_vectors()
        dim = self.manager.dimension
        itype = self.manager.index_type.lower()

        if count == 0:
            return 0.0

        # Float32 uses 4 bytes per dimension value
        flat_bytes = count * dim * 4

        # Estimating overheads per index layout
        if "hnsw" in itype:
            # HNSW keeps flat vectors plus graph connection tables (approx 1.8x flat sizes)
            estimated_bytes = flat_bytes * 1.8
        elif "pq" in itype:
            # PQ compresses representations (typically 1/8 to 1/16 of flat sizes)
            estimated_bytes = flat_bytes * 0.15
        else:
            estimated_bytes = flat_bytes

        # Convert to MB
        return round(estimated_bytes / (1024 * 1024), 2)

    def health_check(self) -> Dict:
        """Runs validation checks between active memory mapping structures and FAISS indices.

        Returns:
            Dict: Diagnostic check parameters.
        """
        idx = self.manager.get_index()
        store = self.manager.vector_store

        status = "healthy"
        issues = []

        mapping_count = store.count_vectors()
        faiss_count = idx.ntotal if idx else 0

        if idx is None:
            status = "uninitialized"
            issues.append("FAISS index binary is not loaded in memory.")
        elif mapping_count != faiss_count:
            status = "degraded"
            issues.append(
                f"Count mismatch. VectorStore mapping has {mapping_count} records, "
                f"while FAISS index reports {faiss_count} vectors."
            )

        if idx and not idx.is_trained:
            status = "degraded"
            issues.append("FAISS index is not trained.")

        # Calculate health score (0.0 to 1.0)
        score = 1.0
        if status == "degraded":
            score = 0.5
        elif status == "uninitialized":
            score = 0.0

        return {
            "status": status,
            "health_score": score,
            "issues": issues,
            "mapping_count": mapping_count,
            "faiss_count": faiss_count,
        }

    def generate_report(self) -> Dict:
        """Assembles a comprehensive state summary report for active index systems.

        Returns:
            Dict: Serialized statistics fields.
        """
        health = self.health_check()
        disk_size_mb = 0.0
        if self.manager.index_path.exists():
            try:
                disk_size_mb = round(os.path.getsize(self.manager.index_path) / (1024 * 1024), 2)
            except OSError:
                pass

        # Calculate a mock search latency benchmark if index is populated
        idx = self.manager.get_index()
        avg_search_time_ms = 0.0
        if idx and idx.ntotal > 0:
            # Benchmark 5 dry runs of random vector searches to estimate search time
            try:
                dim = self.manager.dimension
                sample_query = np.random.randn(1, dim).astype(np.float32)
                faiss.normalize_L2(sample_query)
                
                times = []
                for _ in range(5):
                    t0 = time.time()
                    idx.search(sample_query, min(10, idx.ntotal))
                    times.append((time.time() - t0) * 1000.0)
                avg_search_time_ms = round(float(np.mean(times)), 2)
            except Exception:
                pass

        return {
            "index_name": self.manager.index_path.name,
            "index_type": self.manager.index_type,
            "embedding_dimension": self.manager.dimension,
            "candidate_count": health["mapping_count"],
            "memory_usage_mb": self.estimate_memory_mb(),
            "storage_size_mb": disk_size_mb,
            "average_search_time_ms": avg_search_time_ms,
            "index_health_score": health["health_score"],
            "status": health["status"],
            "issues": health["issues"],
        }
