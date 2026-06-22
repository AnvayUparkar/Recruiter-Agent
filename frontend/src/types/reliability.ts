export interface ProfileQuality {
  profileCompleteness: number;
  profileDepth: number;
  documentationQuality: number;
  careerDetailQuality: number;
  skillsQuality: number;
}

export interface FraudProfile {
  candidateId: string;
  skillStuffingRisk: number;
  timelineRisk: number;
  identityRisk: number;
  experienceRisk: number;
  anomalyRisk: number;
  overallFraudRisk: number;
  confidence: number;
}

export interface ConsistencyProfile {
  candidateId: string;
  careerConsistency: number;
  timelineConsistency: number;
  skillConsistency: number;
  titleConsistency: number;
  experienceConsistency: number;
  consistencyScore: number;
  confidence: number;
}

export interface AnomalyProfile {
  candidateId: string;
  anomalyCount: number;
  severityScore: number;
  anomalyTypes: string[];
  riskScore: number;
}

export interface ReliabilityProfile {
  candidateId: string;
  qualityScore: number;
  fraudPenalty: number;
  consistencyScore: number;
  reliabilityScore: number;
  behavioralScore: number;
  trustScore: number;
  confidence: number;
  fraudProfile?: FraudProfile;
  consistencyProfile?: ConsistencyProfile;
  anomalyProfile?: AnomalyProfile;
  profileQuality?: ProfileQuality;
  evidence: string[];
}
