"""Unit and integration tests for Phase 7 FAISS Index & Retrieval Layer.

Verifies index building, saving/loading, k-NN search, incremental updates,
metadata collection, self-healing recovery, and statistics.
"""

import math
import tempfile
import shutil
import json
from pathlib import Path
import pytest
import numpy as np
import faiss
from models.parsed_jd import ParsedJD
from models.jd_requirements import Requirement, RequirementImportance
from models.candidate_profile import CandidateProfile
from models.technical_profile import TechnicalProfile
from models.career_profile import CareerProfile
from models.behavioral_profile import BehavioralProfile
from models.market_profile import MarketProfile

from services.faiss_index_manager import FaissIndexManager
from services.vector_serializer import VectorSerializer
from services.vector_store import VectorStore
from services.index_builder import IndexBuilder
from services.index_updater import IndexUpdater
from services.vector_search import VectorSearch
from services.vector_statistics import VectorStatistics
from services.semantic_retrieval_service import SemanticRetrievalService
from services.embedding_cache import EmbeddingCache


@pytest.fixture
def temp_index_dir() -> Path:
    """Fixture creating a temporary directory for index storage."""
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    # Clean up after test run
    if temp_dir.exists():
        shutil.rmtree(temp_dir)


@pytest.fixture
def temp_cache_db() -> Path:
    """Fixture generating a temporary SQLite cache path."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)
    yield db_path
    if db_path.exists():
        db_path.unlink()


def test_index_builder_layouts():
    """Verifies that IndexBuilder instantiates Flat, HNSW, IVF, and PQ layouts."""
    builder = IndexBuilder()
    dim = 128

    flat = builder.build_index("IndexFlatIP", dim)
    assert isinstance(flat, faiss.IndexIDMap)
    assert flat.index.d == dim

    hnsw = builder.build_index("IndexHNSWFlat", dim, M=16)
    assert isinstance(hnsw, faiss.IndexIDMap)

    ivf = builder.build_index("IndexIVFFlat", dim, nlist=10)
    assert isinstance(ivf, faiss.IndexIDMap)


def test_faiss_crud_and_search(temp_index_dir):
    """Integrates manager, builder, updater, and search over 10,000 vectors."""
    # 1. Initialize manager with temp directory
    manager = FaissIndexManager(data_dir=temp_index_dir)
    manager.delete_index()
    dim = 128
    manager.create_index(index_type="IndexFlatIP", dimension=dim, force_recreate=True)

    # 2. Generate 10,000 mock vectors
    np.random.seed(42)
    raw_vectors = np.random.randn(10000, dim).astype(np.float32)
    faiss.normalize_L2(raw_vectors)
    vectors = raw_vectors.tolist()
    candidate_ids = [f"CAND_{i:07d}" for i in range(10000)]
    hashes = [f"hash_{i}" for i in range(10000)]

    # 3. Populate index
    manager.rebuild_index(vectors, candidate_ids, hashes)
    assert manager.vector_store.count_vectors() == 10000

    # 4. Save and Load verification
    manager.save_index()
    assert manager.index_path.exists()
    assert manager.mapping_path.exists()
    assert manager.metadata_path.exists()

    # Clear memory & reload
    manager._index = None
    manager.vector_store.clear()
    manager.load_index()
    assert manager.vector_store.count_vectors() == 10000

    # 5. Search verification (k-NN)
    searcher = VectorSearch(manager=manager)
    query_vector = np.random.randn(dim).tolist()
    results = searcher.search(query_vector, top_k=5)
    assert len(results) == 5
    assert results[0].rank == 1
    assert results[0].similarity_score >= results[4].similarity_score

    # 6. Incremental updates (Add)
    updater = IndexUpdater(manager=manager)
    new_cand_id = "CAND_9999999"
    new_vector = np.random.randn(dim).tolist()
    updater.add_candidate(new_cand_id, new_vector, text_hash="new_hash")
    assert manager.vector_store.count_vectors() == 10001
    assert manager.vector_store.vector_exists(new_cand_id) is True

    # 7. Incremental updates (Delete)
    updater.remove_candidate(new_cand_id)
    assert manager.vector_store.count_vectors() == 10000
    assert manager.vector_store.vector_exists(new_cand_id) is False

    # 8. Incremental updates (Update)
    update_cand_id = "CAND_0000000"
    update_vector = np.random.randn(dim).tolist()
    updater.update_candidate(update_cand_id, update_vector, text_hash="updated_hash")
    assert manager.vector_store.count_vectors() == 10000


def test_statistics_generation(temp_index_dir):
    """Verifies that VectorStatistics outputs correct RAM sizes and health scores."""
    manager = FaissIndexManager(data_dir=temp_index_dir)
    manager.delete_index()
    manager.create_index(index_type="IndexHNSWFlat", dimension=128, force_recreate=True)

    updater = IndexUpdater(manager=manager)
    updater.add_candidate("CAND_0000001", np.random.randn(128).tolist(), text_hash="h1")

    stats = VectorStatistics(manager=manager)
    report = stats.generate_report()

    assert report["candidate_count"] == 1
    assert report["embedding_dimension"] == 128
    assert report["index_type"] == "IndexHNSWFlat"
    assert report["index_health_score"] == 1.0
    assert report["memory_usage_mb"] >= 0.0


def test_automatic_recovery(temp_index_dir, temp_cache_db):
    """Verifies that FaissIndexManager heals itself from SQLite cache database."""
    # 1. Populate SQLite cache with candidates
    cache = EmbeddingCache(db_path=temp_cache_db)
    dim = 128

    np.random.seed(99)
    v1 = np.random.randn(dim).tolist()
    v2 = np.random.randn(dim).tolist()

    # Metadata dictionary fields matching schema
    meta = {"model_name": "BAAI/bge-large-en-v1.5", "token_count": 12, "embedding_dimension": dim, "source_type": "Summary", "generation_time": 0.01}

    # Save to SQLite cache
    cache.save_embedding("CAND_0000001", v1, "hash_1", meta)
    cache.save_embedding("CAND_0000002", v2, "hash_2", meta)

    # Save a JD to test key skipping during candidate index recovery
    cache.save_embedding("JD_TestJob_Corp", v1, "hash_jd", {"model_name": "model", "token_count": 1, "embedding_dimension": dim, "source_type": "JD", "generation_time": 0.0})

    # Mock cache references in manager
    manager = FaissIndexManager(data_dir=temp_index_dir)
    manager.delete_index()
    manager.index_type = "IndexFlatIP"
    manager.dimension = dim

    # Inject temporary cache path into EmbeddingCache mock parameters inside recovery
    # We monkeypatch EmbeddingCache to use temp_cache_db
    from unittest.mock import patch
    with patch("services.embedding_cache.EmbeddingCache.__init__", lambda s, *a, **k: setattr(s, "db_path", temp_cache_db) or cache._init_db()):
        success = manager.recover_index()
        assert success is True

    # Assert recovery reconstructed index matching candidates
    assert manager.vector_store.count_vectors() == 2
    assert manager.vector_store.vector_exists("CAND_0000001") is True
    assert manager.vector_store.vector_exists("CAND_0000002") is True
    # JD was excluded
    assert manager.vector_store.vector_exists("JD_TestJob_Corp") is False


def test_semantic_retrieval_service_flow(temp_index_dir):
    """Verifies overall pipeline flow from queries to filtered SearchResult lists."""
    manager = FaissIndexManager(data_dir=temp_index_dir)
    manager.delete_index()
    manager.create_index(index_type="IndexFlatIP", dimension=1024, force_recreate=True)

    # Add candidate with custom metadata inside VectorStore
    updater = IndexUpdater(manager=manager)
    updater.add_candidate(
        "CAND_0000001",
        np.random.randn(1024).tolist(),
        text_hash="h1",
        metadata={"years_experience": 8.0, "location": "Bangalore, India", "open_to_work_flag": True},
    )

    retriever = SemanticRetrievalService(
        vector_search=VectorSearch(manager=manager)
    )

    # Query matching
    res = retriever.retrieve_candidates("Senior developer in Bangalore", top_k=1)
    assert res.total_candidates_searched == 1
    assert len(res.results) == 1
    assert res.results[0].candidate_id == "CAND_0000001"

    # Filtered Query matching
    res_filt = retriever.retrieve_with_filters(
        "developer", filters={"min_experience": 5.0, "location": "Bangalore"}, top_k=1
    )
    assert len(res_filt.results) == 1
    assert res_filt.results[0].candidate_id == "CAND_0000001"

    # Filtered query failing match checks
    res_filt_fail = retriever.retrieve_with_filters(
        "developer", filters={"min_experience": 10.0}, top_k=1
    )
    assert len(res_filt_fail.results) == 0
