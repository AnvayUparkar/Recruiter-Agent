"""BM25 Preprocessor service.

Translates CandidateProfile models into dense keyword-rich candidate documents
optimized for lexical indexing.
"""

from typing import List
from models.candidate_profile import CandidateProfile
from utils.logger import get_logger

logger = get_logger(__name__)


class Bm25Preprocessor:
    """Processes structured candidate intelligence profiles into text documents."""

    @staticmethod
    def build_document(profile: CandidateProfile) -> str:
        """Constructs a keyword-rich text document from a candidate profile.

        Args:
            profile: The CandidateProfile object.

        Returns:
            str: Compiled document text.
        """
        parts = []

        # 1. Base Recruiter Summary & ID
        parts.append(f"Candidate: {profile.candidate_id}")
        if profile.candidate_summary:
            parts.append(profile.candidate_summary)

        # 2. Technical Capabilities
        tech = profile.technical_profile
        tech_keywords = []
        if tech.retrieval_experience >= 0.5:
            tech_keywords.append("Retrieval System Search Engine Elasticsearch Opensearch Solr Lucene BM25")
        if tech.ranking_experience >= 0.5:
            tech_keywords.append("Ranking Engine Re-ranking Cross-Encoder Learning-to-rank LTR NDCG MRR")
        if tech.recommendation_experience >= 0.5:
            tech_keywords.append("Recommendation Recommender Collaborative Filtering Matrix Factorization")
        if tech.vector_database_experience >= 0.5:
            tech_keywords.append("Vector Database FAISS Pinecone Qdrant Milvus Weaviate Chroma")
        if tech.llm_experience >= 0.5:
            tech_keywords.append("LLM Large Language Model OpenAI GPT Claude RAG LangChain LlamaIndex Gemini")
        if tech.python_experience >= 0.5:
            tech_keywords.append("Python programming Django Flask FastAPI")
        if tech.evaluation_experience >= 0.5:
            tech_keywords.append("Evaluation experimentation A/B testing Ragas benchmark")
        if tech.fine_tuning_experience >= 0.5:
            tech_keywords.append("Fine-Tuning model optimization LoRA QLoRA PEFT deepspeed")
        if tech.distributed_systems_experience >= 0.5:
            tech_keywords.append("Distributed Systems Spark Ray Kubernetes k8s Docker Hadoop dask")
        if tech.production_ml_experience >= 0.5:
            tech_keywords.append("Production ML MLOps deployment AWS GCP Azure MLflow Sagemaker")
        if tech.open_source_signal >= 0.5:
            tech_keywords.append("Open Source contributor maintainer GitHub")

        if tech_keywords:
            parts.append(" ".join(tech_keywords))

        # 3. Career Trajectory
        career = profile.career_profile
        parts.append(f"Experience: {career.years_experience:.1f} years. Average tenure: {career.average_tenure:.1f} years.")
        if career.product_company_ratio >= 0.5:
            parts.append("Product company background.")
        if career.startup_ratio >= 0.5:
            parts.append("Startup experience.")
        if career.leadership_signal >= 0.5:
            parts.append("Technical leadership lead manager principal architect.")

        # 4. Behavioral Attributes
        beh = profile.behavioral_profile
        if beh.availability_score >= 0.7:
            parts.append("Open to work active availability.")
        if beh.responsiveness_score >= 0.7:
            parts.append("Highly responsive communication.")

        # 5. Market Attributes
        mkt = profile.market_profile
        if mkt.relocation_score >= 1.0:
            parts.append("Willing to relocate.")

        return " ".join(parts)

    @staticmethod
    def build_batch_documents(profiles: List[CandidateProfile]) -> List[str]:
        """Converts a batch of candidate profiles into candidate documents.

        Args:
            profiles: List of CandidateProfiles.

        Returns:
            List[str]: List of compiled document strings.
        """
        return [Bm25Preprocessor.build_document(p) for p in profiles]
