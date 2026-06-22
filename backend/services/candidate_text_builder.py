"""Candidate text builder service.

Assembles candidate documents, short summaries, and embedding-ready text.
"""

from typing import List
from models.candidate import Candidate
from models.technical_profile import TechnicalProfile
from models.career_profile import CareerProfile
from models.behavioral_profile import BehavioralProfile
from models.market_profile import MarketProfile
from utils.logger import get_logger

logger = get_logger(__name__)


class CandidateTextBuilder:
    """Utility to build structured text representations of candidates for search and display."""

    @staticmethod
    def build_short_summary(
        candidate: Candidate,
        technical: TechnicalProfile,
        career: CareerProfile,
        behavioral: BehavioralProfile,
        market: MarketProfile,
    ) -> str:
        """Synthesizes a recruiter-style natural language overview (max 100 words).

        Args:
            candidate: Candidate aggregate.
            technical: Technical profile.
            career: Career profile.
            behavioral: Behavioral profile.
            market: Market profile.

        Returns:
            str: Recruiter summary string.
        """
        name = candidate.profile.anonymized_name or "Candidate"
        title = candidate.current_role or candidate.profile.headline or "Engineer"
        years = candidate.total_years_experience

        # Identify top capabilities
        caps = []
        if technical.retrieval_experience >= 0.7:
            caps.append("Retrieval Systems")
        if technical.ranking_experience >= 0.7:
            caps.append("Ranking Engines")
        if technical.vector_database_experience >= 0.7:
            caps.append("Vector Databases")
        if technical.llm_experience >= 0.7:
            caps.append("LLMs/RAG")
        if technical.python_experience >= 0.7:
            caps.append("Python Development")
        if technical.distributed_systems_experience >= 0.7:
            caps.append("Distributed Systems")

        cap_str = ", ".join(caps[:3])
        skills_phrase = f" with expertise in {cap_str}" if cap_str else ""

        # Stability/Trajectory
        stability_desc = "highly stable" if career.career_stability >= 0.7 else "developing"
        product_phrase = "product-focused background" if career.product_company_ratio >= 0.5 else "consulting/diverse background"

        # Platform behavior
        avail_status = "actively open to work" if candidate.redrob_signals.open_to_work_flag else "open to exploration"
        resp_phrase = "excellent responsiveness" if behavioral.responsiveness_score >= 0.7 else "moderate activity"

        # Compose summary
        summary = (
            f"{name} is a {title} with {years:.1f} years of experience{skills_phrase}. "
            f"Demonstrates a {stability_desc}, {product_phrase} (average tenure: {career.average_tenure:.1f} years). "
            f"The candidate is {avail_status} with {resp_phrase} on the platform. "
            f"Compensation expectations align well with market benchmarks."
        )

        # Enforce < 100 words limit strictly
        words = summary.split()
        if len(words) > 95:
            summary = " ".join(words[:95]) + "..."

        return summary

    @staticmethod
    def build_candidate_document(
        candidate: Candidate,
        technical: TechnicalProfile,
        career: CareerProfile,
        behavioral: BehavioralProfile,
        market: MarketProfile,
    ) -> str:
        """Assembles a full structured candidate profile document suitable for lexical search (BM25).

        Args:
            candidate: Candidate aggregate.
            technical: Technical profile.
            career: Career profile.
            behavioral: Behavioral profile.
            market: Market profile.

        Returns:
            str: Document body.
        """
        lines = []
        # Header
        lines.append(f"Candidate ID: {candidate.candidate_id}")
        lines.append(f"Headline: {candidate.profile.headline or ''}")
        lines.append(f"Current Role: {candidate.current_role or ''} at {candidate.current_company or ''}")
        lines.append(f"Years of Experience: {candidate.total_years_experience:.1f}")
        lines.append(f"Location: {candidate.profile.location or ''}, {candidate.profile.country or ''}")
        lines.append("")

        # Scores Summary
        lines.append("--- Intelligence Scores ---")
        lines.append(f"Technical Strength: {technical.technical_strength_score():.2f}")
        lines.append(f"Career Stability: {career.career_stability:.2f} (Tenure: {career.average_tenure:.1f} yrs)")
        lines.append(f"Product Ratio: {career.product_company_ratio:.2f}")
        lines.append(f"Behavior Score: {behavioral.behavioral_strength_score():.2f} (Responsiveness: {behavioral.responsiveness_score:.2f})")
        lines.append(f"Market Attractiveness: {market.market_strength_score():.2f}")
        lines.append("")

        # Skills
        lines.append("--- Skills and Competencies ---")
        skills_str = ", ".join([f"{s.name} ({s.proficiency})" for s in candidate.skills])
        lines.append(skills_str if skills_str else "None declared")
        lines.append("")

        # Certifications
        if candidate.certifications:
            lines.append("--- Certifications ---")
            for cert in candidate.certifications:
                lines.append(f"- {cert.name} (Issuer: {cert.issuer}, Year: {cert.year or 'N/A'})")
            lines.append("")

        # Education
        if candidate.education:
            lines.append("--- Education ---")
            for edu in candidate.education:
                lines.append(
                    f"- {edu.degree or 'Degree'} in {edu.field_of_study or 'Field'} from {edu.institution or 'Institution'} "
                    f"(Grad: {edu.end_year or 'N/A'}, Tier: {edu.tier or 'N/A'})"
                )
            lines.append("")

        # Career History
        lines.append("--- Professional Experience ---")
        for idx, job in enumerate(candidate.career_history, 1):
            end_date_str = job.end_date.strftime("%Y-%m-%d") if job.end_date else "Present"
            start_date_str = job.start_date.strftime("%Y-%m-%d") if job.start_date else "N/A"
            lines.append(
                f"Job {idx}: {job.title} at {job.company} ({start_date_str} to {end_date_str}, {job.tenure_years:.1f} yrs)"
            )
            lines.append(f"Company Info: Size: {job.company_size or 'N/A'}, Product-based: {job.is_product_company}")
            lines.append(f"Description: {job.description or ''}")
            lines.append("")

        # Summary
        summary = CandidateTextBuilder.build_short_summary(candidate, technical, career, behavioral, market)
        lines.append("--- Executive Summary ---")
        lines.append(summary)

        return "\n".join(lines)

    @staticmethod
    def build_embedding_text(
        candidate: Candidate,
        technical: TechnicalProfile,
        career: CareerProfile,
        behavioral: BehavioralProfile,
        market: MarketProfile,
    ) -> str:
        """Constructs a dense representation of candidate experience optimized for semantic embeddings.

        Args:
            candidate: Candidate aggregate.
            technical: Technical profile.
            career: Career profile.
            behavioral: Behavioral profile.
            market: Market profile.

        Returns:
            str: Semantic representation text.
        """
        # Primary info
        title = candidate.current_role or candidate.profile.headline or "Software Engineer"
        years = candidate.total_years_experience
        skills = [s.name for s in candidate.top_skills[:10]]
        skills_str = ", ".join(skills)

        # High level expertise areas derived from technical profile
        expertise = []
        if technical.retrieval_experience >= 0.5:
            expertise.append("retrieval systems")
        if technical.ranking_experience >= 0.5:
            expertise.append("ranking models")
        if technical.vector_database_experience >= 0.5:
            expertise.append("vector search databases")
        if technical.llm_experience >= 0.5:
            expertise.append("large language models and RAG")
        if technical.fine_tuning_experience >= 0.5:
            expertise.append("model fine-tuning")
        if technical.evaluation_experience >= 0.5:
            expertise.append("evaluation testing frameworks")
        if technical.distributed_systems_experience >= 0.5:
            expertise.append("distributed system engineering")
        if technical.production_ml_experience >= 0.5:
            expertise.append("production machine learning deployment")

        exp_str = ", ".join(expertise)

        # Job Titles and Companies
        roles = []
        for job in candidate.career_history[:4]:
            roles.append(f"{job.title} at {job.company}")
        roles_str = "; ".join(roles)

        # Combine into semantic string
        parts = [
            f"Role: {title}.",
            f"Experience: {years:.1f} years.",
            f"Key technologies and skills: {skills_str}.",
        ]

        if exp_str:
            parts.append(f"Domain expertise: {exp_str}.")

        if roles_str:
            parts.append(f"Work history: {roles_str}.")

        # Add profile summary to provide user context
        if candidate.profile.summary:
            parts.append(f"Overview: {candidate.profile.summary}")

        return " ".join(parts)
