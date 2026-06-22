import { apiClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { EvaluationReport, SubmissionResult } from "../types/analytics";

export const analyticsService = {
  /**
   * Fetches search quality and ranking latency telemetry metrics.
   */
  async fetchMetrics(): Promise<EvaluationReport> {
    const response = await apiClient.get<EvaluationReport>(ENDPOINTS.METRICS);
    return response.data;
  },

  /**
   * Exports candidate pool ranking lists into standard CSV formats.
   * 
   * @param jobDescription Context JD.
   */
  async exportSubmission(jobDescription: string): Promise<SubmissionResult> {
    const response = await apiClient.post<SubmissionResult>("/api/v1/submission/export", {
      job_description: jobDescription,
    });
    return response.data;
  },
};
export type AnalyticsService = typeof analyticsService;
