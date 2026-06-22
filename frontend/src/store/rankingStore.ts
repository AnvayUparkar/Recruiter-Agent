import { create } from "zustand";

interface RankingStoreState {
  strategy: "balanced" | "technical_first" | "engagement_first";
  limit: number;
  searchQuery: string;
  sortField: string;
  sortDirection: "asc" | "desc";
  setStrategy: (strategy: "balanced" | "technical_first" | "engagement_first") => void;
  setLimit: (limit: number) => void;
  setSearchQuery: (query: string) => void;
  setSort: (field: string, direction: "asc" | "desc") => void;
  resetFilters: () => void;
}

export const useRankingStore = create<RankingStoreState>((set) => ({
  strategy: "balanced",
  limit: 100,
  searchQuery: "",
  sortField: "rank",
  sortDirection: "asc",
  setStrategy: (strategy) => set({ strategy }),
  setLimit: (limit) => set({ limit }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSort: (sortField, sortDirection) => set({ sortField, sortDirection }),
  resetFilters: () => set({
    strategy: "balanced",
    limit: 100,
    searchQuery: "",
    sortField: "rank",
    sortDirection: "asc",
  }),
}));
export default useRankingStore;
