"""Unit and integration tests for Phase 6 Embedding & Semantic Layer.

Verifies model managers, caching databases, validator logic,
similarity calculations, batch execution, and orchestration pipelines.
"""

import math
import tempfile
from pathlib import Path
import pytest
from models.candidate_profile import CandidateProfile
from models.technical_profile import TechnicalProfile
from models.career_profile import CareerProfile
from models.behavioral_profile import BehavioralProfile
from models.market_profile import MarketProfile
from models.parsed_jd import ParsedJD
from models.jd_requirements import Requirement, RequirementImportance

from services.model_manager import ModelManager, MockEmbeddingModel
from services.embedding_cache import EmbeddingCache
from services.embedding_validator import EmbeddingValidator
from services.embedding_generator import EmbeddingGenerator
from services.embedding_service import EmbeddingService
from services.similarity_engine import SimilarityEngine
from services.semantic_representation_service import SemanticRepresentationService


@pytest.fixture
def mock_candidate_profile() -> CandidateProfile:
    """Fixture returning a mock CandidateProfile."""
    return CandidateProfile(
        candidate_id="CAND_9999999",
        technical_profile=TechnicalProfile(
            retrieval_experience=0.8,
            ranking_experience=0.7,
            vector_database_experience=0.9,
            llm_experience=0.6,
            python_experience=0.9,
            github_signal=0.8,
        ),
        career_profile=CareerProfile(
            years_experience=7.5,
            product_company_ratio=0.8,
            average_tenure=2.5,
            career_stability=0.8,
        ),
        behavioral_profile=BehavioralProfile(
            availability_score=0.9,
            responsiveness_score=0.9,
            interview_reliability=1.0,
            verification_score=1.0,
        ),
        market_profile=MarketProfile(
            recruiter_interest=0.8,
            salary_expectation_score=0.8,
            market_competitiveness=0.7,
        ),
        candidate_summary="Jane Doe is a Senior ML Systems Engineer with expertise in retrieval.",
        overall_strength=0.82,
    )


@pytest.fixture
def mock_parsed_jd() -> ParsedJD:
    """Fixture returning a mock ParsedJD."""
    return ParsedJD(
        job_title="ML Engineer",
        company_name="TechCorp",
        experience_range=(5.0, 10.0),
        must_have=[
            Requirement(name="Python", importance=RequirementImportance.CRITICAL),
            Requirement(name="Retrieval", importance=RequirementImportance.CRITICAL),
        ],
        good_to_have=[
            Requirement(name="Vector database", importance=RequirementImportance.IMPORTANT),
        ],
        negative_signals=["consulting firm"],
        behavioral_preferences=["team player", "proactive"],
        culture_fit=[],
        industry_preferences=["Technology"],
        location_preferences=["Bangalore"],
        scoring_profile={},
        summary="Looking for a Python ML Engineer with Retrieval background.",
    )


@pytest.fixture
def temp_cache_db() -> Path:
    """Fixture generating a temporary SQLite database path."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)
    yield db_path
    # Clean up temp file after test run
    if db_path.exists():
        db_path.unlink()


def test_model_manager_fallback():
    """Verifies that ModelManager defaults to MockEmbeddingModel and maps configuration info."""
    manager = ModelManager()
    manager.unload_model("BAAI/bge-large-en-v1.5")

    # Load model (forces Mock load in test settings)
    manager.load_model("BAAI/bge-large-en-v1.5", force_mock=True)
    info = manager.model_info("BAAI/bge-large-en-v1.5")

    assert info["model_name"] == "BAAI/bge-large-en-v1.5"
    assert info["dimension"] == 1024
    assert info["type"] == "Mock"

    model = manager.get_model("BAAI/bge-large-en-v1.5")
    assert isinstance(model, MockEmbeddingModel)


def test_embedding_cache_operations(temp_cache_db):
    """Verifies SQLite cache saving, loading, existence hashing, and invalidation."""
    cache = EmbeddingCache(db_path=temp_cache_db)
    key = "CAND_9999999"
    embedding = [0.1, 0.2, 0.3, 0.4]
    text_hash = "abcdef123456"
    metadata = {"model_name": "mock-model", "token_count": 10}

    # Verify exists returns False initially
    assert cache.exists(key, text_hash) is False

    # Save
    cache.save_embedding(key, embedding, text_hash, metadata)
    assert cache.exists(key, text_hash) is True
    # Different hash should return False
    assert cache.exists(key, "different_hash") is False

    # Load
    loaded = cache.load_embedding(key)
    assert loaded is not None
    assert loaded["embedding"] == embedding
    assert loaded["text_hash"] == text_hash
    assert loaded["metadata"] == metadata

    # Invalidate
    cache.invalidate(key)
    assert cache.load_embedding(key) is None
    assert cache.exists(key, text_hash) is False


def test_embedding_validator_rules():
    """Verifies EmbeddingValidator identifies size mismatches, empty sets, and NaN/Infs."""
    validator = EmbeddingValidator()

    # Valid vector
    is_valid, errors = validator.validate_embedding([0.5, -0.5, 0.0], expected_dim=3)
    assert is_valid is True
    assert len(errors) == 0

    # Size Mismatch
    is_valid, errors = validator.validate_embedding([0.5, 0.5], expected_dim=3)
    assert is_valid is False
    assert any("dimension mismatch" in e.lower() for e in errors)

    # Empty Vector
    is_valid, errors = validator.validate_embedding([], expected_dim=3)
    assert is_valid is False
    assert any("empty" in e.lower() for e in errors)

    # NaN / Inf values
    is_valid, errors = validator.validate_embedding([0.5, float("nan"), float("inf")], expected_dim=3)
    assert is_valid is False
    assert any("nan" in e.lower() for e in errors)
    assert any("infinite" in e.lower() for e in errors)


def test_embedding_validator_repair():
    """Verifies EmbeddingValidator corrects dimension lengths and clears non-finite elements."""
    validator = EmbeddingValidator()

    # Short vector padding
    repaired = validator.repair_if_possible([0.5, 0.5], expected_dim=3)
    assert len(repaired) == 3
    # Check L2 normalized
    assert math.isclose(sum(x**2 for x in repaired), 1.0, abs_tol=1e-5)

    # Long vector truncation
    repaired = validator.repair_if_possible([1.0, 1.0, 1.0, 1.0], expected_dim=2)
    assert len(repaired) == 2
    assert math.isclose(sum(x**2 for x in repaired), 1.0, abs_tol=1e-5)

    # NaN repair replacement
    repaired = validator.repair_if_possible([0.8, float("nan"), 0.6], expected_dim=3)
    assert len(repaired) == 3
    assert not any(math.isnan(x) for x in repaired)
    assert math.isclose(sum(x**2 for x in repaired), 1.0, abs_tol=1e-5)


def test_embedding_generator(mock_candidate_profile, mock_parsed_jd):
    """Verifies text extraction format and vector generation outputs."""
    manager = ModelManager()
    manager.load_model("BAAI/bge-large-en-v1.5", force_mock=True)

    generator = EmbeddingGenerator(model_manager=manager)

    # Candidate text compile checks
    cand_text = generator.build_candidate_embedding_text(mock_candidate_profile)
    assert "retrieval systems" in cand_text
    assert "Python development" in cand_text
    assert "7.5 years" in cand_text

    # JD text compile checks
    jd_text = generator.build_jd_embedding_text(mock_parsed_jd)
    assert "TechCorp" in jd_text
    assert "Must possess capability in: Python, Retrieval" in jd_text

    # Vectors outputs
    vec_cand = generator.generate_candidate_embedding(mock_candidate_profile)
    assert len(vec_cand) == 1024
    vec_jd = generator.generate_jd_embedding(mock_parsed_jd)
    assert len(vec_jd) == 1024


def test_similarity_engine_calculations():
    """Verifies cosine similarity, batch outputs, and structured SemanticMatch details."""
    engine = SimilarityEngine()

    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]  # Identical
    v3 = [0.0, 1.0, 0.0]  # Orthogonal
    v4 = [-1.0, 0.0, 0.0]  # Opposite

    assert math.isclose(engine.cosine_similarity(v1, v2), 1.0, abs_tol=1e-5)
    assert math.isclose(engine.cosine_similarity(v1, v3), 0.0, abs_tol=1e-5)
    assert math.isclose(engine.cosine_similarity(v1, v4), -1.0, abs_tol=1e-5)

    # Batch Similarity
    matrix = [v2, v3, v4]
    scores = engine.batch_similarity(v1, matrix)
    assert len(scores) == 3
    assert math.isclose(scores[0], 1.0, abs_tol=1e-5)
    assert math.isclose(scores[1], 0.0, abs_tol=1e-5)
    assert math.isclose(scores[2], -1.0, abs_tol=1e-5)


def test_semantic_representation_service_orchestration(
    temp_cache_db, mock_candidate_profile, mock_parsed_jd
):
    """Verifies the integration pipeline from CandidateProfile to cached Similarity matches."""
    manager = ModelManager()
    manager.load_model("BAAI/bge-large-en-v1.5", force_mock=True)

    generator = EmbeddingGenerator(model_manager=manager)
    cache = EmbeddingCache(db_path=temp_cache_db)
    validator = EmbeddingValidator()

    emb_service = EmbeddingService(generator=generator, cache=cache, validator=validator)
    sim_engine = SimilarityEngine()

    orchestrator = SemanticRepresentationService(
        embedding_service=emb_service, similarity_engine=sim_engine
    )

    # Process Candidate representation
    cand_record = orchestrator.build_candidate_representation(mock_candidate_profile)
    assert cand_record.candidate_id == "CAND_9999999"
    assert cand_record.embedding_dimension == 1024
    assert len(cand_record.embedding) == 1024

    # Process JD representation
    jd_record = orchestrator.build_jd_representation(mock_parsed_jd)
    assert jd_record.candidate_id.startswith("JD_")
    assert len(jd_record.embedding) == 1024

    # Direct Comparison
    match_obj = orchestrator.compare_candidate_to_jd(mock_candidate_profile, mock_parsed_jd)
    assert match_obj.candidate_id == "CAND_9999999"
    assert match_obj.similarity_score > -1.0
    # Must have matched retrieval and python
    assert "python" in match_obj.matching_dimensions
    assert "retrieval" in match_obj.matching_dimensions

    # Batch Comparison
    matches = orchestrator.get_top_matches(
        mock_parsed_jd, [mock_candidate_profile, mock_candidate_profile]
    )
    assert len(matches) == 2
    assert matches[0].candidate_id == "CAND_9999999"

    # Stream representation verification
    stream_results = list(
        orchestrator.build_representation_stream(
            [mock_candidate_profile, mock_candidate_profile], batch_size=1
        )
    )
    assert len(stream_results) == 2
    assert stream_results[0].candidate_id == "CAND_9999999"
