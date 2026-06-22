import { apiClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { RankingResponse, ExplanationResponse } from "../types/ranking";

export const rankingService = {
  /**
   * Scores and ranks candidate pools against job description constraints.
   * 
   * @param jobDescription Specs to match against.
   * @param strategy Active weight prioritization scheme.
   * @param limit Number of results to return.
   */
  async rankCandidates(
    jobDescription: string,
    strategy: "balanced" | "technical_first" | "engagement_first" = "balanced",
    limit = 100
  ): Promise<RankingResponse> {
    const response = await apiClient.post<any>(ENDPOINTS.RANK, {
      job_description: jobDescription,
      strategy,
      limit,
    }, {
      timeout: 120000,
    });
    
    const data = response.data;
    const rawCandidates = data.candidates || data.ranked_candidates || data.rankedCandidates || [];
    
    const mappedCandidates = rawCandidates.map((c: any) => {
      const candidateId = c.candidate_id || c.candidateId;
      const score = c.score ?? c.final_score ?? c.finalScore;
      const verdict = c.fit_verdict ?? c.verdict;
      const reasoning = c.reasoning ?? c.summary;
      const profile = c.profile || {};
      const signals = c.redrob_signals || {};

      const mappedProfile = {
        anonymizedName: profile.anonymized_name || profile.name || candidateId,
        headline: profile.headline || "",
        summary: profile.summary || "",
        location: profile.location || "",
        country: profile.country || "",
        yearsOfExperience: profile.years_of_experience || 0,
        currentTitle: profile.current_title || "",
        currentCompany: profile.current_company || "",
        currentCompanySize: profile.current_company_size || "",
        currentIndustry: profile.current_industry || "",
      };

      const mappedSkills = (profile.skills || []).map((s: any) => ({
        name: s.name,
        proficiency: s.proficiency || "intermediate",
        endorsements: s.endorsements || 0,
        durationMonths: s.duration_months || 0
      }));

      const details = {
        candidateId,
        name: mappedProfile.anonymizedName,
        location: mappedProfile.location,
        experienceYears: mappedProfile.yearsOfExperience,
        skills: mappedSkills,
        redrob_signals: {
          profileCompletenessScore: signals.profile_completeness_score || 0,
          signupDate: signals.signup_date || "",
          lastActiveDate: signals.last_active_date || "",
          openToWorkFlag: signals.open_to_work_flag || false,
          profileViewsReceived30d: signals.profile_views_received_30d || 0,
          applicationsSubmitted30d: signals.applications_submitted_30d || 0,
          recruiterResponseRate: signals.recruiter_response_rate || 0,
          avgResponseTimeHours: signals.avg_response_time_hours || 0,
          skillAssessmentScores: signals.skill_assessment_scores || {},
          connectionCount: signals.connection_count || 0,
          endorsementsReceived: signals.endorsements_received || 0,
          noticePeriodDays: signals.notice_period_days || 0,
          expectedSalaryRangeInrLpa: signals.expected_salary_range_inr_lpa || { min: 0, max: 0 },
          preferredWorkMode: signals.preferred_work_mode || "onsite",
          willingToRelocate: signals.willing_to_relocate || false,
          githubActivityScore: signals.github_activity_score || 0,
          searchAppearance30d: signals.search_appearance_30d || 0,
          savedByRecruiters30d: signals.saved_by_recruiters_30d || 0,
          interviewCompletionRate: signals.interview_completion_rate || 0,
          offerAcceptanceRate: signals.offer_acceptance_rate || 0,
          verifiedEmail: signals.verified_email || false,
          verifiedPhone: signals.verified_phone || false,
          linkedinConnected: signals.linkedin_connected || false,
        },
        profile: mappedProfile,
        availability: `${signals.notice_period_days || signals.noticePeriodDays || 0} Days`
      };

      return {
        candidateId,
        candidate_id: candidateId,
        rank: c.rank,
        finalScore: score,
        score,
        confidence: c.confidence || 0.85,
        verdict,
        fit_verdict: verdict,
        summary: reasoning,
        reasoning,
        details,
        profile: mappedProfile,
        redrob_signals: details.redrob_signals
      };
    });

    return {
      jobTitle: data.job_title || data.jobTitle,
      totalCandidatesEvaluated: data.total_ranked || data.total_candidates_evaluated || mappedCandidates.length,
      rankedCandidates: mappedCandidates,
      appliedWeights: data.applied_weights || {},
      processingTimeMs: data.processing_time_ms || 0,
      metadata: data.metadata || {}
    };
  },

  /**
   * Generates recruiter justification summaries and checklists.
   * 
   * @param candidateId Target candidate CAND_XXXXXXX.
   * @param jobDescription Active JD context.
   */
  async explainCandidate(
    candidateId: string,
    jobDescription?: string
  ): Promise<ExplanationResponse> {
    const response = await apiClient.post<ExplanationResponse>(ENDPOINTS.EXPLAIN, {
      candidate_id: candidateId,
      job_description: jobDescription,
    });
    return response.data;
  },
};
export type RankingService = typeof rankingService;
