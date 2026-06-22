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
   * Compares two finalists head-to-head.
   * 
   * @param candidateIdA First candidate.
   * @param candidateIdB Second candidate.
   * @param jobDescription Context JD.
   */
  async compareCandidates(
    candidateIdA: string,
    candidateIdB: string,
    jobDescription: string
  ): Promise<CandidateComparisonResult> {
    const response = await apiClient.post<CandidateComparisonResult>("/api/v1/copilot/compare", {
      candidate_id_a: candidateIdA,
      candidate_id_b: candidateIdB,
      job_description: jobDescription,
    });
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
