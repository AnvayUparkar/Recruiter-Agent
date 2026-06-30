"""Production-ready Resume Parser for Candidate Intel."""

import os
import re
import io
import docx
import pdfplumber
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

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
    raw_text: str = ""

class ResumeParser:
    """Intelligently parses PDF and DOCX files into structured JSON."""

    def __init__(self):
        self.standard_skills = get_all_standard_skills()
        self.skills_list = list(self.standard_skills)

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
        resume = ParsedResume(raw_text=text)
        
        # Extract Contact Information
        resume.email = self._extract_email(text)
        resume.phone = self._extract_phone(text)
        resume.linkedin = self._extract_url(text, "linkedin.com")
        resume.github = self._extract_url(text, "github.com")
        
        # Best effort name extraction (usually first line or two)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            # simple heuristic: first line that doesn't look like an email or phone
            for line in lines[:5]:
                if len(line) < 40 and not '@' in line and not any(c.isdigit() for c in line):
                    cleaned_line = line.strip()
                    if cleaned_line.lower() in ["contact", "contact info", "contact information", "resume", "curriculum vitae", "cv", "profile"]:
                        continue
                        
                    # If it starts with "CONTACT ", remove the prefix
                    if cleaned_line.lower().startswith("contact "):
                        cleaned_line = cleaned_line[8:].strip()
                        
                    resume.name = cleaned_line
                    break

        # Extract Skills
        resume.skills = self._extract_skills(text)
        
        # Split into heuristic sections
        sections = self._split_into_sections(text)
        
        # Very basic heuristics for experience and education
        resume.experience = self._extract_experience(sections.get("experience", ""))
        resume.education = self._extract_education(sections.get("education", ""))
        
        return resume

    def _extract_email(self, text: str) -> str:
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else ""

    def _extract_phone(self, text: str) -> str:
        # Matches formats like +1 234-567-8901, (123) 456-7890
        match = re.search(r'(\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}', text)
        return match.group(0) if match else ""

    def _extract_url(self, text: str, domain: str) -> str:
        match = re.search(r'(https?://(?:www\.)?'+domain+r'/[^\s]+)', text.lower())
        if not match:
            # try without http
            match = re.search(r'(?:www\.)?'+domain+r'/[^\s]+', text.lower())
        return match.group(0) if match else ""

    def _extract_skills(self, text: str) -> List[str]:
        found_skills = set()
        
        # Preprocessing: tokenize text and normalize
        # Split by whitespace and strip common punctuation to preserve +, #, . for skills like C++, C#, Node.js
        words_raw = text.split()
        words_lower = []
        for w in words_raw:
            w_clean = w.strip('(),:;"!?\'-[]{}')
            if w_clean:
                words_lower.append(w_clean.lower())
        
        # 1. Exact & Alias Matches
        for word in words_lower:
            mapped = map_skill(word)
            if mapped in self.standard_skills:
                found_skills.add(mapped)
                
        # Bigrams (e.g. "Machine Learning")
        bigrams = [f"{words_lower[i]} {words_lower[i+1]}" for i in range(len(words_lower)-1)]
        for bg in bigrams:
            mapped = map_skill(bg)
            if mapped in self.standard_skills:
                found_skills.add(mapped)

        # 2. Fuzzy Matching for slightly misspelled skills
        if process and fuzz:
            # We only fuzzy match longer standard skills to avoid false positives
            long_skills = [s for s in self.skills_list if len(s) > 4]
            # check the whole text against skills using fuzzy word search? 
            # Too slow. Let's do token-based fuzzy matching.
            unique_tokens = set(words_lower + bigrams)
            for token in unique_tokens:
                if len(token) > 4:
                    match = process.extractOne(token, long_skills, scorer=fuzz.ratio)
                    if match and match[1] >= 85:
                        found_skills.add(match[0])
                        
        return sorted(list(found_skills))

    def _split_into_sections(self, text: str) -> Dict[str, str]:
        sections = {"experience": "", "education": ""}
        current_section = None
        
        lines = text.split('\n')
        for line in lines:
            line_clean = line.strip().lower()
            # Clean non-alpha characters to handle bullets, colons, extra spaces
            line_clean_alpha = re.sub(r'[^a-z\s]', '', line_clean).strip()
            
            # Use 'in' for multi-word keywords, exact match for single words
            # And ensure the line isn't a long paragraph (must be < 80 chars)
            if len(line_clean) < 80 and (
                any(kw in line_clean_alpha for kw in ["work experience", "professional experience", "employment history"]) 
                or line_clean_alpha == "experience"
                or line_clean_alpha.endswith(" experience")
            ):
                current_section = "experience"
                continue
            elif len(line_clean) < 80 and (
                any(kw in line_clean_alpha for kw in ["academic background", "education credentials"]) 
                or line_clean_alpha in ["education", "academics"]
                or line_clean_alpha.endswith(" education")
                or " education " in f" {line_clean_alpha} "
            ):
                current_section = "education"
                continue
            elif len(line_clean) < 80 and (
                any(kw in line_clean_alpha for kw in ["technical skills"]) 
                or line_clean_alpha in ["skills", "projects", "certifications", "achievements", "summary", "objective", "profile", "contact"]
                or any(kw in line_clean_alpha.split() for kw in ["skills", "profile"])
            ):
                current_section = None
                continue
                
            if current_section:
                sections[current_section] += line + "\n"
                
        return sections

    def _extract_experience(self, exp_text: str) -> List[Dict]:
        """Simple heuristic extraction for experience block."""
        exp_text = exp_text.strip()
        if not exp_text:
            return []
            
        blocks = re.split(r'\n\s*\n', exp_text)
        res = []
        for b in blocks:
            b = b.strip()
            if b:
                lines = b.split('\n')
                res.append({
                    "title": lines[0].strip(),
                    "description": "\n".join(lines[1:]).strip()
                })
        return res

    def _extract_education(self, edu_text: str) -> List[Dict]:
        """Simple heuristic extraction for education block."""
        edu_text = edu_text.strip()
        if not edu_text:
            return []
            
        blocks = re.split(r'\n\s*\n', edu_text)
        res = []
        for b in blocks:
            b = b.strip()
            if b:
                lines = b.split('\n')
                res.append({
                    "institution": lines[0].strip(),
                    "description": "\n".join(lines[1:]).strip()
                })
        return res

