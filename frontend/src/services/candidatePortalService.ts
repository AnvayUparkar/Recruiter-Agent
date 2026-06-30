import { apiClient as api } from "../api/client";
import { JobPosting } from "../types/common";
import { API_BASE_PREFIX } from "../api/endpoints";

export interface CandidateApplication {
  _id: string;
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  status: string;
  applied_at: string;
  match_score_snapshot: number;
}

export const candidatePortalService = {
  getJobs: async (): Promise<JobPosting[]> => {
    const { data } = await api.get<{ status: string; data: JobPosting[] }>(`${API_BASE_PREFIX}/portal/jobs`);
    return data.data;
  },

  getJobDetails: async (id: string): Promise<JobPosting> => {
    const { data } = await api.get<{ status: string; data: JobPosting }>(`${API_BASE_PREFIX}/portal/jobs/${id}`);
    return data.data;
  },

  getJobMatch: async (id: string) => {
    const { data } = await api.get<{ status: string; data: any }>(`${API_BASE_PREFIX}/portal/jobs/${id}/match`);
    return data.data;
  },

  applyToJob: async (id: string) => {
    const { data } = await api.post<{ status: string; message: string }>(`${API_BASE_PREFIX}/portal/jobs/${id}/apply`);
    return data;
  },

  getMyApplications: async (): Promise<CandidateApplication[]> => {
    const { data } = await api.get<{ status: string; data: CandidateApplication[] }>(`${API_BASE_PREFIX}/portal/applications`);
    return data.data;
  },

  saveJob: async (id: string) => {
    const { data } = await api.post(`${API_BASE_PREFIX}/portal/jobs/${id}/save`);
    return data;
  },

  unsaveJob: async (id: string) => {
    const { data } = await api.delete(`${API_BASE_PREFIX}/portal/jobs/${id}/save`);
    return data;
  },

  getSavedJobs: async (): Promise<JobPosting[]> => {
    const { data } = await api.get<{ status: string; data: JobPosting[] }>(`${API_BASE_PREFIX}/portal/saved-jobs`);
    return data.data;
  },
};
