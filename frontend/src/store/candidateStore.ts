import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CandidateStoreState {
  selectedCandidateId: string | null;
  comparisonCandidateIds: string[];
  preferredChartType: "radar" | "bar";
  expandedSections: string[];
  setSelectedCandidateId: (id: string | null) => void;
  addComparisonCandidate: (id: string) => boolean; // returns true if added successfully
  removeComparisonCandidate: (id: string) => void;
  clearComparison: () => void;
  setPreferredChartType: (type: "radar" | "bar") => void;
  toggleExpandedSection: (sectionId: string) => void;
  setComparisonCandidateIds: (ids: string[]) => void;
}

export const useCandidateStore = create<CandidateStoreState>()(
  persist(
    (set, get) => ({
      selectedCandidateId: null,
      comparisonCandidateIds: [],
      preferredChartType: "radar",
      expandedSections: ["scores", "skills", "reliability", "timeline"],
      setSelectedCandidateId: (id) => set({ selectedCandidateId: id }),
      addComparisonCandidate: (id) => {
        const currentList = get().comparisonCandidateIds;
        if (currentList.includes(id)) {
          return false; // Already present
        }
        if (currentList.length >= 5) {
          return false; // Limit reached (max 5 finalists)
        }
        set({ comparisonCandidateIds: [...currentList, id] });
        return true;
      },
      removeComparisonCandidate: (id) => {
        set({
          comparisonCandidateIds: get().comparisonCandidateIds.filter((item) => item !== id),
        });
      },
      clearComparison: () => set({ comparisonCandidateIds: [] }),
      setPreferredChartType: (type) => set({ preferredChartType: type }),
      toggleExpandedSection: (sectionId) => {
        const current = get().expandedSections;
        if (current.includes(sectionId)) {
          set({ expandedSections: current.filter((s) => s !== sectionId) });
        } else {
          set({ expandedSections: [...current, sectionId] });
        }
      },
      setComparisonCandidateIds: (ids) => set({ comparisonCandidateIds: ids }),
    }),
    {
      name: "candidate-comparison-store",
    }
  )
);

