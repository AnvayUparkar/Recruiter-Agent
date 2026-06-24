import pytest
from services.jd_feature_extractor import JdFeatureExtractor
from services.jd_taxonomy import JdTaxonomy

def test_extract_requirements_and_skills_sample_jd():
    # Setup
    taxonomy = JdTaxonomy()
    extractor = JdFeatureExtractor(taxonomy=taxonomy)
    
    # 1. Sample JD matching the requirement
    jd_text = "We are hiring an AI Engineer with experience in FAISS, Pinecone, Hugging Face Transformers, Sentence Transformers, Embeddings, Information Retrieval, Feature Engineering, scikit-learn, Angular, Machine Learning, and MLOps."
    
    # 2. Extract
    must_haves, good_to_haves = extractor.extract_requirements_and_skills(jd_text)
    
    # Extract names to verify
    extracted_names = [req.name for req in must_haves]
    
    # 3. Validation set
    expected_skills = [
        "FAISS",
        "Pinecone",
        "Hugging Face Transformers",
        "Sentence Transformers",
        "Embeddings",
        "Information Retrieval",
        "Feature Engineering",
        "scikit-learn",
        "Angular",
        "Machine Learning",
        "MLOps"
    ]
    
    # Verify all expected skills were extracted
    for skill in expected_skills:
        assert skill in extracted_names, f"Missing skill: {skill} in {extracted_names}"

    # Verify they were extracted in the order of appearance
    for i in range(len(expected_skills) - 1):
        idx_current = extracted_names.index(expected_skills[i])
        idx_next = extracted_names.index(expected_skills[i+1])
        assert idx_current < idx_next, f"Ordering failed between {expected_skills[i]} and {expected_skills[i+1]}"

def test_synonym_resolution():
    taxonomy = JdTaxonomy()
    extractor = JdFeatureExtractor(taxonomy=taxonomy)

    # Verify canonical name conversion works (e.g. 'sklearn' to 'scikit-learn')
    jd_text_synonyms = "We need hf transformers, sklearn, and ml ops."
    must_haves_syn, _ = extractor.extract_requirements_and_skills(jd_text_synonyms)
    synonym_names = [req.name for req in must_haves_syn]
    
    assert "Hugging Face Transformers" in synonym_names
    assert "scikit-learn" in synonym_names
    assert "MLOps" in synonym_names

def test_word_boundaries():
    taxonomy = JdTaxonomy()
    extractor = JdFeatureExtractor(taxonomy=taxonomy)
    
    # "angularity" should not extract "Angular"
    jd_text = "Checking angularity of the system."
    must_haves, _ = extractor.extract_requirements_and_skills(jd_text)
    names = [req.name for req in must_haves]
    
    assert "Angular" not in names
    
    # "C++" should be extracted properly despite trailing symbols
    jd_text_cpp = "We need C++ engineers."
    must_haves_cpp, _ = extractor.extract_requirements_and_skills(jd_text_cpp)
    names_cpp = [req.name for req in must_haves_cpp]
    
    assert "C++" in names_cpp

def test_extensive_ai_skill_extraction():
    taxonomy = JdTaxonomy()
    extractor = JdFeatureExtractor(taxonomy=taxonomy)
    
    # Complex JD with commas, acronyms, mixed cases, and 'or similar' groupings
    jd_text = "sentence-transformers, OpenAI embeddings, BGE, E5, or similar. Weaviate, Qdrant, Milvus, OpenSearch, Elasticsearch. NDCG, MRR, MAP. LoRA, QLoRA, PEFT. XGBoost, Hybrid Search, Information Retrieval, Embeddings, FAISS, Pinecone."
    
    must_haves, _ = extractor.extract_requirements_and_skills(jd_text)
    extracted_names = [req.name for req in must_haves]
    
    # The list of 21 expected canonical skills
    expected_skills = [
        "Sentence Transformers",
        "OpenAI Embeddings",
        "BGE",
        "E5",
        "Weaviate",
        "Qdrant",
        "Milvus",
        "OpenSearch",
        "Elasticsearch",
        "NDCG",
        "MRR",
        "MAP",
        "LoRA",
        "QLoRA",
        "PEFT",
        "XGBoost",
        "Hybrid Search",
        "Information Retrieval",
        "Embeddings",
        "FAISS",
        "Pinecone"
    ]
    
    for skill in expected_skills:
        assert skill in extracted_names, f"Missing extensive skill mapping: {skill} in {extracted_names}"
