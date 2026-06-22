"""Unit tests for the Job Description Understanding Engine.

Validates cleaners, feature extractors, taxonomy mappings, and hidden intent checks.
"""

import pytest

from models.parsed_jd import ParsedJD
from models.jd_requirements import RequirementImportance
from services.jd_cleaner import JdCleaner
from services.jd_taxonomy import JdTaxonomy
from services.jd_feature_extractor import JdFeatureExtractor
from services.jd_analyzer import JdAnalyzer


@pytest.fixture
def sample_raw_jd() -> str:
    """Returns a representative snippet of the Redrob Job Description text."""
    return """
    Job Description: Senior AI Engineer — Founding Team
    Company: Redrob AI (Series A AI-native talent intelligence platform)
    Location: Pune/Noida, India (Hybrid — flexible cadence) | Open to relocation candidates

    Experience Required: 5–9 years (see "what we mean by this" below)

    Let's be honest about this role:
    We need someone who is scrappy — willing to ship a ranker in a week even if the underlying ML is "obviously suboptimal."
    If you've spent your career in pure research environments without any production deployment — we will not move forward.
    This role writes code.

    Things you absolutely need:
    - Production experience with embeddings-based retrieval systems (sentence-transformers, OpenAI embeddings, Milvus).
    - Production experience with vector databases or hybrid search infrastructure.
    - Strong Python.
    - Hands-on experience designing evaluation frameworks for ranking systems (NDCG, MRR, MAP).

    Things we'd like you to have:
    - LLM fine-tuning experience (LoRA, QLoRA, PEFT)
    - Prior exposure to HR-tech, recruiting tech, or marketplace products

    Things we explicitly do NOT want:
    - Framework enthusiasts. LangChain to call OpenAI wrappers only.
    - People who have only worked at consulting firms (TCS, Infosys, Wipro, Accenture) in their entire career.
    """


def test_jd_cleaner():
    """Tests html stripping, Unicode mapping, spacing squashing, and bullet points."""
    cleaner = JdCleaner()
    raw_text = "<li>Bullet Point</li>  \u201cSmart Quote\u201d \u2014 Em Dash  \n\n\n\n  • Bullet point line."
    cleaned = cleaner.clean_text(raw_text)

    # HTML tags removed
    assert "<li>" not in cleaned
    # Unicode normalized
    assert '"Smart Quote"' in cleaned
    assert " - " in cleaned
    # Bullets standardized to standard hyphens
    assert "- Bullet point line." in cleaned
    # Whitespace collapsed
    assert "  " not in cleaned
    assert "\n\n\n" not in cleaned


def test_jd_taxonomy():
    """Tests taxonomy reverse lookup mapping and synonyms resolving."""
    tax = JdTaxonomy()

    # Exact matching
    assert tax.map_skill_to_category("milvus") == "VECTOR_DATABASE"
    assert tax.map_skill_to_category("opensearch") == "RETRIEVAL"
    assert tax.map_skill_to_category("golang") == "PROGRAMMING_LANGUAGE"

    # Substring matching
    assert tax.map_skill_to_category("FAISS Vector Index") == "VECTOR_DATABASE"
    assert tax.map_skill_to_category("Sentence-Transformers NLP") == "NLP"


def test_jd_feature_extractor(sample_raw_jd):
    """Tests parsing titles, companies, experience years, and locations."""
    cleaner = JdCleaner()
    cleaned = cleaner.clean_text(sample_raw_jd)

    extractor = JdFeatureExtractor()
    title, company = extractor.extract_title_and_company(cleaned)
    assert title == "Senior AI Engineer - Founding Team"
    assert company == "Redrob AI"

    min_exp, max_exp = extractor.extract_experience_range(cleaned)
    assert min_exp == 5.0
    assert max_exp == 9.0

    must, good = extractor.extract_requirements_and_skills(cleaned)
    must_names = {r.name for r in must}
    good_names = {r.name for r in good}
    assert "Vector Databases" in must_names
    assert "Python Programming" in must_names
    assert "LLM Fine-Tuning" in good_names

    negatives = extractor.extract_negative_signals(cleaned)
    assert any("consulting" in neg.lower() for neg in negatives)
    assert any("research" in neg.lower() for neg in negatives)


def test_jd_analyzer_hidden_intents(sample_raw_jd):
    """Tests inferring implicit recruiter traits from text phrases."""
    analyzer = JdAnalyzer()
    parsed = analyzer.analyze_jd(sample_raw_jd)

    # Execution Bias inferred from "ship a ranker in a week"
    must_names = {req.name for req in parsed.must_have}
    assert "Execution Bias" in must_names

    # Hands-on coding inferred from "This role writes code"
    assert "Hands-on Coding" in must_names

    # Product Company Preference inferred from consulting blacklist references
    good_names = {req.name for req in parsed.good_to_have}
    assert "Product Company Preference" in good_names


def test_jd_analyzer_scoring_weights(sample_raw_jd):
    """Tests dynamic weight distribution adjustments based on JD focus."""
    analyzer = JdAnalyzer()
    parsed = analyzer.analyze_jd(sample_raw_jd)

    # Check sum of profile weights equals 1.0
    weights = parsed.scoring_profile
    assert sum(weights.values()) == pytest.approx(1.0)
    assert weights["technical_weight"] == 0.40

    # Test summary string generation
    assert "Senior AI Engineer" in parsed.summary
    assert "Redrob AI" in parsed.summary
