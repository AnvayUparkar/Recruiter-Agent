"""Job Description Taxonomy configuration.

Defines standardized technology and trait categories to map skills
and experience requirements for recruiters.
"""

from typing import Dict, List, Optional, Set

# Standardized skill taxonomy mapping categories to lists of specific keywords/synonyms
TAXONOMY: Dict[str, List[str]] = {
    "VECTOR_DATABASE": [
        "FAISS",
        "Pinecone",
        "Weaviate",
        "Milvus",
        "ChromaDB",
        "Qdrant",
        "pgvector"
    ],
    "RETRIEVAL": [
        "Information Retrieval",
        "Semantic Search",
        "Hybrid Search",
        "Vector Search",
        "Dense Retrieval",
        "Sparse Retrieval",
        "BM25",
        "RAG",
        "Retrieval-Augmented Generation",
        "Semantic Retrieval",
        "Retriever",
        "OpenSearch",
        "Elasticsearch"
    ],
    "LLM": [
        "OpenAI",
        "Anthropic",
        "Gemini",
        "Claude",
        "Llama",
        "Mistral",
        "GPT",
        "Cohere",
        "LLM",
        "Large Language Model"
    ],
    "RANKING": [
        "NDCG",
        "MRR",
        "MAP",
        "Learning-to-Rank",
        "Re-ranking",
        "Cross-encoders",
        "Recommendation Systems"
    ],
    "EVALUATION": [
        "A/B Testing",
        "Offline Evaluation",
        "Ragas",
        "TruLens"
    ],
    "FINE_TUNING": [
        "LoRA",
        "QLoRA",
        "PEFT",
        "SFT",
        "RLHF",
        "Fine-tuning"
    ],
    "MLOPS": [
        "MLOps",
        "MLflow",
        "Weights & Biases",
        "Kubeflow",
        "BentoML",
        "Triton",
        "SageMaker",
        "Model Deployment",
        "Model Serving"
    ],
    "DISTRIBUTED_SYSTEMS": [
        "Spark",
        "Ray",
        "Kafka",
        "Apache Beam",
        "Flink",
        "Hadoop",
        "Distributed Training",
        "DeepSpeed"
    ],
    "PROGRAMMING_LANGUAGE": [
        "Python",
        "Go",
        "Java",
        "C++",
        "Rust",
        "JavaScript",
        "TypeScript",
        "SQL"
    ],
    "DEVOPS": [
        "Docker",
        "Kubernetes",
        "Terraform",
        "CI/CD",
        "GitHub Actions"
    ],
    "CLOUD_INFRASTRUCTURE": [
        "AWS",
        "GCP",
        "Azure",
        "Cloud Computing"
    ],
    "MACHINE_LEARNING": [
        "Machine Learning",
        "Deep Learning",
        "scikit-learn",
        "PyTorch",
        "TensorFlow",
        "Keras",
        "XGBoost",
        "LightGBM",
        "CatBoost",
        "Feature Engineering",
        "NumPy",
        "Pandas",
        "SciPy",
        "Neural Networks"
    ],
    "NLP": [
        "NLP",
        "Natural Language Processing",
        "Embeddings",
        "Vector Embeddings",
        "Dense Embeddings",
        "Sparse Embeddings",
        "Sentence Embeddings",
        "Sentence Transformers",
        "Transformers",
        "Hugging Face",
        "Hugging Face Transformers",
        "OpenAI Embeddings",
        "BGE",
        "E5",
        "BERT",
        "RoBERTa",
        "T5",
        "spaCy",
        "NLTK",
        "Tokenizers",
        "Named Entity Recognition"
    ],
    "DATABASE_SYSTEMS": [
        "PostgreSQL",
        "MySQL",
        "Redis",
        "MongoDB",
        "Cassandra",
        "Snowflake",
        "Databricks",
        "BigQuery",
        "DynamoDB",
        "Oracle",
        "Datawarehouse"
    ],
    "WEB_FRAMEWORK": [
        "Angular",
        "React",
        "Vue",
        "FastAPI",
        "Flask",
        "Django",
        "Spring Boot",
        "Node.js",
        "Express"
    ],
    "COMPUTER_VISION": [
        "Computer Vision",
        "OpenCV",
        "CNN",
        "Image Classification",
        "Object Detection",
        "YOLO",
        "Segmentation"
    ],
    "AI_AGENT": [
        "LangChain",
        "LlamaIndex",
        "Agentic",
        "Function Calling",
        "Tool Use"
    ]
}

SYNONYMS: Dict[str, str] = {
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "scikitlearn": "scikit-learn",
    "hf transformers": "Hugging Face Transformers",
    "huggingface": "Hugging Face",
    "hugging face": "Hugging Face",
    "huggingface transformers": "Hugging Face Transformers",
    "sentencetransformer": "Sentence Transformers",
    "sentence transformer": "Sentence Transformers",
    "sentence-transformers": "Sentence Transformers",
    "openai embeddings": "OpenAI Embeddings",
    "hybrid retrieval": "Hybrid Search",
    "dense retrieval": "Dense Retrieval",
    "sparse retrieval": "Sparse Retrieval",
    "learning to rank": "Learning-to-Rank",
    "ml ops": "MLOps",
    "vector embedding": "Embeddings",
    "semantic retrieval": "Information Retrieval",
    "angular 17": "Angular",
    "angularjs": "Angular",
    "k8s": "Kubernetes",
    "amazon web services": "AWS",
    "google cloud": "GCP",
    "golang": "Go",
    "reactjs": "React",
    "vuejs": "Vue",
    "node": "Node.js",
    "nodejs": "Node.js",
    "llms": "LLM",
    "large language models": "LLM",
    "chroma": "ChromaDB",
    "wandb": "Weights & Biases"
}


class JdTaxonomy:
    """Manages skill expansion and maps raw terms to standardised categories."""

    def __init__(self):
        # Inverse index mapping lowered base terms to their Category
        self._category_lookup: Dict[str, str] = {}
        for category, terms in TAXONOMY.items():
            for term in terms:
                self._category_lookup[term.lower()] = category
        
        # Lowercased synonyms mapping to their Canonical names
        self._synonym_lookup: Dict[str, str] = {
            k.lower(): v for k, v in SYNONYMS.items()
        }

    def get_canonical_name(self, term: str) -> str:
        """Resolves a raw term to its canonical name (e.g., 'sklearn' -> 'scikit-learn')."""
        term_lower = term.strip().lower()
        if term_lower in self._synonym_lookup:
            return self._synonym_lookup[term_lower]
        
        # Also ensure base terms return their proper casing (e.g., 'faiss' -> 'FAISS')
        for category, base_terms in TAXONOMY.items():
            for base_term in base_terms:
                if term_lower == base_term.lower():
                    return base_term
        return term.strip()

    def map_skill_to_category(self, skill_name: str) -> str:
        """Determines category mapping for a skill."""
        skill_lower = skill_name.strip().lower()
        
        # Try finding base term directly
        if skill_lower in self._category_lookup:
            return self._category_lookup[skill_lower]
            
        # Try resolving synonym first
        if skill_lower in self._synonym_lookup:
            canonical = self._synonym_lookup[skill_lower]
            return self._category_lookup.get(canonical.lower(), "UNKNOWN")

        return "UNKNOWN"

    def get_category_skills(self, category: str) -> List[str]:
        """Returns standard terms mapped to a category."""
        return TAXONOMY.get(category.upper(), [])

    def get_all_categories(self) -> List[str]:
        """Returns all registered categories."""
        return list(TAXONOMY.keys())

    def get_related_skills(self, skill_name: str) -> Set[str]:
        """Finds related skills mapped to the same category."""
        category = self.map_skill_to_category(skill_name)
        if category == "UNKNOWN":
            return set()
        return set(TAXONOMY[category])

