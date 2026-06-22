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
  candidateA: string;
  candidateB: string;
  winner: string;
  winnerReason: string;
  strengthComparison: Record<string, string>;
  weaknessComparison: Record<string, string>;
  featureDifferences: Record<string, number>;
  riskDifferences?: Record<string, string>;
  decisionConfidence: number;
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
