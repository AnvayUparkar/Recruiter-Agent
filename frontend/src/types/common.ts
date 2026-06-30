export interface RequirementDetail {
  name: string;
  importance: "critical" | "important" | "optional" | "bonus";
  confidence: number;
}

export interface ResponsibilityItem {
  title: string;
  detail: string;
}

export interface ParsedJD {
  jobTitle?: string;
  job_title: string;
  companyName?: string;
  company_name: string;
  experienceRange?: [number, number];
  experience_range: [number, number];
  mustHave?: RequirementDetail[];
  must_have: RequirementDetail[];
  niceToHave?: RequirementDetail[];
  good_to_have: RequirementDetail[];
  rawText?: string;
  raw_text: string;

  // Enriched fields from backend
  domain: string;
  leadership: string;
  work_mode: string;
  workMode?: string;
  salary_range: string;
  salaryRange?: string;
  notice_period: string;
  noticePeriod?: string;
  degrees: string[];
  certifications: string[];
  preferred_qualifications: string[];
  preferredQualifications?: string[];
  responsibilities: ResponsibilityItem[];
  confidence: number;
  employmentType?: string;

  // Additional metadata & compatibility fields
  required_skills?: string[];
  preferred_skills?: string[];
  negative_signals: string[];
  behavioral_preferences: string[];
  culture_fit: string[];
  industry_preferences: string[];
  location_preferences: string[];
  scoring_profile: {
    technical_weight: number;
    career_weight: number;
    behavioral_weight: number;
    culture_weight: number;
    location_weight: number;
  };
  summary: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: any;
}

export interface JobPosting {
  _id?: string;
  title: string;
  company: string;
  location: string;
  work_mode: string;
  experience?: { min: number; max: number };
  employment_type: string;
  description: string;
  skills?: (string | { name: string })[];
  required_skills?: string[];
  preferred_skills?: string[];
  applications_count?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterOptions {
  search?: string;
  noticePeriodMax?: number;
  minScore?: number;
  strategy?: "balanced" | "technical_first" | "engagement_first";
}

export interface AppHealth {
  status: string;
  modelLoaded: boolean;
  faissLoaded: boolean;
  bm25Loaded: boolean;
  candidateCount: number;
}
