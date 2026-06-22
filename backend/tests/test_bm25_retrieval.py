"""Unit and integration tests for Phase 8 BM25 Lexical Retrieval System.

Verifies tokenization rules, preprocessors, builders, managers, keyword matchers,
coverage indices, and database recovery over 10,000 mock candidates.
"""

import tempfile
import shutil
import json
import pickle
from pathlib import Path
import pytest
from models.candidate_profile import CandidateProfile
from models.technical_profile import TechnicalProfile
from models.career_profile import CareerProfile
from models.behavioral_profile import BehavioralProfile
from models.market_profile import MarketProfile
from models.parsed_jd import ParsedJD
from models.jd_requirements import Requirement, RequirementImportance

from services.bm25_tokenizer import Bm25Tokenizer
from services.bm25_preprocessor import Bm25Preprocessor
from services.keyword_matcher import KeywordMatcher
from services.bm25_builder import Bm25Builder
from services.bm25_index_manager import Bm25IndexManager
from services.bm25_search import Bm25Search
from services.bm25_statistics import Bm25Statistics
from services.lexical_retrieval_service import LexicalRetrievalService


@pytest.fixture
def temp_bm25_dir() -> Path:
    """Fixture creating a temporary directory for BM25 index storage."""
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    # Clean up after test run
    if temp_dir.exists():
        shutil.rmtree(temp_dir)


@pytest.fixture
def sample_candidate_profile() -> CandidateProfile:
    """Fixture returning a sample CandidateProfile."""
    return CandidateProfile(
        candidate_id="CAND_9999999",
        technical_profile=TechnicalProfile(
            retrieval_experience=0.8,
            ranking_experience=0.7,
            vector_database_experience=0.9,
            llm_experience=0.6,
            python_experience=0.9,
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


def test_bm25_tokenizer_technical_terms():
    """Verifies tokenizer preserves technical punctuation like C++, C#, .NET, and filters stopwords."""
    tokenizer = Bm25Tokenizer()
    text = "C++ Developer working on C# and .NET with FAISS and BM25 systems. Also knows about the retrieval."
    tokens = tokenizer.tokenize(text)

    # Technical terms preserved
    assert "c++" in tokens
    assert "c#" in tokens
    assert ".net" in tokens
    assert "faiss" in tokens
    assert "bm25" in tokens

    # Stopwords removed
    assert "also" not in tokens
    assert "about" not in tokens
    assert "the" not in tokens


def test_keyword_matcher_synonyms_and_coverage():
    """Verifies KeywordMatcher matches technical synonyms and computes coverage scores."""
    matcher = KeywordMatcher()
    doc_text = "Experienced with LTR, FAISS, and python development."
    doc_tokens = matcher.tokenizer.tokenize(doc_text)

    # 1. Direct match
    query_tokens = ["python"]
    matched, count, coverage = matcher.find_exact_matches(doc_tokens, query_tokens)
    assert "python" in matched
    assert count == 1
    assert coverage == 1.0

    # 2. Synonym match (LTR matches 'learning to rank')
    query_tokens_syn = ["learning to rank", "faiss"]
    matched_syn, count_syn, coverage_syn = matcher.find_exact_matches(doc_tokens, query_tokens_syn)
    assert "learning to rank" in matched_syn
    assert "faiss" in matched_syn
    assert count_syn == 2
    assert coverage_syn == 1.0


def test_bm25_preprocessor_formatting(sample_candidate_profile):
    """Verifies preprocessor compiles profile features into standard candidate documents."""
    preprocessor = Bm25Preprocessor()
    doc = preprocessor.build_document(sample_candidate_profile)

    assert "CAND_9999999" in doc
    assert "python" in doc.lower()
    # Retrieval capability should append keyword lists
    assert "elasticsearch" in doc.lower()
    assert "faiss" in doc.lower()


def test_bm25_index_crud_and_search(temp_bm25_dir, sample_candidate_profile):
    """Integrates manager, builder, search, and statistics over 10,000 mock profiles."""
    manager = Bm25IndexManager(data_dir=temp_bm25_dir)
    manager.delete_index()
    manager.create_index(force_recreate=True)

    # 1. Generate 10,000 mock profiles
    profiles = []
    for i in range(10000):
        # Alternate summaries to check keyword matching variance
        summary = "Senior Developer in python and retrieval databases." if i % 10 == 0 else "Frontend JS programmer."
        profiles.append(
            CandidateProfile(
                candidate_id=f"CAND_{i:07d}",
                technical_profile=TechnicalProfile(
                    python_experience=0.8 if i % 10 == 0 else 0.0,
                    retrieval_experience=0.7 if i % 10 == 0 else 0.0,
                ),
                career_profile=CareerProfile(years_experience=5.0, product_company_ratio=0.5, average_tenure=2.0),
                behavioral_profile=BehavioralProfile(),
                market_profile=MarketProfile(),
                candidate_summary=summary,
                overall_strength=0.5,
            )
        )

    # 2. Rebuild index
    manager.rebuild_index(profiles)
    assert len(manager.candidate_ids) == 10000

    # 3. Save and load verification
    manager.save_index()
    assert manager.index_path.exists()
    assert manager.corpus_path.exists()
    assert manager.metadata_path.exists()

    # Clear memory & reload
    manager._index = None
    manager.candidate_ids = []
    manager.load_index()
    assert len(manager.candidate_ids) == 10000

    # 4. Search verification (get_scores)
    searcher = Bm25Search(manager=manager)
    results = searcher.search("python", top_k=5)
    
    assert len(results) == 5
    assert results[0].rank == 1
    assert "python" in results[0].matched_terms
    assert results[0].bm25_score > 0.0

    # 5. Statistics verification
    stats = Bm25Statistics(manager=manager)
    report = stats.generate_report()
    assert report["candidate_count"] == 10000
    assert report["vocabulary_size"] > 0
    assert report["index_health_score"] == 1.0


def test_lexical_retrieval_service_flow(temp_bm25_dir, sample_candidate_profile):
    """Verifies high-level LexicalRetrievalService search flow and responses."""
    manager = Bm25IndexManager(data_dir=temp_bm25_dir)
    manager.delete_index()
    manager.create_index(force_recreate=True)

    # Add dummy profiles to ensure query keywords occur in < 50% of documents, keeping IDF positive
    dummy1 = CandidateProfile(
        candidate_id="CAND_0000001",
        technical_profile=TechnicalProfile(python_experience=0.0, retrieval_experience=0.0),
        career_profile=CareerProfile(years_experience=1.0, product_company_ratio=0.0, average_tenure=1.0),
        behavioral_profile=BehavioralProfile(),
        market_profile=MarketProfile(),
        candidate_summary="Backend Golang Developer writing web APIs.",
        overall_strength=0.1,
    )
    dummy2 = CandidateProfile(
        candidate_id="CAND_0000002",
        technical_profile=TechnicalProfile(python_experience=0.0, retrieval_experience=0.0),
        career_profile=CareerProfile(years_experience=1.0, product_company_ratio=0.0, average_tenure=1.0),
        behavioral_profile=BehavioralProfile(),
        market_profile=MarketProfile(),
        candidate_summary="Data Analyst using Excel and Tableau.",
        overall_strength=0.1,
    )
    dummy3 = CandidateProfile(
        candidate_id="CAND_0000003",
        technical_profile=TechnicalProfile(python_experience=0.0, retrieval_experience=0.0),
        career_profile=CareerProfile(years_experience=1.0, product_company_ratio=0.0, average_tenure=1.0),
        behavioral_profile=BehavioralProfile(),
        market_profile=MarketProfile(),
        candidate_summary="Frontend Developer doing React and Vue.",
        overall_strength=0.1,
    )

    # Rebuild with mock profiles
    manager.rebuild_index([sample_candidate_profile, dummy1, dummy2, dummy3])

    retriever = LexicalRetrievalService(
        bm25_search=Bm25Search(manager=manager)
    )

    # Query matching
    res = retriever.retrieve_candidates("Senior ML Systems Engineer", top_k=1)
    assert res.total_candidates == 4
    assert len(res.results) == 1
    assert res.results[0].candidate_id == "CAND_9999999"

    # Match by JD
    parsed_jd = ParsedJD(
        job_title="Engineer",
        company_name="Corp",
        experience_range=(5.0, 10.0),
        must_have=[Requirement(name="Python", importance=RequirementImportance.CRITICAL)],
        good_to_have=[],
        negative_signals=[],
        behavioral_preferences=[],
        culture_fit=[],
        industry_preferences=[],
        location_preferences=[],
        scoring_profile={},
        summary="Looking for a Python Engineer.",
    )
    res_jd = retriever.retrieve_top_candidates(parsed_jd, top_k=1)
    assert res_jd.total_candidates == 4
    assert len(res_jd.results) == 1
    assert res_jd.results[0].candidate_id == "CAND_9999999"
