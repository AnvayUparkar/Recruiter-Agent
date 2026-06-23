"""Gemini Service — Phase 15 & 17: AI Recruiter Copilot.

Integrates with the Google Gemini API to generate dynamic, candidate-specific interview questions.
"""

import os
import json
import requests
from typing import Dict, Any, Optional
from utils.logger import get_logger

logger = get_logger(__name__)


class GeminiService:
    """Service to construct candidate-specific prompts and query the Gemini API."""

    def __init__(self):
        # Resolve api key from config or env
        try:
            from flask import current_app
            self.api_key = current_app.config.get("GEMINI_API_KEY")
        except Exception:
            self.api_key = None

        if not self.api_key:
            self.api_key = os.environ.get("GEMINI_API_KEY", "")

    def generate_interview_questions(
        self,
        candidate: Dict[str, Any],
        job_description: Dict[str, Any],
        ranking: Optional[Dict[str, Any]] = None,
        behavior: Optional[Dict[str, Any]] = None,
        reliability: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Formulates a prompt and requests custom structured questions from the Gemini model.

        Args:
            candidate: Full Candidate profile dictionary.
            job_description: Parsed Job Description dictionary.
            ranking: Ranking details or scores.
            behavior: Candidate behavioral profile.
            reliability: Candidate reliability profile.

        Returns:
            Dict[str, Any]: Structured interview questions.
        """
        if not self.api_key:
            logger.error("GEMINI_API_KEY environment variable is not configured.")
            raise ValueError("GEMINI_API_KEY is not configured on the server.")

        # Extract context fields safely
        profile = candidate.get("profile", {})
        cand_name = profile.get("anonymized_name") or candidate.get("name") or "Candidate"
        current_title = profile.get("current_title") or "Professional"
        years_exp = profile.get("years_of_experience") or candidate.get("experienceYears") or 0.0
        skills = [s.get("name") for s in candidate.get("skills", [])]
        history = []
        for job in candidate.get("career_history", []):
            history.append(f"- {job.get('title')} at {job.get('company')} ({job.get('duration_months', 0)} months): {job.get('description', '')}")

        # Extract JD contexts
        jd_title = job_description.get("job_title") or "Target Role"
        must_have = [r.get("name") for r in job_description.get("must_have", [])]
        good_to_have = [r.get("name") for r in job_description.get("good_to_have", [])]
        jd_summary = job_description.get("summary") or ""

        # Extract metrics
        rel_score = 0.5
        rel_tier = "UNKNOWN"
        if reliability:
            rel_score = reliability.get("reliability_score") or reliability.get("reliabilityScore") or 0.5
            rel_tier = reliability.get("reliability_tier") or "UNKNOWN"
        elif "reliabilityProfile" in candidate:
            rp = candidate["reliabilityProfile"] or {}
            rel_score = rp.get("reliabilityScore") or 0.5
            rel_tier = rp.get("reliability_tier") or "UNKNOWN"

        lead_score = 0.5
        if ranking and "scoreDetails" in ranking:
            sd = ranking["scoreDetails"] or {}
            lead_score = sd.get("leadership_score") or sd.get("leadershipScore") or 0.5
        elif "rankingScore" in candidate:
            rs = candidate["rankingScore"] or {}
            sd = rs.get("scoreDetails") or {}
            lead_score = sd.get("leadershipScore") or 0.5

        # Format risk warning logs if any
        risks_list = []
        if reliability and "detected_risks" in reliability:
            risks_list = reliability["detected_risks"] or []
        elif "reliabilityProfile" in candidate:
            rp = candidate["reliabilityProfile"] or {}
            risks_list = rp.get("detected_risks") or rp.get("detectedRisks") or []

        # Build prompt
        prompt = f"""You are an elite, senior tech recruiter. Generate highly specific, customized interview questions for the following candidate applying for the '{jd_title}' role.

CANDIDATE DOSSIER:
- Name: {cand_name}
- Current Role: {current_title}
- Total Experience: {years_exp} years
- Declared Skills: {", ".join(skills)}
- Career Timeline:
{"\n".join(history) if history else "No history recorded."}

JD CONSTRAINTS:
- Role: {jd_title}
- Required Must-Have Skills: {", ".join(must_have)}
- Preferred Good-to-Have Skills: {", ".join(good_to_have)}
- JD Summary: {jd_summary}

AI PROFILING & SCORES:
- Profile Reliability Score: {rel_score} (Tier: {rel_tier})
- Leadership Competency Score: {lead_score} (out of 1.0)
- Flags or Risks: {", ".join(risks_list) if risks_list else "None detected"}

PROMPT INSTRUCTIONS:
1. Generate exactly 16 personalized interview questions split into these categories:
   - **Technical Questions** (5 questions): Probe specific developer skills, system architectures, and coding tools declared (e.g., if they mention Redis/Flask, ask caching strategies. If they have Kubernetes, ask cluster orchestration. If they are junior, simplify system design questions).
   - **Behavioral Questions** (5 questions): Ask for scenarios reflecting conflicts, priorities, and adaptability.
   - **Leadership Questions** (3 questions): Based on their leadership score ({lead_score}). If the score is low (e.g. < 0.6), focus on personal coordination and collaboration. If high, focus on design influence, mentoring, and technical vision.
   - **Risk Validation Questions** (3 questions): Address any low reliability tier or flags ({", ".join(risks_list) if risks_list else "None"}). Ask clarifying, respectful questions checking timeline durations or gaps, without being accusatory or aggressive.

2. Each question MUST include:
   - "question": The actual question text.
   - "reason": Recruiter-facing explanation of why we are asking this to *this* candidate based on their profile.
   - "difficulty": "Easy" | "Medium" | "Hard"
   - "category": Sub-topic or focus (e.g. "Caching Strategy", "Timeline Gap", "Team Mentorship").
   - "follow_up": A logical, deep-dive follow-up question.

Be highly contextual. Avoid generic templates (e.g., do not just ask "Tell me about yourself" or "What is your biggest weakness"). Probe their actual Swiggy/Uber/Zomato experiences or projects.
"""

        # Call Gemini REST API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        
        # Enforce structured JSON schema
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "technical": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "question": {"type": "STRING"},
                                    "reason": {"type": "STRING"},
                                    "difficulty": {"type": "STRING"},
                                    "category": {"type": "STRING"},
                                    "follow_up": {"type": "STRING"}
                                },
                                "required": ["question", "reason", "difficulty", "category", "follow_up"]
                            }
                        },
                        "behavioral": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "question": {"type": "STRING"},
                                    "reason": {"type": "STRING"},
                                    "difficulty": {"type": "STRING"},
                                    "category": {"type": "STRING"},
                                    "follow_up": {"type": "STRING"}
                                },
                                "required": ["question", "reason", "difficulty", "category", "follow_up"]
                            }
                        },
                        "leadership": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "question": {"type": "STRING"},
                                    "reason": {"type": "STRING"},
                                    "difficulty": {"type": "STRING"},
                                    "category": {"type": "STRING"},
                                    "follow_up": {"type": "STRING"}
                                },
                                "required": ["question", "reason", "difficulty", "category", "follow_up"]
                            }
                        },
                        "risk_validation": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "question": {"type": "STRING"},
                                    "reason": {"type": "STRING"},
                                    "difficulty": {"type": "STRING"},
                                    "category": {"type": "STRING"},
                                    "follow_up": {"type": "STRING"}
                                },
                                "required": ["question", "reason", "difficulty", "category", "follow_up"]
                            }
                        }
                    },
                    "required": ["technical", "behavioral", "leadership", "risk_validation"]
                }
            }
        }

        try:
            logger.info("Sending requests payload to Google Gemini API...")
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Gemini API returned error code {response.status_code}: {response.text}")
                raise RuntimeError(f"Gemini API Error: HTTP {response.status_code}")

            res_json = response.json()
            candidates_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
            
            parsed_questions = json.loads(candidates_text)
            
            # Form standard result
            return {
                "technical": parsed_questions.get("technical", []),
                "behavioral": parsed_questions.get("behavioral", []),
                "leadership": parsed_questions.get("leadership", []),
                "risk_validation": parsed_questions.get("risk_validation", []),
                "generated_at": response.headers.get("Date", ""),
                "model": "gemini-3-flash-preview"
            }

        except Exception as e:
            logger.exception("An error occurred during Gemini API content generation.")
            raise e
