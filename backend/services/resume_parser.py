"""Production-grade ATS Resume Parser for Candidate Intel.

Enterprise-level resume parsing system with intelligent section detection,
structured data extraction, and comprehensive skill normalization.
"""

import os
import re
import io
import docx
import pdfplumber
import datetime
from typing import Dict, List, Any, Optional, Tuple, Set
from pydantic import BaseModel, Field
from collections import defaultdict

try:
    from thefuzz import fuzz, process
except ImportError:
    fuzz, process = None, None

try:
    import pytesseract
    from pdf2image import convert_from_bytes
except ImportError:
    pytesseract = None
    convert_from_bytes = None

from services.skills_db import SKILL_CATEGORIES, get_all_standard_skills, map_skill
from utils.logger import get_logger

logger = get_logger(__name__)

class ParsedResume(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    skills: List[str] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    years_of_experience: int = 0
    raw_text: str = ""

class ResumeParser:
    """Production-grade ATS resume parser with intelligent structure detection."""

    # Section header patterns (compiled for performance)
    SECTION_PATTERNS = {
        "profile": re.compile(
            r"^\s*(profile|summary|professional\s+summary|objective|career\s+objective|about\s+me)\s*[:]*\s*$",
            re.IGNORECASE
        ),
        "skills": re.compile(
            r"^\s*(skills?|technical\s+skills?|technical\s+skills?\s*&\s*interests?|core\s+competencies|expertise|technologies)\s*[:]*\s*$",
            re.IGNORECASE
        ),
        "experience": re.compile(
            r"^\s*(experience|work\s+experience|professional\s+experience|employment\s+history|career\s+history)\s*[:]*\s*$",
            re.IGNORECASE
        ),
        "education": re.compile(
            r"^\s*(education|academic\s+background|educational\s+background|qualifications)\s*[:]*\s*$",
            re.IGNORECASE
        ),
        "projects": re.compile(
            r"^\s*(projects?|key\s+projects?|notable\s+projects?)\s*[:]*\s*$",
            re.IGNORECASE
        ),
        "certifications": re.compile(
            r"^\s*(certifications?|certificates?|professional\s+certifications?)\s*[:]*\s*$",
            re.IGNORECASE
        ),
        "languages": re.compile(
            r"^\s*(languages?|linguistic\s+skills?)\s*[:]*\s*$",
            re.IGNORECASE
        ),
        "achievements": re.compile(
            r"^\s*(achievements?|accomplishments?|awards?|honors?)\s*[:]*\s*$",
            re.IGNORECASE
        ),
    }

    # Pre-compiled regex patterns for efficiency
    EMAIL_PATTERN = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
    PHONE_PATTERN = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
    YEAR_PATTERN = re.compile(r'\b(19\d{2}|20[0-2]\d)\b')
    DURATION_PATTERN = re.compile(r'(\d+\.?\d*)\s*(year|yr|month|mo)s?', re.IGNORECASE)
    
    # Project title detection patterns
    PROJECT_TITLE_PATTERNS = [
        # Standalone titles in Title Case (2+ capital words)
        re.compile(r'^[A-Z][a-zA-Z0-9\s\-&]+(?:[A-Z][a-zA-Z0-9\s\-&]*){1,}$'),
        # Bullet + project name
        re.compile(r'^[•●■–—*►▪\-]\s*([A-Z][a-zA-Z0-9\s\-&]+)'),
        # Project name + location (city, state)
        re.compile(r'^([A-Z][a-zA-Z0-9\s\-&]+)\s*[-–—]\s*[A-Z][a-z]+,?\s*[A-Z][a-z]+'),
        # Project name + URL
        re.compile(r'^([A-Z][a-zA-Z0-9\s\-&]+)\s*(https?://|www\.)'),
        # ALL CAPS project names
        re.compile(r'^[A-Z][A-Z\s\-&]{3,}$'),
    ]
    
    # Technology section indicators
    TECH_INDICATORS = re.compile(r'^(technologies?|tech\s+stack|built\s+with|languages?):\s*', re.IGNORECASE)
    
    # URL patterns
    URL_PATTERN = re.compile(r'^(https?://|www\.|Link:\s*)', re.IGNORECASE)
    FULL_URL_PATTERN = re.compile(r'(https?://[^\s]+|www\.[^\s]+)')
    
    # Section terminators that should stop project collection
    PROJECT_TERMINATORS = {
        'education', 'skills', 'technical skills', 'experience', 'achievements', 
        'certifications', 'languages', 'awards', 'honors', 'summary'
    }
    
    # Company-Designation-Duration pattern: "Company – Designation - Duration"
    # Added strict checks for the third group (duration) to prevent matching random lines with hyphens
    COMPANY_HEADER_PATTERN = re.compile(
        r'^(.+?)\s*[–\-—|]\s*(.+?)\s*[–\-—|]\s*(.*?(?:\d{4}|present|current|\d+\s*(?:year|yr|month|mo)).*)$',
        re.IGNORECASE
    )
    
    # Date range patterns
    DATE_RANGE_PATTERN = re.compile(
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:\d{2}/\d{4})|(?:\d{4}))\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:\d{2}/\d{4})|(?:\d{4})|present|current)',
        re.IGNORECASE
    )
    
    # Technology keywords for experience parsing
    TECH_KEYWORDS = {
        "aws", "azure", "python", "java", "javascript", "typescript", "react", "angular", "vue",
        "node.js", "django", "flask", "spring", "kubernetes", "docker", "jenkins", "git",
        "sql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "kafka",
        "rest", "api", "microservices", "graphql", "lambda", "s3", "ec2", "rds",
        "machine learning", "ai", "ml", "nlp", "deep learning", "tensorflow", "pytorch",
        "devops", "ci/cd", "terraform", "ansible", "cloud", "agile", "scrum"
    }

    def __init__(self):
        self.standard_skills = get_all_standard_skills()
        self.skills_list = list(self.standard_skills)
        self.current_year = datetime.datetime.now().year

    def parse_file(self, filename: str, file_stream: io.BytesIO) -> ParsedResume:
        """Entrypoint for parsing an uploaded resume file."""
        text = ""
        ext = os.path.splitext(filename)[1].lower()
        
        try:
            if ext == '.pdf':
                text = self._extract_text_from_pdf(file_stream)
            elif ext in ['.docx', '.doc']:
                text = self._extract_text_from_docx(file_stream)
            else:
                raise ValueError(f"Unsupported file type: {ext}. Only PDF and DOCX are supported.")
                
            if not text.strip():
                raise ValueError("Parsed resume text is empty.")
                
            return self._extract_structured_data(text)
            
        except Exception as e:
            logger.error(f"Failed to parse resume {filename}: {e}", exc_info=True)
            raise ValueError(f"Failed to parse resume {filename}: {str(e)}")

    def _extract_text_from_pdf(self, file_stream: io.BytesIO) -> str:
        text = ""
        try:
            with pdfplumber.open(file_stream) as pdf:
                # Limit to 20 pages max for efficiency
                for page in pdf.pages[:20]:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                        
            # If pdfplumber didn't find any text, it might be a scanned PDF
            if not text.strip() and convert_from_bytes and pytesseract:
                logger.info("Empty text from PDF. Falling back to OCR.")
                file_stream.seek(0)
                images = convert_from_bytes(file_stream.read(), last_page=20)
                for image in images:
                    text += pytesseract.image_to_string(image) + "\n"
        except Exception as e:
            logger.error(f"Error reading PDF: {e}")
        return text

    def _extract_text_from_docx(self, file_stream: io.BytesIO) -> str:
        text = ""
        try:
            doc = docx.Document(file_stream)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            logger.error(f"Error reading DOCX: {e}")
        return text

    def _extract_structured_data(self, text: str) -> ParsedResume:
        """Main extraction pipeline with intelligent section detection."""
        # Clean and normalize text
        text = self._clean_text(text)
        
        resume = ParsedResume(raw_text=text)
        
        # Extract contact information first
        resume.email = self._extract_email(text)
        resume.phone = self._extract_phone(text)
        resume.linkedin = self._extract_url(text, "linkedin.com")
        resume.github = self._extract_url(text, "github.com")
        
        # Extract name with improved heuristics
        resume.name = self._extract_name(text)
        
        # Split into intelligent sections
        sections = self._intelligent_section_split(text)
        
        # Extract years of experience (explicit mentions take priority)
        explicit_years = self._extract_explicit_experience(text)
        
        # Extract structured data from sections
        resume.experience = self._extract_structured_experience(sections.get("experience", ""))
        resume.education = self._extract_structured_education(sections.get("education", ""))
        resume.projects = self._extract_structured_projects(sections.get("projects", ""))
        
        # Extract additional projects from experience responsibilities
        experience_projects = self._extract_projects_from_experience(resume.experience)
        resume.projects.extend(experience_projects)
        
        resume.certifications = self._extract_certifications(sections.get("certifications", ""))
        resume.achievements = self._extract_achievements(sections.get("achievements", ""))
        resume.languages = self._extract_languages(sections.get("languages", ""), text)
        
        # Calculate years of experience
        if explicit_years is not None:
            resume.years_of_experience = explicit_years
        else:
            resume.years_of_experience = self._calculate_experience_years(resume.experience)
        
        # Extract and normalize skills (comprehensive approach)
        resume.skills = self._extract_comprehensive_skills(text, sections, resume.experience)
        
        return resume

    def _clean_text(self, text: str) -> str:
        """Clean and normalize resume text."""
        # Normalize Unicode characters
        text = text.replace('\u2022', '•')  # Bullet points
        text = text.replace('\u2013', '-')  # En dash
        text = text.replace('\u2014', '—')  # Em dash
        text = text.replace('\u2018', "'")  # Left single quote
        text = text.replace('\u2019', "'")  # Right single quote
        text = text.replace('\u201c', '"')  # Left double quote
        text = text.replace('\u201d', '"')  # Right double quote
        text = text.replace('\xa0', ' ')    # Non-breaking space
        
        # Normalize whitespace
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if line:
                # Remove excessive whitespace
                line = re.sub(r'\s+', ' ', line)
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)

    def _extract_name(self, text: str) -> str:
        """Extract candidate name with improved heuristics."""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if not lines:
            return ""
        
        # Skip common non-name headers and section headers
        skip_keywords = {
            "contact", "contact info", "contact information", "resume", 
            "curriculum vitae", "cv", "profile", "personal information",
            "personal details", "objective", "summary", "name achievements",
            "achievements", "experience", "education", "skills", "projects"
        }
        
        # Skip patterns that look like table headers or section dividers
        skip_patterns = [
            r'name\s+achievements',  # "Name    Achievements" header format
            r'achievements\s+name',  # Reverse order
            r'name\s+.*\s+achievements',  # "Name [spaces/other] Achievements"
            r'contact\s+.*\s+info',  # Contact info headers
        ]
        
        for i, line in enumerate(lines[:15]):  # Check first 15 lines
            line_lower = line.lower().strip()
            
            # Skip lines that are clearly not names
            if line_lower in skip_keywords:
                continue
            
            # Skip lines matching header patterns
            if any(re.match(pattern, line_lower) for pattern in skip_patterns):
                continue
                
            # Skip lines with email addresses (but allow if we can extract name part)
            has_email = '@' in line
            has_phone = bool(re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', line))
            
            # Skip if it has email/phone but we can't extract a meaningful name part
            if has_email or has_phone:
                # Try to extract name before contact info
                temp_name = line
                
                # Remove phone number
                phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
                temp_name = re.sub(phone_pattern, '', temp_name).strip()
                
                # Remove email
                email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
                temp_name = re.sub(email_pattern, '', temp_name).strip()
                
                # If what's left is too short or has too many digits, skip
                if len(temp_name) < 3 or len([c for c in temp_name if c.isdigit()]) > 2:
                    continue
                
            # Skip lines that are too long (likely descriptions or headers)
            if len(line) > 60:
                continue
                
            # Skip all caps lines that are too long (section headers)
            if line.isupper() and len(line) > 25:
                continue
            
            # Skip lines that start with bullets or common resume elements
            if line.startswith(('•', '●', '■', '-', '*', '►')):
                continue
                
            # Clean potential name
            cleaned = line.strip()
            
            # Remove common prefixes
            prefixes_to_remove = ["Name:", "Name :", "CONTACT ", "Full Name:", "Candidate Name:"]
            for prefix in prefixes_to_remove:
                if cleaned.upper().startswith(prefix.upper()):
                    cleaned = cleaned[len(prefix):].strip()
            
            # Handle cases where name and contact info are on the same line
            # Extract just the name part before phone/email
            name_part = cleaned
            
            # If line contains phone number, extract name before it
            phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
            phone_match = re.search(phone_pattern, cleaned)
            if phone_match:
                # Take everything before the phone number
                name_part = cleaned[:phone_match.start()].strip()
            
            # If line contains email, extract name before it  
            email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
            email_match = re.search(email_pattern, cleaned)
            if email_match:
                # Take everything before the email
                name_part = cleaned[:email_match.start()].strip()
            
            # Clean underscores and extra whitespace
            name_part = name_part.replace('_', ' ')
            name_part = ' '.join(name_part.split())  # Normalize whitespace
            
            # Check if it looks like a name
            words = name_part.split()
            if 1 <= len(words) <= 5:  # Allow up to 5 words for complex names
                # At least 60% alphabetic characters (excluding spaces)
                alpha_ratio = sum(c.isalpha() or c.isspace() for c in name_part) / max(len(name_part), 1)
                
                # Additional name validation
                if (alpha_ratio > 0.6 and 
                    len(name_part) >= 3 and  # Minimum length
                    not name_part.lower().startswith(('the ', 'a ', 'an ')) and  # Not articles
                    not any(word.lower() in ['university', 'college', 'institute', 'school', 'company'] for word in words)):  # Not institution names
                    
                    # Final check: make sure it's not a section header
                    if not any(section in name_part.lower() for section in 
                              ['experience', 'education', 'skills', 'projects', 'achievements', 'certifications']):
                        return name_part
        
        return ""

    def _extract_email(self, text: str) -> str:
        match = self.EMAIL_PATTERN.search(text)
        return match.group(0) if match else ""

    def _extract_phone(self, text: str) -> str:
        match = self.PHONE_PATTERN.search(text)
        return match.group(0) if match else ""

    def _extract_url(self, text: str, domain: str) -> str:
        pattern = rf'(https?://(?:www\.)?{re.escape(domain)}/[^\s]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if not match:
            # Try without http
            pattern = rf'(?:www\.)?{re.escape(domain)}/[^\s]+'
            match = re.search(pattern, text, re.IGNORECASE)
        return match.group(0) if match else ""

    def _extract_comprehensive_skills(self, text: str, sections: Dict[str, str], experiences: List[Dict]) -> List[str]:
        """Comprehensive skill extraction with normalization and deduplication."""
        found_skills = set()
        
        # 1. Extract from skills section if available
        skills_text = sections.get("skills", "")
        if skills_text:
            found_skills.update(self._extract_skills_from_text(skills_text))
        
        # 2. Extract from experience technologies
        for exp in experiences:
            techs = exp.get("technologies", [])
            found_skills.update(techs)
        
        # 3. Extract from full text
        found_skills.update(self._extract_skills_from_text(text))
        
        # 4. Normalize and deduplicate
        normalized_skills = self._normalize_skills(found_skills)
        
        return sorted(list(normalized_skills))

    def _extract_skills_from_text(self, text: str) -> Set[str]:
        """Extract skills from text using multiple strategies."""
        found_skills = set()
        text_lower = text.lower()
        
        # Tokenize and clean
        # Preserve special characters in skills like C++, C#, .NET
        tokens = re.findall(r'[\w\+#\.]+', text)
        tokens_lower = [t.lower() for t in tokens]
        
        # 1. Exact matching (case-insensitive)
        for token in tokens:
            mapped = map_skill(token)
            if mapped in self.standard_skills:
                found_skills.add(mapped)
        
        # 2. Multi-word skills (bigrams and trigrams)
        words = text_lower.split()
        
        # Bigrams
        for i in range(len(words) - 1):
            bigram = f"{words[i]} {words[i+1]}"
            mapped = map_skill(bigram)
            if mapped in self.standard_skills:
                found_skills.add(mapped)
        
        # Trigrams
        for i in range(len(words) - 2):
            trigram = f"{words[i]} {words[i+1]} {words[i+2]}"
            mapped = map_skill(trigram)
            if mapped in self.standard_skills:
                found_skills.add(mapped)
        
        # 3. Fuzzy matching for slight misspellings (only for longer skills)
        if process and fuzz:
            long_skills = [s for s in self.skills_list if len(s) > 4]
            unique_tokens = set(tokens_lower)
            
            for token in unique_tokens:
                if len(token) > 4:
                    match = process.extractOne(token, long_skills, scorer=fuzz.ratio)
                    if match and match[1] >= 85:  # 85% similarity threshold
                        found_skills.add(match[0])
        
        # 4. Check for common skill patterns
        self._extract_skill_patterns(text, found_skills)
        
        return found_skills

    def _extract_skill_patterns(self, text: str, skills_set: Set[str]):
        """Extract skills using common patterns."""
        # Pattern: "experienced in X, Y, and Z"
        pattern1 = re.compile(r'(?:experienced in|proficient in|skilled in|expertise in|knowledge of)[\s:]+([^.;]+)', re.IGNORECASE)
        matches = pattern1.findall(text)
        
        for match in matches:
            # Split by commas and 'and'
            items = re.split(r'[,&]|\band\b', match)
            for item in items:
                cleaned = item.strip()
                if cleaned:
                    mapped = map_skill(cleaned)
                    if mapped in self.standard_skills:
                        skills_set.add(mapped)
        
        # Pattern: "Skills: X, Y, Z"
        pattern2 = re.compile(r'skills?[\s:]+([^.;]+)', re.IGNORECASE)
        matches = pattern2.findall(text)
        
        for match in matches:
            items = re.split(r'[,|•●]', match)
            for item in items:
                cleaned = item.strip().lstrip('-–—*►▪ ')
                if cleaned:
                    mapped = map_skill(cleaned)
                    if mapped in self.standard_skills:
                        skills_set.add(mapped)

    def _normalize_skills(self, skills: Set[str]) -> Set[str]:
        """Normalize and deduplicate skills."""
        normalized = set()
        seen_lower = set()
        
        for skill in skills:
            # Map through standardization
            mapped = map_skill(skill)
            
            # Avoid duplicates (case-insensitive)
            if mapped.lower() not in seen_lower:
                normalized.add(mapped)
                seen_lower.add(mapped.lower())
        
        return normalized




    def _intelligent_section_split(self, text: str) -> Dict[str, str]:
        """Split resume into sections using strict pattern matching and boundary detection."""
        sections = defaultdict(str)
        lines = text.split('\n')
        
        current_section = None
        buffer = []
        
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            if not line_stripped:
                continue
            
            # Check if this line is a section header
            matched_section = None
            
            # Only consider lines under 80 chars as potential headers and not URLs
            if len(line_stripped) < 80 and not self.URL_PATTERN.match(line_stripped):
                for section_name, pattern in self.SECTION_PATTERNS.items():
                    if pattern.match(line_stripped):
                        matched_section = section_name
                        break
            
            if matched_section:
                # Save previous section (excluding the header line itself)
                if current_section and buffer:
                    sections[current_section] = '\n'.join(buffer)
                
                # Start new section
                current_section = matched_section
                buffer = []
            elif current_section:
                # Add line to current section buffer
                buffer.append(line_stripped)
        
        # Save last section
        if current_section and buffer:
            sections[current_section] = '\n'.join(buffer)
        
        return dict(sections)

    def _extract_structured_experience(self, exp_text: str) -> List[Dict[str, Any]]:
        """Extract structured experience with detailed parsing."""
        if not exp_text.strip():
            return []
        
        # Split into experience blocks (separated by double newlines or clear separators)
        blocks = self._split_experience_blocks(exp_text)
        experiences = []
        
        for block in blocks:
            if not block.strip():
                continue
            
            exp_entry = self._parse_experience_block(block)
            if exp_entry.get("company") or exp_entry.get("designation"):
                experiences.append(exp_entry)
        
        return experiences

    def _split_experience_blocks(self, text: str) -> List[str]:
        """Split experience text into individual job blocks."""
        lines = text.split('\n')
        blocks = []
        current_block = []
        
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            if not line_stripped:
                continue
            
            # Check if this line looks like a new company header
            is_new_company = False
            
            # Pattern 1: Company – Designation - Duration
            if self.COMPANY_HEADER_PATTERN.match(line_stripped):
                is_new_company = True
            
            # Pattern 2: Bullet point followed by company/role name (•Product Development Team-)
            elif re.match(r'^[•●■–—*►▪\-]\s*([A-Z][a-zA-Z0-9\s\-&:.,()]+)[-–—]\s*$', line_stripped):
                is_new_company = True
                logger.debug("Detected bullet company header: %s", line_stripped)
            
            # Pattern 3: Line contains company indicators (Ltd, Inc, etc.)
            elif len(line_stripped) < 150 and any(ind in line_stripped.lower() for ind in 
                ["pvt", "ltd", "inc", "llc", "corp", "limited", "services", "technologies", "solutions"]):
                # Make sure it's not a bullet point continuation
                if not line_stripped.startswith('•') and not line_stripped.startswith('-') and not line_stripped.startswith('*'):
                    is_new_company = True
            
            # Pattern 4: Date range pattern indicates a new role
            elif self.DATE_RANGE_PATTERN.search(line_stripped):
                # Usually dates are on the same line as the company/role or the next line.
                # If it's a short line with a date, or starts with a date, it might be a new entry.
                if len(line_stripped) < 100 and not line_stripped.startswith('•') and not line_stripped.startswith('-'):
                    is_new_company = True
            
            # Pattern 5: Standalone role/company names (not bullets, reasonable length)
            elif (len(line_stripped) < 80 and 
                  not line_stripped.startswith(('•', '-', '–', '—', 'http', 'www', 'link')) and
                  len(line_stripped.split()) <= 6 and
                  any(c.isupper() for c in line_stripped) and
                  not line_stripped.lower().startswith(('developed', 'built', 'created', 'implemented')) and
                  not re.search(r'https?://|www\.', line_stripped)):  # Don't treat URLs as companies
                # Could be a company/role line - check if it looks professional
                words = line_stripped.split()
                if (len(words) >= 2 and 
                    any(word in line_stripped.lower() for word in ['team', 'developer', 'engineer', 'manager', 'analyst', 'lead']) or
                    any(word.endswith('-') for word in words)):  # "Product Development Team-"
                    is_new_company = True
                    logger.debug("Detected standalone company/role header: %s", line_stripped)
            
            if is_new_company and current_block:
                # Save the previous block
                blocks.append('\n'.join(current_block))
                current_block = [line_stripped]
            else:
                current_block.append(line_stripped)
        
        # Don't forget the last block
        if current_block:
            blocks.append('\n'.join(current_block))
        
        return blocks

    def _parse_experience_block(self, block: str) -> Dict[str, Any]:
        """Parse a single experience block into structured data with boundary detection."""
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines:
            return {}
        
        entry = {
            "company": "",
            "designation": "",
            "duration": "",
            "location": "",
            "start_date": "",
            "end_date": "",
            "experience_years": 0.0,
            "responsibilities": [],
            "technologies": []
        }
        
        # Process lines but stop at section boundaries
        processed_lines = []
        for line in lines:
            if self._is_section_boundary(line):
                break
            processed_lines.append(line)
        
        if not processed_lines:
            return {}
        
        # Try to parse Company – Designation - Duration pattern first
        first_line = processed_lines[0]
        company_match = self.COMPANY_HEADER_PATTERN.match(first_line)
        
        # Also check for bullet + company pattern (•Product Development Team-)
        bullet_company_match = re.match(r'^[•●■–—*►▪\-]\s*([A-Z][a-zA-Z0-9\s\-&:.,()]+?)[-–—]\s*$', first_line)
        
        if company_match:
            entry["company"] = company_match.group(1).strip()
            entry["designation"] = company_match.group(2).strip()
            duration_str = company_match.group(3).strip()
            entry["duration"] = duration_str
            
            # Extract years from duration string
            duration_match = self.DURATION_PATTERN.search(duration_str)
            if duration_match:
                value = float(duration_match.group(1))
                unit = duration_match.group(2).lower()
                entry["experience_years"] = value if 'year' in unit or 'yr' in unit else value / 12
            
            start_idx = 1
        elif bullet_company_match:
            # Handle •Product Development Team- format
            company_name = bullet_company_match.group(1).strip()
            entry["company"] = company_name
            entry["designation"] = "Team Member"  # Default designation
            logger.debug("Parsed bullet company format: %s", company_name)
            start_idx = 1
        else:
            # Fallback: first line is company, second is designation (with safeguards)
            comp_candidate = processed_lines[0]
            is_invalid_comp = (
                len(comp_candidate) > 60 or 
                self.URL_PATTERN.match(comp_candidate) or 
                comp_candidate.startswith('-') or
                comp_candidate.startswith('•') or
                comp_candidate.lower().startswith('http')
            )
            
            if is_invalid_comp:
                # If first line looks like a bullet or URL, we probably don't have a clean header
                start_idx = 0
            else:
                entry["company"] = comp_candidate
                if len(processed_lines) > 1:
                    desig_candidate = processed_lines[1]
                    is_invalid_desig = (
                        len(desig_candidate) > 60 or 
                        self.URL_PATTERN.match(desig_candidate) or 
                        desig_candidate.startswith('-') or
                        desig_candidate.startswith('•') or
                        desig_candidate.lower().startswith('http')
                    )
                    
                    if is_invalid_desig:
                        start_idx = 1
                    else:
                        entry["designation"] = desig_candidate
                        start_idx = 2
                else:
                    start_idx = 1
        
        # Extract dates from the entire block
        date_info = self._extract_date_info('\n'.join(processed_lines))
        if date_info:
            entry["start_date"] = date_info.get("start_date", "")
            entry["end_date"] = date_info.get("end_date", "")
            # Only use calculated years if not already set from duration
            if entry["experience_years"] == 0:
                entry["experience_years"] = date_info.get("years", 0.0)
            if not entry["duration"]:
                years = date_info.get("years", 0)
                entry["duration"] = f"{years} years" if years else ""
        
        # Extract location (look for city/state patterns)
        location = self._extract_location('\n'.join(processed_lines))
        if location:
            entry["location"] = location
        
        # Parse responsibilities and technologies
        responsibilities = []
        technologies = set()
        
        # Skip lines that look like metadata (location, dates)
        skip_patterns = [
            r'^[A-Z][a-z]+,\s*[A-Z]',  # City, State
            r'^\w{3}\s+\d{4}\s*[-–—]',  # Date ranges
            r'^\d{2}/\d{4}\s*[-–—]',   # MM/YYYY ranges
        ]
        
        for line in processed_lines[start_idx:]:
            # Skip empty or very short lines
            if len(line) < 5:
                continue
            
            # Skip metadata lines
            skip_line = False
            for pattern in skip_patterns:
                if re.match(pattern, line):
                    skip_line = True
                    break
            
            if skip_line:
                continue
            
            # Check if line is a bullet point or responsibility
            cleaned_line = line.lstrip('•●■-–—*►▪ ').strip()
            
            # Skip if it starts with "Technologies:" - we'll extract those separately
            if cleaned_line.lower().startswith('technologies:'):
                # Extract technologies from this line
                tech_str = cleaned_line[13:].strip()  # Remove "Technologies:"
                tech_items = re.split(r'[,;]', tech_str)
                for tech in tech_items:
                    tech_clean = tech.strip()
                    if tech_clean:
                        mapped = map_skill(tech_clean)
                        if mapped:
                            technologies.add(mapped)
                continue
            
            if cleaned_line and len(cleaned_line) > 10:
                responsibilities.append(cleaned_line)
                
                # Extract technologies from this line
                line_techs = self._extract_technologies_from_text(cleaned_line)
                technologies.update(line_techs)
        
        entry["responsibilities"] = responsibilities[:15]  # Limit to 15 items
        entry["technologies"] = sorted(list(technologies))
        
        return entry

    def _extract_date_info(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract start date, end date, and calculate duration."""
        # Look for date ranges
        match = self.DATE_RANGE_PATTERN.search(text)
        
        if match:
            start_str = match.group(1)
            end_str = match.group(2)
            
            start_year = self._extract_year_from_date(start_str)
            
            is_current = end_str.lower() in ['present', 'current', 'now']
            end_year = self.current_year if is_current else self._extract_year_from_date(end_str)
            
            years = max(0, end_year - start_year) if start_year and end_year else 0
            
            return {
                "start_date": start_str,
                "end_date": "Present" if is_current else end_str,
                "years": years
            }
        
        # Look for explicit duration mentions (e.g., "5 years", "18 months")
        duration_match = self.DURATION_PATTERN.search(text)
        if duration_match:
            value = float(duration_match.group(1))
            unit = duration_match.group(2).lower()
            
            years = value if 'year' in unit or 'yr' in unit else value / 12
            
            return {
                "start_date": "",
                "end_date": "",
                "years": round(years, 1)
            }
        
        return None

    def _extract_year_from_date(self, date_str: str) -> Optional[int]:
        """Extract year from various date formats."""
        year_match = self.YEAR_PATTERN.search(date_str)
        if year_match:
            return int(year_match.group(1))
        return None

    def _extract_location(self, text: str) -> str:
        """Extract location from text (city, state, country)."""
        # Common location patterns
        # Pattern 1: City, State/Country on its own line (e.g., "Bangalore, India")
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            # Look for City, State pattern
            match = re.match(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$', line)
            
            if match:
                city, state = match.groups()
                # Filter out false positives
                skip_words = {"years", "months", "present", "current", "experience", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"}
                if city.lower() not in skip_words and state.lower() not in skip_words and len(line) < 50:
                    return f"{city}, {state}"
        
        return ""

    def _is_section_boundary(self, line: str) -> bool:
        """Check if a line is a section header that should terminate current section parsing."""
        line_stripped = line.strip()
        
        # Don't consider URLs as section boundaries
        if self.URL_PATTERN.match(line_stripped):
            return False
        
        # Only consider reasonably short lines as potential headers
        if len(line_stripped) > 80:
            return False
        
        # Check against all section patterns
        for pattern in self.SECTION_PATTERNS.values():
            if pattern.match(line_stripped):
                return True
        
        return False

    def _extract_technologies_from_text(self, text: str) -> Set[str]:
        """Extract technology names from a text line."""
        technologies = set()
        text_lower = text.lower()
        
        # Check against known tech keywords
        for tech in self.TECH_KEYWORDS:
            if tech in text_lower:
                # Map to standardized skill name
                mapped = map_skill(tech)
                if mapped:
                    technologies.add(mapped)
        
        # Also check against standard skills
        for skill in self.skills_list:
            if len(skill) > 2 and skill.lower() in text_lower:
                technologies.add(skill)
        
        return technologies

    def _extract_structured_education(self, edu_text: str) -> List[Dict[str, Any]]:
        """Extract structured education entries."""
        if not edu_text.strip():
            return []
        
        blocks = re.split(r'\n\s*\n', edu_text)
        education_list = []
        
        for block in blocks:
            if not block.strip():
                continue
            
            entry = self._parse_education_block(block)
            if entry.get("degree") or entry.get("institution"):
                education_list.append(entry)
        
        return education_list

    def _parse_education_block(self, block: str) -> Dict[str, Any]:
        """Parse a single education block."""
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines:
            return {}
        
        entry = {
            "degree": "",
            "institution": "",
            "university": "",
            "specialization": "",
            "location": "",
            "graduation_year": ""
        }
        
        # Common degree patterns
        degree_patterns = [
            r'\b(B\.?S\.?|Bachelor|B\.?Tech|B\.?E\.?|M\.?S\.?|Master|M\.?Tech|M\.?B\.?A\.?|Ph\.?D\.?|Doctorate)\b',
            r'\b(Associate|Diploma|Certificate)\b'
        ]
        
        # Try to identify degree and institution
        for i, line in enumerate(lines[:3]):  # Check first 3 lines
            # Check if line contains a degree
            for pattern in degree_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    entry["degree"] = line
                    # Next line might be institution
                    if i + 1 < len(lines):
                        entry["institution"] = lines[i + 1]
                    break
            
            # Check if line contains university/college
            if any(keyword in line.lower() for keyword in ['university', 'college', 'institute', 'school']):
                if not entry["institution"]:
                    entry["institution"] = line
                else:
                    entry["university"] = line
        
        # Extract graduation year
        years = self.YEAR_PATTERN.findall(block)
        if years:
            entry["graduation_year"] = years[-1]  # Most recent year
        
        # Extract location
        location = self._extract_location(block)
        if location:
            entry["location"] = location
        
        # Look for specialization
        spec_keywords = ["major", "specialization", "concentration", "focus"]
        for line in lines:
            for keyword in spec_keywords:
                if keyword in line.lower():
                    entry["specialization"] = line
                    break
        
        return entry

    def _extract_certifications(self, cert_text: str) -> List[str]:
        """Extract individual certifications."""
        if not cert_text.strip():
            return []
        
        certifications = []
        lines = [l.strip() for l in cert_text.split('\n') if l.strip()]
        
        for line in lines:
            # Remove bullet points
            cleaned = line.lstrip('•●■-–—*►▪ ').strip()
            
            # Skip if too short or too long
            if 5 < len(cleaned) < 150:
                certifications.append(cleaned)
        
        return certifications

    def _extract_structured_projects(self, proj_text: str) -> List[Dict[str, Any]]:
        """Extract structured project entries with enhanced boundary detection and state machine approach."""
        if not proj_text.strip():
            return []
        
        projects = []
        lines = [l.strip() for l in proj_text.split('\n') if l.strip()]
        
        current_project = None
        state = "SEEKING_PROJECT"  # SEEKING_PROJECT, IN_PROJECT, COLLECTING_TECH
        detected_projects = []  # For logging
        i = 0
        
        logger.info("Starting project extraction from text with %d lines", len(lines))
        
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip empty lines and decorative characters
            if not line or line in ['–', '•', '▪', '■', '-', '*', '=']:
                i += 1
                continue
            
            # Check if this line terminates project collection (section header)
            if self._is_terminating_section(line):
                logger.debug("Hit section terminator: %s", line)
                break
            
            # Enhanced project title detection with immediate boundary enforcement
            if self._is_enhanced_project_title(line):
                # Log detected project
                clean_title = line.lstrip('•●■-–—*►▪ ').strip()
                detected_projects.append(clean_title)
                logger.debug("Detected project title: '%s'", clean_title)
                
                # IMMEDIATELY close previous project if it exists
                if current_project:
                    logger.debug("Closing previous project: '%s'", current_project.get("title", "Unknown"))
                    finalized = self._finalize_project(current_project)
                    if finalized:  # Only add if finalization succeeded
                        projects.append(finalized)
                
                # Start new project
                current_project = self._create_new_project(line)
                state = "IN_PROJECT"
                i += 1
                continue
            
            # Handle technology indicators
            tech_match = self.TECH_INDICATORS.match(line)
            if tech_match and current_project is not None:
                state = "COLLECTING_TECH"
                tech_text = line[tech_match.end():].strip()
                if tech_text:
                    current_project["technologies"].extend(self._parse_technology_line(tech_text))
                i += 1
                continue
            
            # If collecting technologies, continue until new project or section
            if state == "COLLECTING_TECH":
                if self._is_enhanced_project_title(line):
                    # New project detected, restart the loop to handle it properly
                    continue  # Let the next iteration handle this as a project title
                elif self._is_terminating_section(line):
                    break
                else:
                    # Continue collecting technologies
                    if current_project is not None:
                        current_project["technologies"].extend(self._parse_technology_line(line))
                i += 1
                continue
            
            # Check if this line contains a URL (extract and don't add to description)
            url = self._extract_project_url(line)
            if url and current_project:
                current_project["project_link"] = url
                logger.debug("Extracted project URL: %s", url)
                i += 1
                continue
            
            # Add line to current project description
            if current_project is not None and state == "IN_PROJECT":
                cleaned_line = line.lstrip('•●■-–—*►▪ ').strip()
                if cleaned_line and len(cleaned_line) > 3:
                    current_project["description"].append(cleaned_line)
            
            i += 1
        
        # Finalize the last project
        if current_project:
            finalized = self._finalize_project(current_project)
            if finalized:  # Only add if finalization succeeded
                projects.append(finalized)
        
        # Log all detected projects for verification
        if detected_projects:
            logger.info("Detected Projects:")
            for idx, project_title in enumerate(detected_projects, 1):
                logger.info("- %s", project_title)
        else:
            logger.warning("No projects detected in the projects section")
        
        logger.info("Successfully extracted %d projects", len(projects))
        return projects

    def _is_enhanced_project_title(self, line: str) -> bool:
        """Enhanced project title detection with comprehensive heuristics."""
        line = line.strip()
        
        # Skip if line is too short or too long
        if len(line) < 3 or len(line) > 200:
            return False
        
        # Skip if it's clearly a description continuation (starts with action verbs)
        action_verbs = ['developed', 'built', 'created', 'implemented', 'designed', 
                       'used', 'uses', 'integrated', 'worked', 'collaborated', 'managed',
                       'led', 'responsible', 'achieved', 'delivered', 'utilized',
                       'coordinated', 'maintained', 'deployed', 'configured',
                       'optimized', 'enhanced', 'automated', 'migrated', 'established',
                       'includes', 'contains', 'features', 'provides', 'supports']
        
        if line.lower().startswith(tuple(action_verbs)):
            return False
        
        # Skip if it's a technology line
        if self.TECH_INDICATORS.match(line):
            return False
        
        # Skip if it starts with lowercase (likely continuation)
        if line[0].islower():
            return False
            
        # Skip if line starts with bullet and continues with action verb
        bullet_action_pattern = r'^[•●■–—*►▪\-]\s*(developed|built|created|implemented|designed|used|integrated|managed|led|coordinated|maintained|deployed|configured|optimized|enhanced|automated|migrated|established)'
        if re.match(bullet_action_pattern, line, re.IGNORECASE):
            return False
        
        # PATTERN 1: Bullet + Title Case project name (•AI-Driven Diagnostics For Health Innovation)
        bullet_match = re.match(r'^[•●■–—*►▪\-]\s*([A-Z][a-zA-Z0-9\s\-&:.,()]+)', line)
        if bullet_match:
            title_part = bullet_match.group(1).strip()
            # Make sure it's not a description bullet
            if not title_part.lower().startswith(tuple(action_verbs)) and self._has_title_case_pattern(title_part):
                logger.debug("Matched bullet + title pattern: %s", line)
                return True
        
        # PATTERN 2: Contains project-related keywords (but must be title-like, not in sentence)
        project_keywords = ['project', 'mini-project', 'application', 'platform', 'system', 
                           'portal', 'website', 'app', 'tool', 'dashboard', 'framework']
        line_lower = line.lower()
        
        # Only if it appears to be a title (not in a sentence)
        if any(keyword in line_lower for keyword in project_keywords):
            # Must not be a sentence (not end with period, not have "the" or "a" at start)
            if (not line.endswith('.') and 
                not line_lower.startswith(('the ', 'a ', 'an ')) and
                (self._has_title_case_pattern(line) or line.startswith(('•', '●', '■', '–', '—', '*', '►', '▪', '-')))):
                logger.debug("Matched project keyword pattern: %s", line)
                return True
        
        # PATTERN 3: Contains semester markers like [Sem-VI] or (Semester 6)
        if re.search(r'\[Sem-[IVX]+\]|\(Semester\s+\d+\)|Semester\s+[IVX0-9]+', line, re.IGNORECASE):
            logger.debug("Matched semester marker pattern: %s", line)
            return True
        
        # PATTERN 4: Line followed by URL pattern (check next lines if available)
        if self._contains_or_followed_by_url(line):
            logger.debug("Matched URL-associated pattern: %s", line)
            return True
        
        # PATTERN 5: Strong Title Case pattern (multiple capitalized words) 
        # BUT must be reasonably short and not look like a sentence
        if (self._has_strong_title_case(line) and 
            not line.endswith('.') and 
            len(line.split()) <= 8 and
            not line_lower.startswith(('the ', 'a ', 'an '))):
            logger.debug("Matched strong title case pattern: %s", line)
            return True
        
        # PATTERN 6: ALL CAPS project names (but not too long to avoid headers)
        if line.isupper() and 5 <= len(line) <= 50:
            # Make sure it's not a section header by checking common patterns
            section_indicators = ['experience', 'education', 'skills', 'projects', 'work', 'employment', 'qualifications']
            if not any(header in line.lower() for header in section_indicators):
                logger.debug("Matched ALL CAPS pattern: %s", line)
                return True
        
        # PATTERN 7: Contains URL directly in the line
        if re.search(r'https?://[^\s]+|www\.[^\s]+', line):
            # Extract the non-URL part and check if it looks like a title
            title_part = re.sub(r'\s*(https?://[^\s]+|www\.[^\s]+)\s*', '', line).strip()
            if (title_part and 
                self._has_title_case_pattern(title_part) and
                not title_part.lower().startswith(tuple(action_verbs))):
                logger.debug("Matched title with embedded URL pattern: %s", line)
                return True
        
        # PATTERN 8: Technical/Feature-based project titles 
        # Lines that describe specific technical implementations or features
        feature_indicators = [
            'activity-based', 'web-based', 'cloud-based', 'ai-powered', 'ml-based',
            'real-time', 'automated', 'intelligent', 'smart', 'adaptive',
            'recommendation', 'prediction', 'detection', 'analysis', 'monitoring',
            'tracking', 'management', 'optimization', 'visualization'
        ]
        
        # Check if line contains technical feature indicators and has project-like structure
        if any(indicator in line_lower for indicator in feature_indicators):
            # Must be reasonably long (indicating a substantial description)
            # Must contain "using" or "with" (indicating technology stack)
            # Must not end with period (not a complete sentence)
            # Must not start with common continuation words
            continuation_starters = ['uses', 'includes', 'contains', 'features', 'provides', 'supports']
            if (len(line) > 60 and  # Increased from 40 to 60 to be more selective
                any(tech_word in line_lower for tech_word in ['using', 'with', 'via', 'through']) and
                not line.endswith('.') and
                not line_lower.startswith(tuple(continuation_starters)) and
                # Must have some capital letters (not all lowercase)
                any(c.isupper() for c in line) and
                # Should contain multiple technical terms or be multi-component
                (sum(indicator in line_lower for indicator in feature_indicators) >= 1)):
                logger.debug("Matched technical feature pattern: %s", line)
                return True
        
        # PATTERN 9: Multi-component project titles (separated by "and")
        # "Component A and Component B" or "Feature X and Feature Y"
        if ' and ' in line and not line.endswith('.'):
            components = line.split(' and ')
            if (len(components) == 2 and 
                all(len(comp.strip()) > 10 for comp in components) and
                # At least one component should have capital letters
                any(any(c.isupper() for c in comp) for comp in components)):
                logger.debug("Matched multi-component project pattern: %s", line)
                return True
        
        return False
    
    def _has_title_case_pattern(self, text: str) -> bool:
        """Check if text has proper title case pattern (multiple capitalized words)."""
        if not text:
            return False
            
        words = text.split()
        if len(words) < 2:
            return len(words) == 1 and len(text) > 3 and text[0].isupper()
        
        # Count words that start with capital letters (ignoring common small words)
        small_words = {'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'}
        capital_words = 0
        
        for i, word in enumerate(words):
            # First and last words should always be capitalized
            if i == 0 or i == len(words) - 1:
                if word and word[0].isupper():
                    capital_words += 1
            # Small words can be lowercase unless they're first/last
            elif word.lower() in small_words:
                capital_words += 0.5  # Give partial credit
            # Other words should be capitalized
            elif word and word[0].isupper():
                capital_words += 1
        
        # Require at least 50% capitalization rate
        return capital_words / len(words) >= 0.5
    
    def _has_strong_title_case(self, text: str) -> bool:
        """Check for very strong title case indicators."""
        words = text.split()
        if len(words) < 2:
            return False
            
        # Must have at least 2 capitalized words and no more than 8 words total
        if len(words) > 8:
            return False
            
        capital_count = sum(1 for word in words if word and word[0].isupper() and len(word) > 1)
        return capital_count >= 2 and capital_count / len(words) >= 0.6
    
    def _contains_or_followed_by_url(self, line: str) -> bool:
        """Check if line contains URL or is likely to be followed by one."""
        # Direct URL check
        if re.search(r'https?://|www\.', line):
            return True
        
        # Project names often have URLs on next line - this is a heuristic
        # We can't check next line here easily, but we can look for URL indicators
        return False

    def _is_terminating_section(self, line: str) -> bool:
        """Check if line indicates a new section that should terminate project parsing."""
        line_lower = line.lower().strip()
        
        # Check against known terminators
        for terminator in self.PROJECT_TERMINATORS:
            if line_lower == terminator or line_lower == terminator + ':':
                return True
        
        # Check against section patterns
        return self._is_section_boundary(line)

    def _create_new_project(self, title_line: str) -> Dict[str, Any]:
        """Create a new project object from a title line with enhanced URL and location handling."""
        # Extract clean title (remove bullets, etc.)
        clean_title = title_line.lstrip('•●■-–—*►▪ ').strip()
        
        # Extract URL if present in title line
        extracted_url = self._extract_project_url(clean_title)
        
        # Remove URL from title
        if extracted_url:
            clean_title = re.sub(r'\s*(https?://[^\s]+|www\.[^\s]+|Link:\s*[^\s]+|URL:\s*[^\s]+)\s*', ' ', clean_title).strip()
        
        # Handle "Project Name - Location" pattern  
        project_link = extracted_url
        if ' - ' in clean_title:
            parts = clean_title.split(' - ')
            if len(parts) == 2 and self._looks_like_location(parts[1]):
                clean_title = parts[0].strip()
        
        # Handle semester markers - keep them as part of title or extract
        # Example: "Student-Faculty Ratio Application [Sem-VI]" -> keep as is
        
        # Remove any remaining extra whitespace
        clean_title = re.sub(r'\s+', ' ', clean_title).strip()
        
        return {
            "title": clean_title,
            "description": [],
            "technologies": [],
            "project_link": project_link,
            "duration": ""
        }

    def _looks_like_location(self, text: str) -> bool:
        """Check if text looks like a location (City, State)."""
        # Simple heuristic: contains comma and has 2-3 words
        if ',' in text:
            parts = [p.strip() for p in text.split(',')]
            return len(parts) == 2 and all(len(p) > 1 and p[0].isupper() for p in parts)
        return False

    def _extract_project_url(self, line: str) -> str:
        """Enhanced project URL extraction that preserves URLs separately from descriptions."""
        line = line.strip()
        
        # Pattern 1: Full URLs with protocols
        url_match = re.search(r'https?://[^\s]+', line)
        if url_match:
            return url_match.group(0)
        
        # Pattern 2: www. URLs without protocol
        www_match = re.search(r'www\.[^\s]+', line)
        if www_match:
            url = www_match.group(0)
            return f"https://{url}" if not url.startswith('http') else url
        
        # Pattern 3: "Link:" or "Link -" prefix pattern
        if line.lower().startswith('link'):
            # Handle "Link - URL" or "Link: URL" patterns
            url_part = re.sub(r'^link\s*[-:]\s*', '', line, flags=re.IGNORECASE).strip()
            if url_part:
                if url_part.startswith(('http://', 'https://')):
                    return url_part
                else:
                    return f"https://{url_part}"
        
        # Pattern 4: "URL:" prefix pattern  
        if line.lower().startswith('url:'):
            url_part = line[4:].strip()
            if url_part:
                if url_part.startswith(('http://', 'https://')):
                    return url_part
                else:
                    return f"https://{url_part}"
        
        # Pattern 5: Common project hosting platforms without protocol
        platform_patterns = [
            r'([a-zA-Z0-9\-]+\.netlify\.app[^\s]*)',
            r'([a-zA-Z0-9\-]+\.vercel\.app[^\s]*)',
            r'([a-zA-Z0-9\-]+\.herokuapp\.com[^\s]*)',
            r'([a-zA-Z0-9\-]+\.github\.io[^\s]*)',
            r'([a-zA-Z0-9\-]+\.firebaseapp\.com[^\s]*)',
        ]
        
        for pattern in platform_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                return f"https://{match.group(1)}"
        
        return ""

    def _parse_technology_line(self, line: str) -> List[str]:
        """Parse technologies from a line of text."""
        technologies = []
        
        # Split by common separators
        tech_parts = re.split(r'[,;&|]', line)
        
        for part in tech_parts:
            tech = part.strip()
            if tech and len(tech) > 1:
                # Map to standard skill if possible
                mapped = map_skill(tech)
                technologies.append(mapped if mapped in self.standard_skills else tech)
        
        return technologies

    def _finalize_project(self, project: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Finalize a project by cleaning up and validating data."""
        # Ensure we have a title
        if not project or not project.get("title"):
            logger.debug("Skipping project with no title: %s", project)
            return None
        
        # Clean description array - remove any lines that are just URLs
        if isinstance(project["description"], list):
            cleaned_descriptions = []
            for desc in project["description"]:
                # Skip if this line is just a URL
                if re.match(r'^\s*(https?://[^\s]+|www\.[^\s]+|Link:\s*[^\s]+)\s*$', desc, re.IGNORECASE):
                    # Extract URL if we don't have a project link yet
                    if not project.get("project_link"):
                        url = self._extract_project_url(desc)
                        if url:
                            project["project_link"] = url
                    continue
                
                # Remove URLs from description lines but keep the rest
                cleaned_desc = re.sub(r'\s*(https?://[^\s]+|www\.[^\s]+)\s*', ' ', desc).strip()
                if cleaned_desc and len(cleaned_desc) > 3:
                    cleaned_descriptions.append(cleaned_desc)
            
            project["description"] = cleaned_descriptions
        
        # Deduplicate technologies
        if project["technologies"]:
            project["technologies"] = list(dict.fromkeys(project["technologies"]))  # Preserve order
        
        # Extract additional technologies from description if technologies list is empty
        if not project["technologies"] and project["description"]:
            desc_text = " ".join(project["description"]) if isinstance(project["description"], list) else project["description"]
            extracted_techs = self._extract_technologies_from_text(desc_text)
            project["technologies"] = sorted(list(extracted_techs))
        
        # Ensure project_link is properly formatted
        if project.get("project_link"):
            link = project["project_link"]
            # Clean up any extra whitespace or quotes
            link = link.strip().strip('"\'')
            # Ensure proper protocol
            if link and not link.startswith(('http://', 'https://')):
                link = f"https://{link}"
            project["project_link"] = link
        
        return project

    def _extract_achievements(self, ach_text: str) -> List[str]:
        """Extract individual achievements."""
        if not ach_text.strip():
            return []
        
        achievements = []
        lines = [l.strip() for l in ach_text.split('\n') if l.strip()]
        
        for line in lines:
            # Remove bullet points
            cleaned = line.lstrip('•●■-–—*►▪ ').strip()
            
            if 10 < len(cleaned) < 200:
                achievements.append(cleaned)
        
        return achievements

    def _extract_languages(self, lang_text: str, full_text: str) -> List[str]:
        """Extract spoken/written languages."""
        languages = set()
        
        # Common languages to look for
        common_languages = {
            "english", "hindi", "spanish", "french", "german", "chinese", "mandarin",
            "japanese", "korean", "arabic", "portuguese", "russian", "italian",
            "dutch", "swedish", "polish", "turkish", "marathi", "tamil", "telugu",
            "bengali", "gujarati", "kannada", "malayalam", "punjabi", "urdu"
        }
        
        # Search in language section first
        search_text = lang_text if lang_text else full_text
        
        for lang in common_languages:
            if re.search(r'\b' + lang + r'\b', search_text, re.IGNORECASE):
                languages.add(lang.capitalize())
        
        return sorted(list(languages))

    def _extract_projects_from_experience(self, experiences: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract project-like entries from experience responsibilities."""
        extracted_projects = []
        
        for exp in experiences:
            company = exp.get("company", "")
            responsibilities = exp.get("responsibilities", [])
            
            # Look for project-like responsibilities
            current_project = None
            
            for resp_idx, resp in enumerate(responsibilities):
                resp_lower = resp.lower()
                
                # Check if this responsibility describes a project
                project_indicators = [
                    'developed a', 'developed an', 'building a', 'building an',
                    'created a', 'created an', 'application', 'platform',
                    'system', 'website', 'portal', 'dashboard', 'tool'
                ]
                
                # Check if responsibility contains project indicators
                has_project_indicator = any(indicator in resp_lower for indicator in project_indicators)
                
                # Check if it contains a URL (strong indicator of a project)
                project_url = self._extract_project_url(resp)
                
                # Also check if there's a "Link - URL" pattern in nearby lines
                if not project_url and len(responsibilities) > resp_idx + 1:
                    next_resp = responsibilities[resp_idx + 1] if resp_idx + 1 < len(responsibilities) else ""
                    if next_resp.lower().startswith('link') and ('http' in next_resp or 'www' in next_resp):
                        project_url = self._extract_project_url(next_resp)
                
                if has_project_indicator or project_url:
                    # Try to extract project title from the responsibility
                    project_title = self._extract_project_title_from_description(resp)
                    
                    if project_title:
                        # Create project entry
                        project = {
                            "title": project_title,
                            "description": [resp],
                            "technologies": list(self._extract_technologies_from_text(resp)),
                            "project_link": project_url,
                            "duration": "",
                            "context": f"Developed at {company}" if company else ""
                        }
                        
                        extracted_projects.append(project)
                        logger.debug("Extracted project from experience: %s", project_title)
                
                # Also check for "Currently developing" patterns which indicate ongoing projects
                if ('currently developing' in resp_lower or 'currently building' in resp_lower) and 'application' in resp_lower:
                    ongoing_project_title = self._extract_ongoing_project_title(resp)
                    if ongoing_project_title and not any(ongoing_project_title.lower() in p.get('title', '').lower() for p in extracted_projects):
                        project = {
                            "title": ongoing_project_title,
                            "description": [resp],
                            "technologies": list(self._extract_technologies_from_text(resp)),
                            "project_link": "",
                            "duration": "Ongoing",
                            "context": f"Currently developing at {company}" if company else "Currently developing"
                        }
                        
                        extracted_projects.append(project)
                        logger.debug("Extracted ongoing project from experience: %s", ongoing_project_title)
        
        return extracted_projects
    
    def _extract_project_title_from_description(self, description: str) -> str:
        """Extract project title from a project description."""
        desc_lower = description.lower().strip()
        
        # Pattern 1: "Developed a [Project Name] application/system/platform..."
        patterns = [
            r'developed\s+a[n]?\s+([^.]+?)\s+(?:application|system|platform|website|portal|dashboard|tool)',
            r'building\s+a[n]?\s+([^.]+?)\s+(?:application|system|platform|website|portal|dashboard|tool)',
            r'created\s+a[n]?\s+([^.]+?)\s+(?:application|system|platform|website|portal|dashboard|tool)',
            r'developed\s+([^.]+?)\s+(?:application|system|platform|website|portal|dashboard|tool)',
            r'building\s+([^.]+?)\s+(?:application|system|platform|website|portal|dashboard|tool)',
            r'created\s+([^.]+?)\s+(?:application|system|platform|website|portal|dashboard|tool)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, desc_lower)
            if match:
                title = match.group(1).strip()
                # Clean and capitalize the title
                title = ' '.join(word.capitalize() for word in title.split())
                # Remove articles and clean up
                title = re.sub(r'^(A|An|The)\s+', '', title)
                if len(title) > 5:  # Must be reasonably long
                    return title
        
        # Pattern 2: Look for quoted or capitalized project names
        # "Student-Faculty Ratio Application"
        quoted_match = re.search(r'["\']([^"\']{10,50})["\']', description)
        if quoted_match:
            return quoted_match.group(1)
        
        # Pattern 3: Capitalized sequences that look like project names
        cap_words = re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Application|System|Platform|Tool|Dashboard)', description)
        if cap_words:
            return cap_words[0]
        
        return ""
    
    def _extract_ongoing_project_title(self, description: str) -> str:
        """Extract project title from ongoing project descriptions."""
        desc_lower = description.lower().strip()
        
        # Pattern 1: "Currently developing an application to [do something]"
        patterns = [
            r'currently developing\s+an?\s+application\s+to\s+([^.]+?)(?:\s+for|\.|$)',
            r'currently building\s+an?\s+application\s+to\s+([^.]+?)(?:\s+for|\.|$)',
            r'currently creating\s+an?\s+([^.]+?)\s+(?:application|system|platform)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, desc_lower)
            if match:
                title_desc = match.group(1).strip()
                # Convert to title case
                if 'track' in title_desc and 'ngo' in desc_lower:
                    return "NGO Participation Tracking Application"
                elif 'track' in title_desc and 'student' in title_desc:
                    return "Student Participation Tracker"
                elif len(title_desc) > 10:
                    # Generic title generation
                    words = title_desc.split()[:6]  # Limit length
                    title = ' '.join(word.capitalize() for word in words) + " Application"
                    return title
        
        return ""

    def _extract_explicit_experience(self, text: str) -> Optional[int]:
        """Extract explicitly stated years of experience."""
        # Look for patterns like "27+ years of experience", "5 years experience"
        pattern = re.compile(
            r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp\b)',
            re.IGNORECASE
        )
        
        matches = pattern.findall(text)
        if matches:
            # Return the highest value found
            return max(int(m) for m in matches)
        
        return None

    def _calculate_experience_years(self, experiences: List[Dict[str, Any]]) -> int:
        """Calculate total years from experience entries."""
        if not experiences:
            return 0
        
        total_years = 0
        for exp in experiences:
            years = exp.get("experience_years", 0)
            if isinstance(years, (int, float)):
                total_years += years
        
        return int(round(total_years))

