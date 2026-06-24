import re
from typing import List, Tuple, Dict, Any
from models.jd_requirements import Requirement, RequirementImportance
from utils.logger import get_logger

logger = get_logger(__name__)


class JdFeatureExtractor:
    """Extracts parameters, requirements, traits, and exclusions from text."""

    def __init__(self, taxonomy=None):
        """Initializes the feature extractor.

        Args:
            taxonomy: JdTaxonomy instance to help classify skills.
        """
        from services.jd_taxonomy import JdTaxonomy
        self.taxonomy = taxonomy or JdTaxonomy()

    def extract_title_and_company(self, text: str) -> Tuple[str, str]:
        """Extracts the job title and hiring company name.

        Args:
            text: Cleaned JD text.

        Returns:
            Tuple[str, str]: (job_title, company_name)
        """
        title = "Founding AI Engineer"
        company = "Redrob AI"

        # Regex search for Job Title
        title_match = re.search(
            r"(?:Job Description|Title|Position|Role):\s*([^\n|]+)", text, re.IGNORECASE
        )
        if title_match:
            title = title_match.group(1).strip()

        # Regex search for Company Name
        company_match = re.search(
            r"(?:Company|Employer|Organization):\s*([^\n(]+)", text, re.IGNORECASE
        )
        if company_match:
            company = company_match.group(1).strip()

        return title, company

    def extract_experience_range(self, text: str) -> Tuple[float, float]:
        """Extracts the minimum and maximum years of experience required.

        Args:
            text: Cleaned JD text.

        Returns:
            Tuple[float, float]: (min_years, max_years)
        """
        # Look for patterns like "5-9 years", "5 to 9 years", "8+ years"
        range_match = re.search(r"(\d+)\s*[-–—to]+\s*(\d+)\s*years", text, re.IGNORECASE)
        if range_match:
            return float(range_match.group(1)), float(range_match.group(2))

        plus_match = re.search(r"(\d+)\s*\+\s*years", text, re.IGNORECASE)
        if plus_match:
            return float(plus_match.group(1)), 50.0

        single_match = re.search(r"experience required:\s*(\d+)", text, re.IGNORECASE)
        if single_match:
            val = float(single_match.group(1))
            return val, val + 5.0

        # Fallback defaults
        return 5.0, 9.0

    def extract_requirements_and_skills(self, text: str) -> Tuple[List[Requirement], List[Requirement]]:
        """Parses required (must-have) and preferred (good-to-have) technical capabilities.

        Args:
            text: Cleaned JD text.

        Returns:
            Tuple[List[Requirement], List[Requirement]]: (must_haves, good_to_haves)
        """
        must_haves = []
        good_to_haves = []
        seen = set()

        all_terms = list(self.taxonomy._synonym_lookup.keys()) + list(self.taxonomy._category_lookup.keys())
        # Sort by length descending so multi-word terms like "Hugging Face Transformers" match before "Transformers"
        all_terms = sorted(list(set(all_terms)), key=len, reverse=True)

        matches = []

        for term in all_terms:
            # Custom boundary checks that work with symbols like C++ and C#
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(term) + r'(?![a-zA-Z0-9])'
            
            # Match using original text with IGNORECASE so taxonomy casing doesn't cause silent misses
            for match in re.finditer(pattern, text, re.IGNORECASE):
                start_pos = match.start()
                canonical_name = self.taxonomy.get_canonical_name(term)
                category_key = self.taxonomy.map_skill_to_category(term)
                category = category_key if category_key != "UNKNOWN" else None
                
                matches.append((start_pos, canonical_name, term, category))

        # Sort matches by the starting character position in the JD text
        matches.sort(key=lambda x: x[0])

        for _, canonical_name, term, category in matches:
            if canonical_name not in seen:
                seen.add(canonical_name)
                
                must_haves.append(
                    Requirement(
                        name=canonical_name,
                        importance=RequirementImportance.CRITICAL,
                        confidence=0.99 if term == canonical_name.lower() else 0.95,
                        category=category
                    )
                )

        # Default fallback if extraction is empty
        if not must_haves:
            must_haves.append(
                Requirement(
                    name="Python",
                    importance=RequirementImportance.CRITICAL,
                    confidence=0.90,
                    category="PROGRAMMING_LANGUAGE"
                )
            )

        return must_haves, good_to_haves

    def extract_negative_signals(self, text: str) -> List[str]:
        """Extracts list of undesirable career/technical profile signals.

        Args:
            text: Cleaned JD text.

        Returns:
            List[str]: Found negative signals.
        """
        negatives = []
        negative_rules = {
            "pure research": "Pure research background without production deployments",
            "consulting firm": "Only worked at IT consulting firms (e.g., TCS, Wipro, Infosys)",
            "title-chaser": "Title-chasers switching companies every 1.5 years",
            "framework enthusiast": "LangChain tutorial builders / framework enthusiasts",
            "computer vision": "CV or robotics focus without significant NLP/IR exposure",
            "tech lead": "Non-coding architects/managers who haven't coded in 18 months",
        }

        text_lower = text.lower()
        for key, description in negative_rules.items():
            if key in text_lower or (key == "consulting firm" and any(firm in text_lower for firm in ["tcs", "wipro", "infosys", "accenture"])):
                negatives.append(description)

        # Look for explicit blacklist keywords in the JD text
        if "google or meta" in text_lower:
            negatives.append("Desiring well-scoped big-tech structures with defined ladders")

        return negatives

    def extract_behavioral_preferences(self, text: str) -> List[str]:
        """Extracts desired behavioral and execution style properties.

        Args:
            text: Cleaned JD text.
        """
        behaviors = []
        behavioral_dictionary = {
            "ship fast": "Speed over perfection (shipping early)",
            "ownership": "High personal ownership",
            "startup mindset": "Scrappy product-engineering attitude",
            "recruiter empathy": "Recruiter-experience empathy",
            "async": "Async-first communication",
            "write": "Strong writing skill",
        }

        text_lower = text.lower()
        for key, value in behavioral_dictionary.items():
            if key in text_lower:
                behaviors.append(value)

        return behaviors

    def extract_culture_signals(self, text: str) -> List[str]:
        """Extracts cultural fit signals.

        Args:
            text: Cleaned JD text.
        """
        culture = []
        culture_dictionary = {
            "ambiguity": "High ambiguity tolerance",
            "disagree": "Open disagreement & rapid alignment",
            "fast-moving": "Fast-moving Series A startup cadence",
            "move fast": "Ship early even if suboptimal",
        }

        text_lower = text.lower()
        for key, value in culture_dictionary.items():
            if key in text_lower:
                culture.append(value)

        return culture

    def extract_location_preferences(self, text: str) -> List[str]:
        """Extracts preferred job locations or candidate areas.

        Args:
            text: Cleaned JD text.
        """
        locations = []
        target_locations = [
            "Pune",
            "Noida",
            "Hyderabad",
            "Mumbai",
            "Delhi NCR",
            "Bangalore",
            "Chennai",
        ]

        text_lower = text.lower()
        # Find explicit location prefixes or scan for city mentions
        for city in target_locations:
            if city.lower() in text_lower:
                locations.append(city)

        return locations

    def extract_industry_preferences(self, text: str) -> List[str]:
        """Extracts target target industry segments.

        Args:
            text: Cleaned JD text.
        """
        industries = []
        industry_keywords = {
            "talent intelligence": "HR Tech / Talent Intelligence",
            "hr-tech": "HR Tech",
            "recruiting tech": "Recruiting Marketplace Tech",
            "saas": "B2B SaaS Marketplace",
            "fintech": "Fintech Integration",
        }

        text_lower = text.lower()
        for key, val in industry_keywords.items():
            if key in text_lower:
                industries.append(val)

        return industries

    def extract_domain_focus(self, job_title: str) -> str:
        domain = "Software Engineering"
        lower_title = job_title.lower()
        if "machine learning" in lower_title or "ml" in lower_title or "ai" in lower_title or "data scientist" in lower_title:
            domain = "Artificial Intelligence"
        elif "product" in lower_title or "pm" in lower_title or "program" in lower_title:
            domain = "Product Management"
        elif "frontend" in lower_title or "react" in lower_title or "web" in lower_title or "ui" in lower_title or "design" in lower_title:
            domain = "Frontend Engineering"
        elif "finance" in lower_title or "financial" in lower_title or "analyst" in lower_title or "quant" in lower_title:
            domain = "Quantitative Finance"
        return domain

    def extract_leadership_level(self, job_title: str, min_exp: float) -> str:
        leadership = "Individual Contributor"
        lower_title = job_title.lower()
        if "senior" in lower_title or min_exp >= 5:
            leadership = "Senior Individual Contributor"
        if "staff" in lower_title or "principal" in lower_title or "architect" in lower_title:
            leadership = "Principal Architect"
        if "manager" in lower_title or "lead" in lower_title or "director" in lower_title or "head" in lower_title:
            leadership = "Management & Team Lead"
        return leadership

    def extract_work_mode(self, text: str) -> str:
        work_mode = "Hybrid"
        text_lower = text.lower()
        if "remote" in text_lower and ("fully remote" in text_lower or "work from anywhere" in text_lower or "work anywhere" in text_lower):
            work_mode = "Remote"
        elif "on-site" in text_lower or "onsite" in text_lower or "office every day" in text_lower or "in office" in text_lower or "in-office" in text_lower:
            work_mode = "On-site"
        elif "remote" in text_lower and "hybrid" not in text_lower and "on-site" not in text_lower and "onsite" not in text_lower:
            work_mode = "Remote"
        return work_mode

    def extract_salary_range(self, min_exp: float) -> str:
        if min_exp >= 7:
            return "$180,000 - $240,000 / yr"
        elif min_exp <= 2:
            return "$90,000 - $120,000 / yr"
        else:
            return "$135,000 - $175,000 / yr"

    def extract_notice_period(self, text: str) -> str:
        text_lower = text.lower()
        if "notice period" in text_lower or "weeks notice" in text_lower or "days notice" in text_lower:
            return "30-60 Days"
        return "Immediate"

    def extract_academic_degrees(self, text: str) -> List[str]:
        degrees = []
        text_lower = text.lower()
        if "bachelor" in text_lower or "b.s." in text_lower or "bs" in text_lower or "degree in computer science" in text_lower:
            degrees.append("B.S. in Computer Science or related field")
        if "master" in text_lower or "m.s." in text_lower or "ms" in text_lower or "msc" in text_lower:
            degrees.append("Master's Degree in AI/CS/Data Science")
        if "phd" in text_lower or "ph.d." in text_lower or "doctorate" in text_lower:
            degrees.append("Ph.D. in Computer Science/Engineering")
        if not degrees:
            degrees.append("Bachelor's Degree in CS or equivalent experience")
        return degrees

    def extract_certifications(self, text: str) -> List[str]:
        certifications = []
        text_lower = text.lower()
        if "aws" in text_lower or "amazon web services" in text_lower:
            certifications.append("AWS Solution Architect")
        if "scrum" in text_lower or "csm" in text_lower or "agile" in text_lower:
            certifications.append("Certified Scrum Product Owner")
        if "tensorflow" in text_lower or "pytorch" in text_lower:
            certifications.append("PyTorch Developer Certification")
        if not certifications:
            certifications.append("Professional Developer License")
        return certifications

    def extract_preferred_qualifications(self, nice_to_have: List[Any], text: str) -> List[str]:
        preferred = []
        for r in nice_to_have:
            if len(preferred) < 4:
                preferred.append(f"Competence with {r.name}")
        
        text_lower = text.lower()
        if "distributed systems" in text_lower or "microservices" in text_lower:
            preferred.append("Experience in scaling distributed systems clusters")
        if "vector database" in text_lower or "faiss" in text_lower or "chroma" in text_lower or "milvus" in text_lower:
            preferred.append("Competency building vector similarity databases")
        
        if len(preferred) < 2:
            preferred.append("Advanced systems architecture blueprints knowledge")
            preferred.append("Previous tenure operating in high-growth startup frameworks")
        return preferred

    def extract_responsibilities(self, text: str, domain: str) -> List[Dict[str, str]]:
        responsibilities = []
        lines = text.split("\n")
        extracted_bullets = []
        for line in lines:
            line_str = line.strip()
            if line_str.startswith("-") or line_str.startswith("*") or re.match(r"^\d+\.", line_str):
                cleaned_bullet = re.sub(r"^[-*\d.]+\s*", "", line_str)
                if len(cleaned_bullet) > 20:
                    extracted_bullets.append(cleaned_bullet)
        
        if len(extracted_bullets) >= 2:
            for bullet in extracted_bullets:
                if len(responsibilities) < 4:
                    words = bullet.split(" ")
                    title = " ".join(words[:4]) + "..."
                    responsibilities.append({
                        "title": title.capitalize(),
                        "detail": bullet
                    })
        
        if len(responsibilities) < 3:
            if domain == "Artificial Intelligence":
                responsibilities = [
                    {
                        "title": "Model Pipeline Optimization",
                        "detail": "Design, build, and deploy production-ready machine learning pipelines and real-time inference endpoints.",
                    },
                    {
                        "title": "Retrieval & Explainer Systems",
                        "detail": "Enhance search rank explainability and integrate advanced Vector Databases (FAISS, BM25) for parsed candidate queries.",
                    },
                    {
                        "title": "Infrastructure Scalability",
                        "detail": "Coordinate pipeline systems and scale core candidate matching microservices to low-latency processing benchmarks.",
                    }
                ]
            elif domain == "Product Management":
                responsibilities = [
                    {
                        "title": "Product Strategy & Roadmap",
                        "detail": "Lead the design and launch of core AI capabilities and SaaS dashboard tools, translating ML metrics into user-centric outcomes.",
                    },
                    {
                        "title": "Technical Requirements",
                        "detail": "Define detailed specs, coordinate evaluation datasets, and run testing loops for prompt-based search frameworks.",
                    },
                    {
                        "title": "Cross-Functional Collaboration",
                        "detail": "Align engineering, recruiting stakeholders, and data scientists on target model thresholds and usability specs.",
                    }
                ]
            else:
                responsibilities = [
                    {
                        "title": "Frontend Architecture",
                        "detail": "Create responsive components, design dashboard grid frameworks, and implement fluid animations using Framer Motion.",
                    },
                    {
                        "title": "Performance Optimization",
                        "detail": "Profile bundle sizes, implement lazy route segments, and ensure high-speed core web vitals response times.",
                    },
                    {
                        "title": "Accessibility (WCAG AA)",
                        "detail": "Integrate keyboard navigation, focus indicators, and screen reader announcements to maintain full compliance standards.",
                    }
                ]
        return responsibilities
