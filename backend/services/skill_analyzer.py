"""Skill capability analyzer service.

Scans self-declared skills and career descriptions to extract inferred technical experience scores.
"""

from typing import Dict, List
from models.candidate import Candidate
from services.jd_taxonomy import JdTaxonomy
from utils.logger import get_logger

logger = get_logger(__name__)


class SkillAnalyzer:
    """Analyzes candidate profiles to verify technical capability strengths and confidence."""

    def __init__(self, taxonomy=None):
        self.taxonomy = taxonomy or JdTaxonomy()

    def _detect_capability(
        self, candidate: Candidate, skill_category: str, keywords: List[str]
    ) -> Dict[str, float]:
        """Generic heuristic scanner calculating skill capability strength and confidence.

        Args:
            candidate: The Candidate aggregate instance.
            skill_category: The target classification category in the taxonomy.
            keywords: Specific keywords indicating capability.

        Returns:
            Dict[str, float]: {"score": float, "confidence": float}
        """
        score = 0.0
        confidence = 0.0
        keyword_set = {kw.lower() for kw in keywords}

        # 1. Evaluate explicit skill declaration list
        declared_matches = []
        for skill in candidate.skills:
            mapped_cat = self.taxonomy.map_skill_to_category(skill.name)
            # If mapped to the target category or matches synonyms
            if mapped_cat == skill_category or skill.name.lower() in keyword_set:
                declared_matches.append(skill)

        if declared_matches:
            # Take the highest proficiency strength score
            highest_prof = max(s.skill_strength_score() for s in declared_matches)
            score += highest_prof * 0.70
            confidence += 0.85

        # 2. Evaluate Career History Descriptions and Titles
        desc_matches_count = 0
        title_matches_count = 0

        for job in candidate.career_history:
            job_desc_lower = job.description.lower()
            job_title_lower = job.title.lower()

            # Check job title (strong indicator)
            if any(kw in job_title_lower for kw in keyword_set):
                title_matches_count += 1
                score += 0.20
                confidence += 0.10

            # Check job description (moderate indicator)
            if any(kw in job_desc_lower for kw in keyword_set):
                desc_matches_count += 1
                score += 0.10
                confidence += 0.05

        # Clip values to 0.0 - 1.0 range and round
        final_score = min(1.0, max(0.0, score))
        final_confidence = min(1.0, max(0.0, confidence))

        # Baseline confidence adjustment
        if final_score > 0.0 and final_confidence == 0.0:
            final_confidence = 0.50

        return {
            "score": round(final_score, 2),
            "confidence": round(final_confidence, 2),
        }

    def retrieval_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects experience with retrieval systems (BM25, Search Engine infrastructure)."""
        keywords = ["retrieval", "bm25", "elasticsearch", "opensearch", "search", "solr", "lucene", "hybrid search"]
        return self._detect_capability(candidate, "RETRIEVAL", keywords)

    def ranking_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects experience with ranking systems (NDCG, Learning-to-rank, Re-ranking)."""
        keywords = ["ranking", "ndcg", "mrr", "map", "ltr", "learning-to-rank", "re-ranking", "cross-encoders"]
        return self._detect_capability(candidate, "RANKING", keywords)

    def recommendation_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects experience with recommendation engines."""
        keywords = ["recommendation", "recommender", "collaborative filtering", "matrix factorization"]
        return self._detect_capability(candidate, "RANKING", keywords)

    def vector_db_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects experience with Vector Databases (FAISS, Milvus, Qdrant)."""
        keywords = ["pinecone", "qdrant", "weaviate", "milvus", "faiss", "chroma", "vector database"]
        return self._detect_capability(candidate, "VECTOR_DATABASE", keywords)

    def llm_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects experience with Large Language Models and RAG pipelines."""
        keywords = ["llm", "openai", "claude", "gpt", "gemini", "llama", "mistral", "rag", "langchain", "llamaindex"]
        return self._detect_capability(candidate, "LLM", keywords)

    def evaluation_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects experience with search/ranking evaluation frameworks."""
        keywords = ["evaluation", "a/b testing", "offline evaluation", "experimentation", "ab test", "benchmarks", "ragas"]
        return self._detect_capability(candidate, "EVALUATION", keywords)

    def python_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects Python programming experience."""
        keywords = ["python", "py", "django", "flask", "fastapi"]
        return self._detect_capability(candidate, "PROGRAMMING_LANGUAGE", keywords)

    def open_source_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects open source contributions."""
        keywords = ["open source", "open-source", "contributor", "maintainer", "github contribution"]
        return self._detect_capability(candidate, "SOFTWARE_ENGINEERING", keywords)

    def fine_tuning_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects experience with fine-tuning models (LoRA, QLoRA, PEFT, deepspeed)."""
        keywords = ["fine-tuning", "finetuning", "fine tuning", "lora", "qlora", "peft", "deepspeed", "axolotl"]
        return self._detect_capability(candidate, "LLM", keywords)

    def distributed_systems_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects experience with distributed systems (Spark, Ray, Kubernetes, distributed)."""
        keywords = ["distributed systems", "distributed system", "spark", "ray", "kubernetes", "k8s", "hadoop", "dask", "distributed"]
        return self._detect_capability(candidate, "SOFTWARE_ENGINEERING", keywords)

    def production_ml_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects experience with production machine learning deployment and MLOps."""
        keywords = ["production ml", "mlops", "sagemaker", "mlflow", "kubeflow", "fastapi", "deployment", "docker", "aws", "gcp", "azure"]
        return self._detect_capability(candidate, "SOFTWARE_ENGINEERING", keywords)

    def github_detector(self, candidate: Candidate) -> Dict[str, float]:
        """Detects GitHub activity signal and score."""
        score = min(1.0, max(0.0, candidate.redrob_signals.github_activity_score / 100.0))
        return {
            "score": round(score, 2),
            "confidence": 1.0 if score > 0.0 else 0.5,
        }

    def analyze_skills(self, candidate: Candidate) -> Dict[str, Dict[str, float]]:
        """Maps all technical signals to standard profiles.

        Args:
            candidate: Candidate entity.

        Returns:
            Dict[str, Dict[str, float]]: Capability score mapping.
        """
        return {
            "retrieval": self.retrieval_detector(candidate),
            "ranking": self.ranking_detector(candidate),
            "recommendation": self.recommendation_detector(candidate),
            "vector_db": self.vector_db_detector(candidate),
            "llm": self.llm_detector(candidate),
            "evaluation": self.evaluation_detector(candidate),
            "python": self.python_detector(candidate),
            "open_source": self.open_source_detector(candidate),
            "fine_tuning": self.fine_tuning_detector(candidate),
            "distributed_systems": self.distributed_systems_detector(candidate),
            "production_ml": self.production_ml_detector(candidate),
            "github": self.github_detector(candidate),
        }
