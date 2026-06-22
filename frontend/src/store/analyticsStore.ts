import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ExportHistoryItem {
  id: string;
  type: string;
  filename: string;
  created: string;
  rowCount: number;
  sha256Hash: string;
  status: "completed" | "failed";
}

interface AnalyticsStoreState {
  selectedChart: "ndcg" | "precision" | "latency";
  timeframe: "24h" | "7d" | "30d";
  filters: {
    jobId: string;
    experience: string;
    recommendation: string;
    location: string;
    reliability: string;
  };
  exportHistory: ExportHistoryItem[];
  setSelectedChart: (chart: "ndcg" | "precision" | "latency") => void;
  setTimeframe: (timeframe: "24h" | "7d" | "30d") => void;
  setFilters: (filters: Partial<AnalyticsStoreState["filters"]>) => void;
  resetFilters: () => void;
  addExportHistoryItem: (item: Omit<ExportHistoryItem, "id" | "created">) => void;
  clearExportHistory: () => void;
}

export const useAnalyticsStore = create<AnalyticsStoreState>()(
  persist(
    (set) => ({
      selectedChart: "ndcg",
      timeframe: "7d",
      filters: {
        jobId: "all",
        experience: "all",
        recommendation: "all",
        location: "all",
        reliability: "all",
      },
      exportHistory: [
        {
          id: "exp_1",
          type: "CSV Export",
          filename: "candidate_submission_CAND_POOL.csv",
          created: new Date(Date.now() - 3600000).toISOString(),
          rowCount: 100,
          sha256Hash: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
          status: "completed",
        }
      ],
      setSelectedChart: (selectedChart) => set({ selectedChart }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setFilters: (newFilters) =>
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      resetFilters: () =>
        set({
          filters: {
            jobId: "all",
            experience: "all",
            recommendation: "all",
            location: "all",
            reliability: "all",
          },
        }),
      addExportHistoryItem: (item) =>
        set((state) => ({
          exportHistory: [
            {
              ...item,
              id: `exp_${Date.now()}`,
              created: new Date().toISOString(),
            },
            ...state.exportHistory,
          ],
        })),
      clearExportHistory: () => set({ exportHistory: [] }),
    }),
    {
      name: "analytics-store",
    }
  )
);

