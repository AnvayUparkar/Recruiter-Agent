"""Embedding Generator service.

Translates candidate profiles and job descriptions into standard texts
and interacts with the model manager to produce normalized vectors.
"""

from typing import List, Optional, Union
from models.candidate_profile import CandidateProfile
from models.parsed_jd import ParsedJD
from services.model_manager import ModelManager
from utils.logger import get_logger

logger = get_logger(__name__)


class EmbeddingGenerator:
    """Handles vector generation for texts, batches, candidates, and job descriptions."""

    def __init__(self, model_manager: Optional[ModelManager] = None):
        """Initializes the generator.

        Args:
            model_manager: ModelManager utility instance.
        """
        self.model_manager = model_manager or ModelManager()

    def generate_embedding(
        self, text: str, model_name: str = "BAAI/bge-large-en-v1.5"
    ) -> List[float]:
        """Generates an embedding for a single text block.

        Args:
            text: Input string.
            model_name: Target model name.

        Returns:
            List[float]: The generated embedding vector.
        """
        if not text.strip():
            logger.warning("Empty string passed to generate_embedding. Returning dummy zeros.")
            info = self.model_manager.model_info(model_name)
            return [0.0] * info["dimension"]

        model = self.model_manager.get_model(model_name)
        # Wrap single string as list for tokenizer expectations
        embeddings = model.encode([text])
        return embeddings[0]

    def generate_batch_embeddings(
        self,
        texts: List[str],
        model_name: str = "BAAI/bge-large-en-v1.5",
        batch_size: int = 32,
    ) -> List[List[float]]:
        """Processes a list of strings in batches to prevent memory spikes on CPU.

        Args:
            texts: List of input strings.
            model_name: Target model name.
            batch_size: Chunks allocation size.

        Returns:
            List[List[float]]: List of generated embedding vectors.
        """
        if not texts:
            return []

        model = self.model_manager.get_model(model_name)
        total_records = len(texts)
        logger.info(
            f"Generating batch embeddings for {total_records} records with batch_size={batch_size} using {model_name}..."
        )

        results = []
        for i in range(0, total_records, batch_size):
            chunk = texts[i : i + batch_size]
            logger.debug(f"Processing batch chunk index range {i} to {min(i + batch_size, total_records)}...")
            try:
                embeddings = model.encode(chunk)
                results.extend(embeddings)
            except Exception as e:
                logger.error(f"Error generating embeddings for batch range {i}-{i+batch_size}: {e}")
                # Provide fallback zero-vectors for the failed chunk
                info = self.model_manager.model_info(model_name)
                results.extend([[0.0] * info["dimension"]] * len(chunk))

        logger.info(f"Successfully generated batch embeddings of size {len(results)}")
        return results

    @staticmethod
    def build_candidate_embedding_text(profile: CandidateProfile) -> str:
        """Translates candidate profile features into a dense semantic summary.

        Args:
            profile: CandidateProfile instance.

        Returns:
            str: Formatted string representing key credentials.
        """
        parts = []

        # 1. Base Executive Summary
        if profile.candidate_summary:
            parts.append(profile.candidate_summary)

        # 2. Technical Profile highlights
        tech = profile.technical_profile
        tech_skills = []
        if tech.python_experience >= 0.5:
            tech_skills.append("Python development")
        if tech.retrieval_experience >= 0.5:
            tech_skills.append("retrieval systems")
        if tech.ranking_experience >= 0.5:
            tech_skills.append("ranking algorithms")
        if tech.vector_database_experience >= 0.5:
            tech_skills.append("vector databases (like FAISS or Pinecone)")
        if tech.llm_experience >= 0.5:
            tech_skills.append("large language models and RAG pipelines")
        if tech.distributed_systems_experience >= 0.5:
            tech_skills.append("distributed systems scale engineering")
        if tech.production_ml_experience >= 0.5:
            tech_skills.append("production machine learning deployment")

        if tech_skills:
            parts.append(f"Core technical expertise in {', '.join(tech_skills)}.")

        # 3. Career Profile highlights
        career = profile.career_profile
        parts.append(
            f"Professional trajectory spans {career.years_experience:.1f} years, "
            f"with an average tenure of {career.average_tenure:.1f} years per job."
        )
        if career.product_company_ratio >= 0.5:
            parts.append("Strong experience in product-based companies.")
        if career.startup_ratio >= 0.5:
            parts.append("Background includes early or mid-stage startups.")

        # 4. Behavioral Profile highlights
        beh = profile.behavioral_profile
        if beh.availability_score >= 0.7:
            parts.append("Actively seeking opportunities on the platform.")
        if beh.responsiveness_score >= 0.7:
            parts.append("Highly responsive communication pattern with recruiters.")

        # 5. Market Profile highlights
        mkt = profile.market_profile
        if mkt.relocation_score >= 1.0:
            parts.append("Willing to relocate.")

        return " ".join(parts)

    @staticmethod
    def build_jd_embedding_text(jd: ParsedJD) -> str:
        """Translates parsed job requirements into a dense recruiter intent summary.

        Args:
            jd: ParsedJD instance.

        Returns:
            str: Formatted string representing key specifications.
        """
        parts = []
        parts.append(f"Looking for a {jd.job_title} at {jd.company_name}.")
        parts.append(
            f"Required experience range is {jd.experience_range[0]:.0f} to {jd.experience_range[1]:.0f} years."
        )

        must_skills = [req.name for req in jd.must_have]
        if must_skills:
            parts.append(f"Must possess capability in: {', '.join(must_skills)}.")

        good_skills = [req.name for req in jd.good_to_have]
        if good_skills:
            parts.append(f"Preferred or good to have qualities: {', '.join(good_skills)}.")

        if jd.behavioral_preferences:
            parts.append(f"Key behavioral expectations: {', '.join(jd.behavioral_preferences)}.")

        if jd.industry_preferences:
            parts.append(f"Preferred industry exposure: {', '.join(jd.industry_preferences)}.")

        return " ".join(parts)

    def generate_candidate_embedding(
        self, profile: CandidateProfile, model_name: str = "BAAI/bge-large-en-v1.5"
    ) -> List[float]:
        """Generates an embedding for a candidate profile.

        Args:
            profile: The CandidateProfile object.
            model_name: Target model name.

        Returns:
            List[float]: The generated embedding vector.
        """
        text = self.build_candidate_embedding_text(profile)
        return self.generate_embedding(text, model_name)

    def generate_jd_embedding(
        self, jd: ParsedJD, model_name: str = "BAAI/bge-large-en-v1.5"
    ) -> List[float]:
        """Generates an embedding for a parsed job description.

        Args:
            jd: The ParsedJD object.
            model_name: Target model name.

        Returns:
            List[float]: The generated embedding vector.
        """
        text = self.build_jd_embedding_text(jd)
        return self.generate_embedding(text, model_name)
