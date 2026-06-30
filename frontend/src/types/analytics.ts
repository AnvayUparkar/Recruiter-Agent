export interface DashboardMetrics {
  totalCandidates: number;
  activeNoticePeriodAvg: number;
  responseRateAvg: number;
  averageCompletenessScore: number;
  averageQualityScore: number;
  averageReliabilityScore: number;
}

export interface EvaluationReport {
  generatedAt: string;
  ndcgAt5: number;
  precisionAt5: number;
  mrr: number;
  systemLatencyAvgMs: number;
  totalQueriesLogged: number;
}

export interface SubmissionResult {
  exportPath: string;
  sha256Hash: string;
  rowCount: number;
  timestamp: string;
  csvContent?: string;
}
