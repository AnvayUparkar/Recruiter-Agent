export interface RankingScore {
  candidateId: string;
  technicalScore: number;
  careerScore: number;
  behavioralScore: number;
  trustScore: number;
  matchingScore: number;
  retrievalScore: number;
  leadershipScore: number;
  marketScore: number;
  totalBonus: number;
  totalPenalty: number;
  finalScore: number;
  confidence: number;
}

export interface RankingExplanation {
  summary: string;
  strengths: string[];
  gaps: string[];
  fitVerdict: string;
}

export interface RecruiterReasoningTrace {
  candidateId: string;
  ruleEvaluations: Record<string, any>;
  rawSignalsCaptured: Record<string, any>;
  decisionSteps: string[];
  finalAdjustments: Record<string, any>;
}

export interface RankedCandidate {
  candidateId: string;
  candidate_id?: string;
  rank: number;
  finalScore: number;
  score?: number;
  confidence: number;
  verdict: string;
  fit_verdict?: string;
  summary: string;
  reasoning?: string;
  scoreDetails?: RankingScore;
  score_details?: any;
  final_score?: number;
  explanation?: RankingExplanation;
  reasoningTrace?: RecruiterReasoningTrace;
  details?: any;
  profile?: any;
  redrob_signals?: any;
}

export interface RankingResponse {
  jobTitle: string;
  totalCandidatesEvaluated: number;
  rankedCandidates: RankedCandidate[];
  appliedWeights: Record<string, number>;
  processingTimeMs: number;
  metadata: Record<string, any>;
}

export interface ExplanationResponse {
  candidateId: string;
  fitVerdict?: string;
  fit_verdict?: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  gaps?: string[];
  reasoning?: string;
}
