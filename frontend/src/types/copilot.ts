export interface HireRecommendation {
  recommendation: "Strong Hire" | "Hire" | "Interview" | "Consider" | "Reject";
  confidence: number;
  reasoning: string;
  strengths: string[];
  risks: string[];
  missingRequirements: string[];
  evidence: string[];
}

export interface InterviewPlan {
  technicalQuestions: string[];
  behavioralQuestions: string[];
  leadershipQuestions: string[];
  riskValidationQuestions: string[];
  focusAreas: string[];
  estimatedInterviewRounds: number;
}

export interface RecruiterInsight {
  insightType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
}

export interface HiringDecision {
  decision: string;
  confidence: number;
  rationale: string;
  supportingEvidence: string[];
  supporting_evidence?: string[];
  riskSummary: string;
  recommendation: HireRecommendation;
}

export interface CandidateComparisonResult {
  candidateA?: string;
  candidate_id_a?: string;
  candidateB?: string;
  candidate_id_b?: string;
  winner: string;
  winnerReason?: string;
  winner_reason?: string;
  strengthComparison?: Record<string, string>;
  strength_comparison?: Record<string, string>;
  weaknessComparison?: Record<string, string>;
  weakness_comparison?: Record<string, string>;
  featureDifferences?: Record<string, number>;
  feature_differences?: Record<string, number>;
  riskDifferences?: Record<string, string>;
  risk_differences?: Record<string, string>;
  decisionConfidence?: number;
  decision_confidence?: number;
}

export interface RecruiterReport {
  candidateId: string;
  candidate_id?: string;
  recruiterSummary: string;
  recruiter_summary?: string;
  hireRecommendation: HireRecommendation;
  hire_recommendation?: HireRecommendation;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  interviewFocus: string[];
  confidence: number;
  evidence: string[];
  overallAssessment: string;
  generatedAt: string;
}
