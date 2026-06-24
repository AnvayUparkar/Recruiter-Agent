import { apiClient } from "../api/client";
import { RecruiterReport, CandidateComparisonResult, HiringDecision } from "../types/copilot";

export const copilotService = {
  /**
   * Generates a unified recruiter copilot intelligence report for a candidate.
   * 
   * @param candidateId Target candidate.
   * @param jobDescription Context JD query.
   */
  async generateReport(
    candidateId: string,
    jobDescription: string
  ): Promise<RecruiterReport> {
    const response = await apiClient.post<RecruiterReport>("/api/v1/copilot/report", {
      candidate_id: candidateId,
      job_description: jobDescription,
    });
    return response.data;
  },

  /**
   * Compares finalists side-by-side. Supports 2 to 5 candidates.
   * 
   * @param candidateIds List of candidate IDs, or first candidate ID.
   * @param candidateIdBOrJD Second candidate ID, or active JD description.
   * @param jobDescription Context JD description if using pairwise parameters.
   */
  async compareCandidates(
    candidateIds: string[] | string,
    candidateIdBOrJD: string,
    jobDescription?: string
  ): Promise<CandidateComparisonResult> {
    let payload: any = {};
    if (Array.isArray(candidateIds)) {
      payload = {
        candidate_ids: candidateIds,
        job_description: candidateIdBOrJD,
      };
    } else {
      payload = {
        candidate_id_a: candidateIds,
        candidate_id_b: candidateIdBOrJD,
        job_description: jobDescription,
      };
    }
    const response = await apiClient.post<CandidateComparisonResult>("/api/v1/copilot/compare", payload);
    return response.data;
  },


  /**
   * Evaluates candidate parameters and packs a hiring decision proposal.
   * 
   * @param candidateId Target candidate.
   * @param jobDescription Context JD.
   */
  async generateHiringDecision(
    candidateId: string,
    jobDescription: string
  ): Promise<HiringDecision> {
    const response = await apiClient.post<HiringDecision>("/api/v1/copilot/decision", {
      candidate_id: candidateId,
      job_description: jobDescription,
    });
    return response.data;
  },
};
export type CopilotService = typeof copilotService;
