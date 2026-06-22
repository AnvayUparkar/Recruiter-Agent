"""Technical Feature Extractor service.

Extracts recruiter-relevant technical domain signals from a
CandidateProfile's TechnicalProfile and candidate text documents.

Why it exists:
  The TechnicalProfile (Phase 5) contains raw experience floats inferred
  by the Candidate Intelligence Engine. The Technical Feature Extractor
  translates those raw signals into normalized, evidence-backed feature
  scores that the Ranking Engine can consume directly.
  It also applies keyword-scanning over career descriptions to detect
  specific technologies (FAISS, Qdrant, NDCG, etc.) that the Phase 5
  extractor may have missed.

Ranking dependency:
  Produces TechnicalFeatures. Technical group has 40% weight in ranking.
  retrieval_experience_score and production_ml_score are strongest predictors.
"""

import re
from typing import Dict, List, Set, Tuple
from models.candidate_profile import CandidateProfile
from models.technical_features import TechnicalFeatures, FeatureScore
from utils.logger import get_logger

logger = get_logger(__name__)

# ── Technology Keyword Taxonomy ───────────────────────────────────────────────

RETRIEVAL_KEYWORDS: Set[str] = {
    "faiss", "elasticsearch", "opensearch", "solr", "whoosh", "annoy",
    "hnswlib", "retrieval", "information retrieval", "semantic search",
    "dense retrieval", "sparse retrieval", "hybrid search", "bm25",
    "tf-idf", "inverted index", "recall", "precision@k", "mrr",
}

RANKING_KEYWORDS: Set[str] = {
    "learning to rank", "ltr", "lambdamart", "ranknet", "listwise", "pairwise",
    "pointwise", "xgboost ranking", "lightgbm rank", "ndcg", "map@k",
    "reranking", "cross-encoder", "bi-encoder", "ranking", "rank fusion",
    "reciprocal rank", "rrf",
}

RECOMMENDATION_KEYWORDS: Set[str] = {
    "recommendation", "recommender", "collaborative filtering",
    "matrix factorization", "als", "item2vec", "user2vec", "content-based",
    "two-tower", "candidate generation", "personalization", "click-through",
    "ctr prediction",
}

VECTOR_DB_KEYWORDS: Set[str] = {
    "faiss", "milvus", "qdrant", "weaviate", "pinecone", "chroma",
    "pgvector", "redis vector", "vespa", "vector store", "vector database",
    "vector db", "embedding store", "ann", "approximate nearest neighbor",
    "hnsw", "ivf", "pq index",
}

PRODUCTION_ML_KEYWORDS: Set[str] = {
    "production ml", "mlops", "kubeflow", "mlflow", "sagemaker",
    "vertex ai", "airflow", "prefect", "dagster", "feature store",
    "model serving", "triton", "bentoml", "seldon", "ci/cd", "kubernetes",
    "docker", "model monitoring", "data drift", "model drift", "a/b testing",
    "shadow deployment", "canary", "online learning",
}

LLM_KEYWORDS: Set[str] = {
    "llm", "large language model", "gpt", "openai", "anthropic", "claude",
    "llama", "mistral", "rag", "retrieval augmented generation",
    "prompt engineering", "fine-tuning", "lora", "qlora", "instruction tuning",
    "langchain", "llamaindex", "hugging face", "transformers", "bert",
    "sentence-bert", "sbert", "embedding model",
}

EVALUATION_KEYWORDS: Set[str] = {
    "ndcg", "map", "mrr", "precision", "recall", "f1", "bleu", "rouge",
    "evaluation framework", "offline evaluation", "online evaluation",
    "a/b test", "experiment", "ablation", "benchmark", "trec", "beir",
    "ms marco", "human evaluation", "annotation", "ground truth",
}

DISTRIBUTED_KEYWORDS: Set[str] = {
    "spark", "hadoop", "kafka", "flink", "ray", "dask", "distributed",
    "microservices", "grpc", "message queue", "redis", "cassandra",
    "hbase", "sharding", "replication", "consistency", "cap theorem",
    "high availability", "horizontal scaling",
}

PYTHON_KEYWORDS: Set[str] = {
    "python", "numpy", "pandas", "scikit-learn", "sklearn",
    "pytorch", "tensorflow", "jax", "keras", "scipy", "fastapi",
    "flask", "pydantic", "sqlalchemy", "asyncio",
}

OPEN_SOURCE_KEYWORDS: Set[str] = {
    "open source", "open-source", "github", "contributed", "maintainer",
    "pull request", "pr", "patch", "apache", "committer",
}

GITHUB_KEYWORDS: Set[str] = {
    "github", "gitlab", "bitbucket", "repository", "repo", "stars",
    "forks", "open source project",
}


class TechnicalFeatureExtractor:
    """Extracts TechnicalFeatures from a CandidateProfile."""

    def __init__(self, confidence_floor: float = 0.5) -> None:
        """Initializes the extractor.

        Args:
            confidence_floor: Minimum confidence score when keyword evidence is
                              found but the Phase 5 intelligence signal is low.
        """
        self.confidence_floor = confidence_floor

    # ── Text Helpers ──────────────────────────────────────────────────────────

    @staticmethod
    def _build_candidate_text(profile: CandidateProfile) -> str:
        """Concatenates all textual fields from the CandidateProfile."""
        parts = [profile.candidate_summary]
        return " ".join(p for p in parts if p).lower()

    @staticmethod
    def _scan_keywords(text: str, keywords: Set[str]) -> Tuple[float, List[str]]:
        """Scans text for keyword matches and returns a raw score and evidence list.

        Score formula: min(1.0, matches / 3)
        → 3 or more distinct keyword hits → max score.

        Args:
            text:     Lowercased candidate text.
            keywords: Keyword set to scan.

        Returns:
            Tuple[float, List[str]]: (raw_score, matched_keywords)
        """
        hits = [kw for kw in keywords if kw in text]
        raw_score = min(1.0, len(hits) / 3.0)
        return raw_score, hits

    def _blend_score(
        self,
        intelligence_signal: float,
        keyword_score: float,
        evidence: List[str],
    ) -> FeatureScore:
        """Blends Phase 5 intelligence signal with keyword scan score.

        Blending strategy:
          - If intelligence signal is strong (>= 0.6): 70% intel + 30% keyword.
          - If intelligence signal is weak (< 0.3) but keywords found: floor at confidence_floor.
          - Otherwise: linear blend.

        Args:
            intelligence_signal: Raw float from TechnicalProfile (0..1).
            keyword_score:       Keyword scan score (0..1).
            evidence:            Matched keywords from scan.

        Returns:
            FeatureScore: Blended score object with confidence and evidence.
        """
        if intelligence_signal >= 0.6:
            blended = 0.70 * intelligence_signal + 0.30 * keyword_score
            confidence = 0.85
        elif keyword_score > 0.0 and intelligence_signal < 0.3:
            blended = max(self.confidence_floor * keyword_score, intelligence_signal)
            confidence = 0.60
        else:
            blended = 0.60 * intelligence_signal + 0.40 * keyword_score
            confidence = 0.70

        return FeatureScore(
            score=round(min(1.0, blended), 4),
            confidence=confidence,
            evidence=evidence[:5],  # cap evidence list length
        )

    # ── Main Extraction ───────────────────────────────────────────────────────

    def extract_features(self, profile: CandidateProfile) -> TechnicalFeatures:
        """Extracts TechnicalFeatures from a CandidateProfile.

        Args:
            profile: Candidate intelligence profile.

        Returns:
            TechnicalFeatures: Populated feature object.
        """
        text = self._build_candidate_text(profile)
        tp = profile.technical_profile

        def _extract(
            intel_signal: float, keywords: Set[str], label: str
        ) -> FeatureScore:
            kw_score, evidence = self._scan_keywords(text, keywords)
            return self._blend_score(intel_signal, kw_score, evidence)

        evidence_map: Dict[str, FeatureScore] = {
            "retrieval_experience_score": _extract(
                tp.retrieval_experience, RETRIEVAL_KEYWORDS, "retrieval"
            ),
            "ranking_experience_score": _extract(
                tp.ranking_experience, RANKING_KEYWORDS, "ranking"
            ),
            "recommendation_experience_score": _extract(
                tp.recommendation_experience, RECOMMENDATION_KEYWORDS, "recommendation"
            ),
            "vector_db_experience_score": _extract(
                tp.vector_database_experience, VECTOR_DB_KEYWORDS, "vector_db"
            ),
            "production_ml_score": _extract(
                tp.production_ml_experience, PRODUCTION_ML_KEYWORDS, "production_ml"
            ),
            "llm_score": _extract(
                tp.llm_experience, LLM_KEYWORDS, "llm"
            ),
            "evaluation_score": _extract(
                tp.evaluation_experience, EVALUATION_KEYWORDS, "evaluation"
            ),
            "distributed_systems_score": _extract(
                tp.distributed_systems_experience, DISTRIBUTED_KEYWORDS, "distributed"
            ),
            "python_score": _extract(
                tp.python_experience, PYTHON_KEYWORDS, "python"
            ),
            "open_source_score": _extract(
                tp.open_source_signal, OPEN_SOURCE_KEYWORDS, "open_source"
            ),
            "github_score": _extract(
                tp.github_signal, GITHUB_KEYWORDS, "github"
            ),
        }

        features = TechnicalFeatures(
            retrieval_experience_score=evidence_map["retrieval_experience_score"].score,
            ranking_experience_score=evidence_map["ranking_experience_score"].score,
            recommendation_experience_score=evidence_map["recommendation_experience_score"].score,
            vector_db_experience_score=evidence_map["vector_db_experience_score"].score,
            production_ml_score=evidence_map["production_ml_score"].score,
            llm_score=evidence_map["llm_score"].score,
            evaluation_score=evidence_map["evaluation_score"].score,
            distributed_systems_score=evidence_map["distributed_systems_score"].score,
            python_score=evidence_map["python_score"].score,
            open_source_score=evidence_map["open_source_score"].score,
            github_score=evidence_map["github_score"].score,
            feature_evidence=evidence_map,
        )

        logger.debug(
            f"TechnicalFeatureExtractor: {profile.candidate_id} → "
            f"overall={features.overall_technical_score():.3f}"
        )
        return features
