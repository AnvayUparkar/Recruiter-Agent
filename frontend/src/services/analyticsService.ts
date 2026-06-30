import { apiClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { EvaluationReport, SubmissionResult } from "../types/analytics";

export interface DashboardAnalytics {
  total_candidates: number;
  shortlisted_count: number;
  avg_reliability_score: number;
  avg_match_score: number;
  processing_time_ms: number;
  reports_exported: number;
  system_health: {
    status: string;
    faiss_loaded: boolean;
    bm25_loaded: boolean;
  };
  quality_metrics: {
    ndcg_at_5: number;
    precision_at_5: number;
    mrr: number;
  };
}

export const analyticsService = {
  /**
   * Fetches search quality and ranking latency telemetry metrics.
   */
  async fetchMetrics(): Promise<EvaluationReport> {
    const response = await apiClient.get<EvaluationReport>(ENDPOINTS.METRICS);
    return response.data;
  },

  /**
   * Fetches comprehensive analytics dashboard data.
   */
  async fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
    const response = await apiClient.get<DashboardAnalytics>("/api/v1/analytics/dashboard");
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

  /**
   * Downloads a previously generated submission CSV file.
   * 
   * @param filename Name of the file to download.
   */
  async downloadSubmission(filename: string): Promise<Blob> {
    const response = await apiClient.get(`/api/v1/submission/download/${encodeURIComponent(filename)}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Exports a detailed candidate dossier report.
   */
  async exportCandidateReport(candidateId: string, formatType: string = "markdown"): Promise<{ content: string, filePath: string, format: string }> {
    const response = await apiClient.post("/api/v1/report/export", {
      candidate_id: candidateId,
      format_type: formatType,
    });
    return response.data;
  },

  /**
   * Generates a side-by-side comparison for finalists.
   */
  async compareCandidates(candidateIds: string[], jobDescription: string = ""): Promise<any> {
    const response = await apiClient.post("/api/v1/copilot/compare", {
      candidate_ids: candidateIds,
      job_description: jobDescription,
    });
    return response.data;
  }
};
export type AnalyticsService = typeof analyticsService;
