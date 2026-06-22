"""Job Description Analyzer service.

Orchestrates cleaning, feature extraction, taxonomy category mapping,
and hidden requirements logic to build structured recruiter specifications.
"""

from typing import Any, Dict, List, Optional
from models.parsed_jd import ParsedJD
from models.jd_requirements import Requirement, RequirementImportance
from services.jd_cleaner import JdCleaner
from services.jd_feature_extractor import JdFeatureExtractor
from utils.logger import get_logger

logger = get_logger(__name__)


class JdAnalyzer:
    """Combines cleaner, extractor, and hidden intent rules to parse JDs."""

    def __init__(self, cleaner: Optional[JdCleaner] = None, extractor: Optional[JdFeatureExtractor] = None):
        """Initializes the JD Analyzer.

        Args:
            cleaner: JdCleaner utility instance.
            extractor: JdFeatureExtractor utility instance.
        """
        self.cleaner = cleaner or JdCleaner()
        self.extractor = extractor or JdFeatureExtractor()

    def extract_hidden_requirements(self, text: str) -> List[Requirement]:
        """Infers implicit recruiter desires from key phrases in the text.

        Args:
            text: Cleaned JD text.

        Returns:
            List[Requirement]: Inferred hidden requirements.
        """
        hidden = []
        text_lower = text.lower()

        # Rule 1: Fast iteration and ship timelines
        if "ship a ranker in a week" in text_lower or "ship early" in text_lower:
            hidden.append(
                Requirement(
                    name="Execution Bias",
                    importance=RequirementImportance.CRITICAL,
                    confidence=0.95,
                )
            )

        # Rule 2: Production systems deployment
        if "production systems" in text_lower or "deployed to real users" in text_lower:
            hidden.append(
                Requirement(
                    name="Production Deployment Experience",
                    importance=RequirementImportance.CRITICAL,
                    confidence=0.90,
                )
            )

        # Rule 3: Product-company preference vs consulting firms
        if "consulting firm" in text_lower or "bad experiences with consulting" in text_lower:
            hidden.append(
                Requirement(
                    name="Product Company Preference",
                    importance=RequirementImportance.IMPORTANT,
                    confidence=0.85,
                )
            )

        # Rule 4: Coding expectations
        if "this role writes code" in text_lower or "must write code" in text_lower:
            hidden.append(
                Requirement(
                    name="Hands-on Coding",
                    importance=RequirementImportance.CRITICAL,
                    confidence=0.95,
                )
            )

        return hidden

    def generate_jd_summary(self, parsed_jd: ParsedJD) -> str:
        """Synthesizes a short natural language description of the parsed JD.

        Args:
            parsed_jd: ParsedJD instance.
        """
        min_exp, max_exp = parsed_jd.experience_range
        critical_skills = [req.name for req in parsed_jd.must_have[:4]]
        critical_str = ", ".join(critical_skills) if critical_skills else "general ML skills"

        summary = (
            f"Looking for a '{parsed_jd.job_title}' at '{parsed_jd.company_name}' "
            f"demanding {min_exp:.0f}-{max_exp:.0f} years experience. Key critical areas: {critical_str}."
        )
        return summary

    def analyze_jd(self, raw_text: str) -> ParsedJD:
        """Transforms a raw job description string into a structured ParsedJD object.

        Args:
            raw_text: Raw input text from recruiter.

        Returns:
            ParsedJD: Structured specification entity.
        """
        # 1. Clean raw text
        cleaned_text = self.cleaner.clean_text(raw_text)

        # 2. Extract standard fields
        title, company = self.extractor.extract_title_and_company(cleaned_text)
        exp_range = self.extractor.extract_experience_range(cleaned_text)
        must_have, good_to_have = self.extractor.extract_requirements_and_skills(cleaned_text)
        negatives = self.extractor.extract_negative_signals(cleaned_text)
        behaviors = self.extractor.extract_behavioral_preferences(cleaned_text)
        culture = self.extractor.extract_culture_signals(cleaned_text)
        locations = self.extractor.extract_location_preferences(cleaned_text)
        industries = self.extractor.extract_industry_preferences(cleaned_text)

        # 3. Extract hidden recruiter intentions
        hidden_reqs = self.extract_hidden_requirements(cleaned_text)
        for req in hidden_reqs:
            # Append to must_have to ensure they are evaluated in ranking
            if req.importance == RequirementImportance.CRITICAL:
                must_have.append(req)
            else:
                good_to_have.append(req)

        # 4. Generate dynamic weight profile
        # Default weight: technical: 0.40, career: 0.20, behavioral: 0.20, culture: 0.10, location: 0.10
        weights = {
            "technical_weight": 0.40,
            "career_weight": 0.20,
            "behavioral_weight": 0.20,
            "culture_weight": 0.10,
            "location_weight": 0.10,
        }

        # Calibration rules
        cleaned_lower = cleaned_text.lower()
        # If culture and vibe check are heavily emphasized in text
        if cleaned_lower.count("culture") + cleaned_lower.count("vibe") >= 3:
            weights["culture_weight"] = 0.15
            weights["location_weight"] = 0.05  # Subtract from location weight to keep total 1.0

        # 5. Extract recruiter dashboard dossier details
        domain = self.extractor.extract_domain_focus(title)
        leadership = self.extractor.extract_leadership_level(title, exp_range[0])
        work_mode = self.extractor.extract_work_mode(cleaned_text)
        salary_range = self.extractor.extract_salary_range(exp_range[0])
        notice_period = self.extractor.extract_notice_period(cleaned_text)
        degrees = self.extractor.extract_academic_degrees(cleaned_text)
        certifications = self.extractor.extract_certifications(cleaned_text)
        preferred_qualifications = self.extractor.extract_preferred_qualifications(good_to_have, cleaned_text)
        responsibilities = self.extractor.extract_responsibilities(cleaned_text, domain)

        # 6. Calculate dynamic extraction confidence
        all_skills = must_have + good_to_have
        if all_skills:
            avg_conf = (sum(req.confidence for req in all_skills) / len(all_skills)) * 100.0
            confidence = min(max(avg_conf, 65.0), 98.0)
        else:
            confidence = 88.0

        # Construct ParsedJD instance
        parsed_jd = ParsedJD(
            job_title=title,
            company_name=company,
            experience_range=exp_range,
            must_have=must_have,
            good_to_have=good_to_have,
            negative_signals=negatives,
            behavioral_preferences=behaviors,
            culture_fit=culture,
            industry_preferences=industries,
            location_preferences=locations,
            scoring_profile=weights,
            domain=domain,
            leadership=leadership,
            work_mode=work_mode,
            salary_range=salary_range,
            notice_period=notice_period,
            degrees=degrees,
            certifications=certifications,
            preferred_qualifications=preferred_qualifications,
            responsibilities=responsibilities,
            confidence=round(confidence, 1),
            raw_text=raw_text,
        )

        # Generate summary description
        parsed_jd.summary = self.generate_jd_summary(parsed_jd)

        logger.info(f"JD Analysis completed for job: '{title}' at '{company}'")
        return parsed_jd

    def generate_recruiter_view(self, parsed_jd: ParsedJD) -> Dict[str, Any]:
        """Provides a recruiter-focused summary of the parsed JD.

        Args:
            parsed_jd: ParsedJD instance.

        Returns:
            Dict[str, Any]: Recruiter intelligence view.
        """
        return {
            "title": parsed_jd.job_title,
            "company": parsed_jd.company_name,
            "experience_required": f"{parsed_jd.experience_range[0]:.0f}-{parsed_jd.experience_range[1]:.0f} years",
            "must_have_skills": [req.name for req in parsed_jd.must_have],
            "good_to_have_skills": [req.name for req in parsed_jd.good_to_have],
            "red_flags": parsed_jd.negative_signals,
            "behavioral_preferences": parsed_jd.behavioral_preferences,
            "culture_fit_indicators": parsed_jd.culture_fit,
            "preferred_locations": parsed_jd.location_preferences,
            "scoring_weights": parsed_jd.scoring_profile,
        }
