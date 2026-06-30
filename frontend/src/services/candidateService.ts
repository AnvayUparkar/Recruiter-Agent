import { apiClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { Candidate } from "../types/candidate";

export interface CandidatePoolResult {
  query_id: string;
  candidates: Array<{
    candidate_id: string;
    score: number;
  }>;
}

/**
 * Maps snake_case candidate objects returned by the backend API into the camelCase structures
 * expected by various frontend pages and UI widgets.
 */
function mapBackendCandidateToFrontend(c: any): Candidate {
  if (!c) return c;

  const candidateId = c.candidate_id || c.candidateId || "";
  const profile = c.profile || {};
  const signals = c.redrob_signals || {};

  const mappedProfile = {
    anonymizedName: profile.anonymized_name || profile.anonymizedName || profile.name || "Candidate",
    headline: profile.headline || "",
    summary: profile.summary || "",
    location: profile.location || "",
    country: profile.country || "",
    yearsOfExperience: profile.years_of_experience ?? profile.yearsOfExperience ?? 0,
    currentTitle: profile.current_title || profile.currentTitle || "",
    currentCompany: profile.current_company || profile.currentCompany || "",
    currentCompanySize: profile.current_company_size || profile.currentCompanySize || "",
    currentIndustry: profile.current_industry || profile.currentIndustry || "",
  };

  const mappedSkills = (c.skills || []).map((s: any) => {
    if (typeof s === "string") {
      return {
        name: s,
        proficiency: "intermediate",
        endorsements: 0,
        durationMonths: 0,
      };
    }
    return {
      name: s.name || "Unknown Skill",
      proficiency: s.proficiency || "intermediate",
      endorsements: s.endorsements || 0,
      durationMonths: s.duration_months ?? s.durationMonths ?? 0,
    };
  });

  const mappedEducation = (Array.isArray(c.education) ? c.education : []).map((e: any) => ({
    institution: e.institution,
    degree: e.degree,
    fieldOfStudy: e.field_of_study || e.fieldOfStudy || "",
    startYear: e.start_year ?? e.startYear ?? 0,
    endYear: e.end_year ?? e.endYear ?? 0,
    grade: e.grade || "",
    tier: e.tier || "unknown",
  }));

  const mappedCareerHistory = (Array.isArray(c.career_history || c.careerHistory) ? (c.career_history || c.careerHistory) : []).map((job: any) => {
    const companyLower = (job.company || "").toLowerCase();
    const consultingAndAgencies = [
      "services", "consulting", "outsourcing", "agency", "solutions",
      "technologies", "systems", "integrator", "tcs", "infosys", "wipro",
      "cognizant", "accenture", "capgemini", "hcl", "tech mahindra"
    ];
    const isProductCompany = job.is_product_company ?? job.isProductCompany ?? !consultingAndAgencies.some(k => companyLower.includes(k));

    const productionTerms = [
      "production", "scale", "ci/cd", "kubernetes", "docker", "aws", "gcp",
      "azure", "deployment", "deploy", "pipeline", "infrastructure",
      "terraform", "microservices", "monitoring"
    ];
    const searchText = `${job.title || ""} ${job.description || ""}`.toLowerCase();
    const hasProductionKeywords = job.has_production_keywords ?? job.hasProductionKeywords ?? productionTerms.some(t => searchText.includes(t));

    return {
      company: job.company || "",
      title: job.title || "",
      startDate: job.start_date || job.startDate || "",
      endDate: job.end_date || job.endDate || null,
      durationMonths: job.duration_months ?? job.durationMonths ?? 0,
      isCurrent: job.is_current ?? job.isCurrent ?? false,
      industry: job.industry || "",
      companySize: job.company_size || job.companySize || "",
      description: job.description || "",
      isProductCompany,
      tenureYears: (job.duration_months ?? job.durationMonths ?? 0) / 12,
      hasProductionKeywords,
    };
  });

  const mappedSignals = {
    profileCompletenessScore: signals.profile_completeness_score ?? signals.profileCompletenessScore ?? 0,
    signupDate: signals.signup_date || signals.signupDate || "",
    lastActiveDate: signals.last_active_date || signals.lastActiveDate || "",
    openToWorkFlag: signals.open_to_work_flag ?? signals.openToWorkFlag ?? false,
    profileViewsReceived30d: signals.profile_views_received_30d ?? signals.profileViewsReceived30d ?? 0,
    applicationsSubmitted30d: signals.applications_submitted_30d ?? signals.applicationsSubmitted30d ?? 0,
    recruiterResponseRate: signals.recruiter_response_rate ?? signals.recruiterResponseRate ?? 0,
    avgResponseTimeHours: signals.avg_response_time_hours ?? signals.avgResponseTimeHours ?? 0,
    skillAssessmentScores: signals.skill_assessment_scores || signals.skillAssessmentScores || {},
    connectionCount: signals.connection_count ?? signals.connectionCount ?? 0,
    endorsementsReceived: signals.endorsements_received ?? signals.endorsementsReceived ?? 0,
    noticePeriodDays: signals.notice_period_days ?? signals.noticePeriodDays ?? 0,
    expectedSalaryRangeInrLpa: signals.expected_salary_range_inr_lpa || signals.expectedSalaryRangeInrLpa || { min: 0, max: 0 },
    preferredWorkMode: signals.preferred_work_mode || signals.preferredWorkMode || "onsite",
    willingToRelocate: signals.willing_to_relocate ?? signals.willingToRelocate ?? false,
    githubActivityScore: signals.github_activity_score ?? signals.githubActivityScore ?? 0,
    searchAppearance30d: signals.search_appearance_30d ?? signals.searchAppearance30d ?? 0,
    savedByRecruiters30d: signals.saved_by_recruiters_30d ?? signals.savedByRecruiters30d ?? 0,
    interviewCompletionRate: signals.interview_completion_rate ?? signals.interviewCompletionRate ?? 0,
    offerAcceptanceRate: signals.offer_acceptance_rate ?? signals.offerAcceptanceRate ?? 0,
    verifiedEmail: signals.verified_email ?? signals.verifiedEmail ?? false,
    verifiedPhone: signals.verified_phone ?? signals.verifiedPhone ?? false,
    linkedinConnected: signals.linkedin_connected ?? signals.linkedinConnected ?? false,
  };

  return {
    candidateId,
    name: mappedProfile.anonymizedName,
    email: c.email || "",
    location: mappedProfile.location,
    experienceYears: mappedProfile.yearsOfExperience,
    skills: mappedSkills,
    education: mappedEducation,
    projects: c.projects || [],
    availability: `${signals.notice_period_days ?? signals.noticePeriodDays ?? 0} Days`,
    reliabilityProfile: c.reliabilityProfile || c.reliability_profile,
    behaviorProfile: c.behaviorProfile || c.behavior_profile,
    rankingScore: c.rankingScore || c.ranking_score,
    redrob_signals: mappedSignals,
    career_history: mappedCareerHistory,
    careerHistory: mappedCareerHistory,
    profile: mappedProfile,
  } as any;
}

export const candidateService = {
  /**
   * Retrieves candidate pools matching raw job description texts.
   * 
   * @param jobDescription Query terms.
   * @param limit Match limits.
   */
  async retrievePool(
    jobDescription: string,
    limit = 100
  ): Promise<CandidatePoolResult> {
    const response = await apiClient.post<CandidatePoolResult>(ENDPOINTS.RETRIEVE, {
      job_description: jobDescription,
      limit,
    });
    return response.data;
  },

  /**
   * Fetches the complete profile details of a single candidate by ID.
   */
  async getCandidate(candidateId: string): Promise<Candidate> {
    const response = await apiClient.get<any>(`/api/v1/candidates/${candidateId}`);
    return mapBackendCandidateToFrontend(response.data);
  },
};
export type CandidateService = typeof candidateService;

