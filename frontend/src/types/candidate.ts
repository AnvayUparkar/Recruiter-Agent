import { ReliabilityProfile } from "./reliability";
import { BehavioralIntelligence } from "./behavior";
import { RankingScore } from "./ranking";

export interface Skill {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  endorsements: number;
  durationMonths?: number;
}

export interface CareerHistory {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  durationMonths: number;
  isCurrent: boolean;
  industry: string;
  companySize: string;
  description: string;
  isProductCompany?: boolean;
  tenureYears?: number;
  hasProductionKeywords?: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
  grade?: string;
  tier: "tier_1" | "tier_2" | "tier_3" | "tier_4" | "unknown";
}

export interface ExpectedSalaryRange {
  min: number;
  max: number;
}

export interface RedrobSignals {
  profileCompletenessScore: number;
  signupDate: string;
  lastActiveDate: string;
  openToWorkFlag: boolean;
  profileViewsReceived30d: number;
  applicationsSubmitted30d: number;
  recruiterResponseRate: number;
  avgResponseTimeHours: number;
  skillAssessmentScores: Record<string, number>;
  connectionCount: number;
  endorsementsReceived: number;
  noticePeriodDays: number;
  expectedSalaryRangeInrLpa: ExpectedSalaryRange;
  preferredWorkMode: "remote" | "hybrid" | "onsite" | "flexible";
  willingToRelocate: boolean;
  githubActivityScore: number;
  searchAppearance30d: number;
  savedByRecruiters30d: number;
  interviewCompletionRate: number;
  offerAcceptanceRate: number;
  verifiedEmail: boolean;
  verifiedPhone: boolean;
  linkedinConnected: boolean;
}

export interface Project {
  name: string;
  description: string;
  url?: string;
  technologies: string[];
}

export interface Profile {
  anonymizedName: string;
  headline: string;
  summary: string;
  location: string;
  country: string;
  yearsOfExperience: number;
  currentTitle: string;
  currentCompany: string;
  currentCompanySize: string;
  currentIndustry: string;
}

export interface Candidate {
  candidateId: string;
  name: string;
  email: string;
  location: string;
  experienceYears: number;
  skills: Skill[];
  education: Education[];
  projects?: Project[];
  availability: string;
  reliabilityProfile?: ReliabilityProfile;
  behaviorProfile?: BehavioralIntelligence;
  rankingScore?: RankingScore;
  profile?: Profile;
  redrob_signals?: RedrobSignals;
  career_history?: CareerHistory[];
}
