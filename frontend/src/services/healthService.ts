import { apiClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { AppHealth } from "../types/common";

export const healthService = {
  /**
   * Evaluates application state including sentence transformers, FAISS, and BM25 index readiness.
   */
  async fetchHealth(): Promise<AppHealth> {
    const response = await apiClient.get<AppHealth>(ENDPOINTS.HEALTH);
    return response.data;
  },

  /**
   * Retrieves active metadata version properties.
   */
  async fetchVersion(): Promise<Record<string, string>> {
    const response = await apiClient.get<Record<string, string>>(ENDPOINTS.VERSION);
    return response.data;
  },
};
export type HealthService = typeof healthService;
