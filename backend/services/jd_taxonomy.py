"""Job Description Taxonomy configuration.

Defines standardized technology and trait categories to map skills
and experience requirements for recruiters.
"""

from typing import Dict, List, Optional, Set

# Standardized skill taxonomy mapping categories to lists of specific keywords/synonyms
TAXONOMY: Dict[str, List[str]] = {
    "VECTOR_DATABASE": [
        "pinecone",
        "qdrant",
        "weaviate",
        "milvus",
        "faiss",
        "chroma",
        "chromadb",
        "pgvector",
        "vector database",
        "vector index",
    ],
    "RETRIEVAL": [
        "bm25",
        "opensearch",
        "elasticsearch",
        "hybrid search",
        "dense retrieval",
        "sparse retrieval",
        "information retrieval",
        "search infrastructure",
        "keyword search",
    ],
    "LLM": [
        "openai",
        "claude",
        "gemini",
        "llama",
        "mistral",
        "gpt",
        "falcon",
        "cohere",
        "large language model",
        "llms",
        "rag",
    ],
    "RANKING": [
        "ndcg",
        "mrr",
        "map",
        "ltr",
        "learning-to-rank",
        "ranking models",
        "re-ranking",
        "cross-encoders",
        "recommendation systems",
        "recommendation engines",
        "collaborative filtering",
    ],
    "EVALUATION": [
        "a/b testing",
        "offline evaluation",
        "experimentation",
        "benchmarks",
        "eval frameworks",
        "offline-to-online",
        "ragas",
        "trulens",
        "deep评价",
    ],
    "FINE_TUNING": [
        "lora",
        "qlora",
        "peft",
        "sft",
        "dpo",
        "rlhf",
        "fine tuning",
        "fine-tuning",
        "instruction tuning",
    ],
    "MLOPS": [
        "mlflow",
        "weights & biases",
        "wandb",
        "kubeflow",
        "bentoml",
        "triton",
        "sagemaker",
        "mlops",
        "hugging face",
        "huggingface",
        "model deployment",
        "model serving",
    ],
    "DISTRIBUTED_SYSTEMS": [
        "spark",
        "pyspark",
        "ray",
        "kafka",
        "apache beam",
        "flink",
        "hadoop",
        "dask",
        "distributed training",
        "deepspeed",
        "megatron",
    ],
    "PROGRAMMING_LANGUAGE": [
        "python",
        "go",
        "golang",
        "java",
        "c++",
        "rust",
        "javascript",
        "typescript",
        "sql",
    ],
    "DEVOPS": [
        "docker",
        "kubernetes",
        "k8s",
        "terraform",
        "ansible",
        "ci/cd",
        "github actions",
        "jenkins",
        "helm",
    ],
    "CLOUD_INFRASTRUCTURE": [
        "aws",
        "gcp",
        "azure",
        "amazon web services",
        "google cloud",
        "cloud computing",
    ],
    "MACHINE_LEARNING": [
        "pytorch",
        "tensorflow",
        "scikit-learn",
        "sklearn",
        "xgboost",
        "lightgbm",
        "keras",
        "numpy",
        "pandas",
        "scipy",
        "deep learning",
        "neural networks",
    ],
    "NLP": [
        "natural language processing",
        "nlp",
        "bert",
        "transformers",
        "tokenization",
        "ner",
        "named entity recognition",
        "spacy",
        "nltk",
        "sentence-transformers",
    ],
    "DATABASE_SYSTEMS": [
        "postgresql",
        "mysql",
        "redis",
        "mongodb",
        "cassandra",
        "dynamodb",
        "snowflake",
        "databricks",
        "bigquery",
        "data warehouse",
    ],
    "WEB_FRAMEWORK": [
        "fastapi",
        "flask",
        "django",
        "spring boot",
        "node.js",
        "express",
        "react",
        "angular",
        "vue",
    ],
    "BEHAVIORAL_TRAIT": [
        "ownership",
        "ship fast",
        "execution bias",
        "startup mindset",
        "recruiter empathy",
        "async communication",
        "strong writing",
        "initiative",
        "growth mindset",
    ],
    "MARKETPLACE_PRODUCT": [
        "hr tech",
        "recruiting tech",
        "marketplace",
        "b2b saas",
        "fintech",
        "e-commerce",
        "applied ai",
    ],
    "COMPUTER_VISION": [
        "opencv",
        "cnn",
        "image classification",
        "object detection",
        "yolo",
        "segmentation",
        "computer vision",
    ],
    "SPEECH_AUDIO": [
        "speech recognition",
        "asr",
        "tts",
        "whisper",
        "audio processing",
        "wavenet",
    ],
    "AI_AGENT": [
        "langchain",
        "llamaindex",
        "agentic",
        "function calling",
        "tool use",
    ],
    "SOFTWARE_ENGINEERING": [
        "system design",
        "clean architecture",
        "design patterns",
        "unit testing",
        "dry",
        "solid principles",
        "code quality",
    ]
}


class JdTaxonomy:
    """Manages skill expansion and maps raw terms to standardised categories."""

    def __init__(self):
        # Create inverse index for fast lookup
        self._lookup: Dict[str, str] = {}
        for category, terms in TAXONOMY.items():
            for term in terms:
                self._lookup[term.lower()] = category

    def map_skill_to_category(self, skill_name: str) -> str:
        """Determines category mapping for a skill.

        Checks exact match and checks if category term is a substring.

        Args:
            skill_name: The name of the skill.

        Returns:
            str: Category name if matched, or 'UNKNOWN'.
        """
        skill_lower = skill_name.strip().lower()

        # 1. Exact match
        if skill_lower in self._lookup:
            return self._lookup[skill_lower]

        # 2. Substring matching
        for term, category in self._lookup.items():
            if term in skill_lower or skill_lower in term:
                return category

        return "UNKNOWN"

    def get_category_skills(self, category: str) -> List[str]:
        """Returns standard terms mapped to a category.

        Args:
            category: Category name.
        """
        return TAXONOMY.get(category.upper(), [])

    def get_all_categories(self) -> List[str]:
        """Returns all registered categories."""
        return list(TAXONOMY.keys())

    def get_related_skills(self, skill_name: str) -> Set[str]:
        """Finds related skills mapped to the same category.

        Args:
            skill_name: Skill name to search for.
        """
        category = self.map_skill_to_category(skill_name)
        if category == "UNKNOWN":
            return set()
        return set(TAXONOMY[category])
