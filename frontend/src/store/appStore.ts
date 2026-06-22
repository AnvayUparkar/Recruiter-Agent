import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ParsedJD } from "../types/common";
import { RankedCandidate } from "../types/ranking";

interface AppState {
  activeJDText: string;
  activeJD: ParsedJD | null;
  parsedJD: ParsedJD | null; // keep for backwards compatibility
  rankingResults: RankedCandidate[];
  rankingStatus: "idle" | "loading" | "success" | "error";
  setActiveJDText: (text: string) => void;
  setActiveJD: (jd: ParsedJD | null) => void;
  setParsedJD: (jd: ParsedJD | null) => void; // keep for backwards compatibility
  setRankingResults: (r: RankedCandidate[]) => void;
  setRankingStatus: (status: "idle" | "loading" | "success" | "error") => void;
  clearAll: () => void;
  resetApp: () => void; // keep for backwards compatibility
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeJDText: "",
      activeJD: null,
      parsedJD: null,
      rankingResults: [],
      rankingStatus: "idle",
      setActiveJDText: (text) => set({ activeJDText: text }),
      setActiveJD: (jd) => set({ activeJD: jd, parsedJD: jd }),
      setParsedJD: (jd) => set({ parsedJD: jd, activeJD: jd }),
      setRankingResults: (r) => set({ rankingResults: r }),
      setRankingStatus: (status) => set({ rankingStatus: status }),
      clearAll: () =>
        set({
          activeJDText: "",
          activeJD: null,
          parsedJD: null,
          rankingResults: [],
          rankingStatus: "idle",
        }),
      resetApp: () =>
        set({
          activeJDText: "",
          activeJD: null,
          parsedJD: null,
          rankingResults: [],
          rankingStatus: "idle",
        }),
    }),
    {
      name: "antigravity-app-store",
      // Merge ensures new keys (like rankingResults) get their defaults
      // even if the localStorage snapshot is from an older store shape.
      merge: (persisted: unknown, current: AppState): AppState => {
        const p = (persisted || {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          // Always guarantee rankingResults is an array (never undefined/null)
          rankingResults: Array.isArray(p.rankingResults) ? p.rankingResults : [],
          // Always reset transient loading state on startup
          rankingStatus: "idle",
        };
      },
    }
  )
);
