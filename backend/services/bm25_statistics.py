"""BM25 Index Statistics service.

Generates diagnostic reports, health checks, and metrics audits for active
BM25 index corpuses.
"""

import os
import time
from typing import Dict, Optional
import numpy as np
from services.bm25_index_manager import Bm25IndexManager
from utils.logger import get_logger

logger = get_logger(__name__)


class Bm25Statistics:
    """Computes indexing metadata, health scores, and search metrics."""

    def __init__(self, manager: Optional[Bm25IndexManager] = None):
        """Initializes the Bm25Statistics service.

        Args:
            manager: Bm25IndexManager instance.
        """
        self.manager = manager or Bm25IndexManager()

    def health_check(self) -> Dict:
        """Validates consistency between active document corpus, mapping keys, and the index.

        Returns:
            Dict: Diagnostic parameters.
        """
        idx = self.manager.get_index()
        status = "healthy"
        issues = []

        cand_count = len(self.manager.candidate_ids)
        doc_count = len(self.manager.documents)
        corpus_size = idx.corpus_size if idx else 0

        if idx is None:
            status = "uninitialized"
            issues.append("BM25 index pickle file is not loaded in memory.")
        elif cand_count != doc_count:
            status = "degraded"
            issues.append(f"Count mismatch. Mapped candidates: {cand_count}, preprocessed documents: {doc_count}.")
        elif cand_count != corpus_size:
            status = "degraded"
            issues.append(f"Corpus size mismatch. Mapped: {cand_count}, FAISS/BM25 reports: {corpus_size}.")

        score = 1.0
        if status == "degraded":
            score = 0.5
        elif status == "uninitialized":
            score = 0.0

        return {
            "status": status,
            "health_score": score,
            "issues": issues,
            "candidate_count": cand_count,
            "corpus_size": corpus_size,
        }

    def generate_report(self) -> Dict:
        """Assembles a comprehensive state summary report for the active BM25 system.

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

        avg_doc_len = 0.0
        idx = self.manager.get_index()
        if idx and idx.corpus_size > 0:
            avg_doc_len = float(idx.avgdl)

        # Estimate benchmark query latency
        avg_search_time_ms = 0.0
        if idx and idx.corpus_size > 0:
            try:
                # Dry run query search
                t0 = time.time()
                idx.get_scores(["python", "retrieval"])
                avg_search_time_ms = round((time.time() - t0) * 1000.0, 2)
            except Exception:
                pass

        return {
            "index_name": self.manager.index_path.name,
            "algorithm": "BM25Okapi",
            "candidate_count": health["candidate_count"],
            "vocabulary_size": len(self.manager.vocabulary),
            "average_document_length": round(avg_doc_len, 2),
            "storage_size_mb": disk_size_mb,
            "average_search_time_ms": avg_search_time_ms,
            "index_health_score": health["health_score"],
            "status": health["status"],
            "issues": health["issues"],
        }
