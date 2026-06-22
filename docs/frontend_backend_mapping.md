# Frontend-Backend API Mapping Specification

This document details every REST API endpoint exposed by the Flask backend, including request/response structures, example payloads, and frontend usage.

---

## 1. Job Description Analysis

### `POST /api/v1/jd/analyze`

- **Used By**: Job Description Upload Wizard / Parser
- **Request Payload (`JDRequest`)**:
  ```json
  {
    "job_description": "We are seeking a Senior Machine Learning Engineer with expert Python, SQL, and distributed systems skills to build vector database search pipelines..."
  }
  ```
- **Response Payload (`ParsedJD`)**:
  ```json
  {
    "job_title": "Senior Machine Learning Engineer",
    "company_name": "InnovateCorp",
    "experience_range": [3.0, 10.0],
    "must_have": [
      { "name": "Python", "importance": "critical", "confidence": 1.0 },
      { "name": "SQL", "importance": "important", "confidence": 0.95 }
    ],
    "nice_to_have": [
      { "name": "Vector Database", "importance": "optional", "confidence": 0.85 }
    ],
    "raw_text": "We are seeking..."
  }
  ```
- **Dependencies**: `JdAnalyzer`
- **Frontend Action**: Submitting a new job description, parsing the required/optional skills, and updating the global `currentJD` state.

---

## 2. Candidate Ingestion / Retrieval

### `POST /api/v1/retrieve`

- **Used By**: Retrieval Finder Panel
- **Request Payload (`RetrievalRequest`)**:
  ```json
  {
    "job_description": "We are seeking a Senior Machine Learning Engineer...",
    "limit": 100
  }
  ```
- **Response Payload (`CandidatePool`)**:
  ```json
  {
    "query_id": "Q_20260615_001",
    "candidates": [
      {
        "candidate_id": "CAND_0000001",
        "score": 0.9123
      }
    ]
  }
  ```
- **Dependencies**: `HybridRetrievalService` (FAISS + BM25)
- **Frontend Action**: Fetching initial candidate IDs matching lexical/semantic terms.

---

## 3. Candidate Ranking

### `POST /api/v1/rank`

- **Used By**: Recruitment Dashboard List / Finalist Screen
- **Request Payload (`RankingRequest`)**:
  ```json
  {
    "job_description": "We are seeking a Senior Machine Learning Engineer...",
    "strategy": "balanced",
    "limit": 100
  }
  ```
- **Response Payload (`RankingResponse`)**:
  ```json
  {
    "job_title": "Senior Machine Learning Engineer",
    "total_candidates_evaluated": 100,
    "ranked_candidates": [
      {
        "candidate_id": "CAND_0000001",
        "rank": 1,
        "final_score": 0.92,
        "confidence": 0.90,
        "verdict": "Strong Match",
        "summary": "Alice Smith has strong production ML skills and high availability..."
      }
    ],
    "applied_weights": {
      "technical": 0.40,
      "career": 0.20,
      "behavioral": 0.20,
      "matching": 0.10,
      "market": 0.05,
      "leadership": 0.05
    },
    "processing_time_ms": 142.50,
    "metadata": {}
  }
  ```
- **Dependencies**: `FinalRankingService`, `FeatureService`, `TrustworthinessService`, `RecruiterTrustService`
- **Frontend Action**: Renders the primary candidate leaderboard table, applies filtering/sorting, and tracks calibrated score deltas.

---

## 4. Recruiter Copilot Fit Explanation

### `POST /api/v1/explain`

- **Used By**: Recruiter Assistant Drawer / Candidate Profiles
- **Request Payload (`ExplanationRequest`)**:
  ```json
  {
    "candidate_id": "CAND_0000001",
    "job_description": "We are seeking a Senior Machine Learning Engineer..."
  }
  ```
- **Response Payload (`ExplanationResponse`)**:
  ```json
  {
    "candidate_id": "CAND_0000001",
    "fit_verdict": "Strong Match",
    "summary": "Highly experienced developer matching all core criteria with stable career histories.",
    "strengths": ["8+ years of production engineering", "Expert Python competency"],
    "weaknesses": ["Lacks direct distributed systems experience"],
    "matched_requirements": [
      { "name": "Python", "matched": true, "importance": "critical" }
    ],
    "missing_requirements": ["Distributed Systems"],
    "reasoning": "Step-by-step trace: Checked skills... Calculated availability... Calibrated score..."
  }
  ```
- **Dependencies**: `ExplainabilityService`, `RecruiterReasoning`
- **Frontend Action**: Renders candidate-centric cards, maps matched requirement checklists, and surfaces weaknesses/gaps.

---

## 5. Recruiter Telemetry & Metrics

### `GET /api/v1/metrics`

- **Used By**: Recruiter System Analytics Charts
- **Response Payload (`MetricsResponse`)**:
  ```json
  {
    "generated_at": "2026-06-15T23:00:00Z",
    "ndcg_at_5": 0.895,
    "precision_at_5": 0.80,
    "mrr": 0.92,
    "system_latency_avg_ms": 115.4,
    "total_queries_logged": 1250
  }
  ```
- **Dependencies**: `EvaluationService`, `AnalyticsService`
- **Frontend Action**: Renders system health and accuracy dashboards (NDCG, MRR, latency) via Recharts.

---

## 6. Subsystem Status & Config

### `GET /api/v1/health`

- **Used By**: Global Error Boundary / Initialization checks
- **Response Payload (`HealthResponse`)**:
  ```json
  {
    "status": "healthy",
    "model_loaded": true,
    "faiss_loaded": true,
    "bm25_loaded": true,
    "candidate_count": 1000
  }
  ```
- **Dependencies**: System model status logs
- **Frontend Action**: Block user access if status is not `healthy` or models are not loaded.
