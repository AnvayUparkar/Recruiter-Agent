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
    const response = await apiClient.get<Candidate>(`/api/v1/candidates/${candidateId}`);
    return response.data;
  },
};
export type CandidateService = typeof candidateService;
