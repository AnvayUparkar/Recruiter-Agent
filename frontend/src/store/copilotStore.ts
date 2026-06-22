import { create } from "zustand";

interface CopilotStoreState {
  activeReportFormat: "json" | "markdown" | "html";
  expandedQuestions: string[]; // Question categories (technical, behavioral, leadership, etc.)
  setActiveReportFormat: (format: "json" | "markdown" | "html") => void;
  toggleQuestionExpanded: (category: string) => void;
  clearCopilotSettings: () => void;
}

export const useCopilotStore = create<CopilotStoreState>((set) => ({
  activeReportFormat: "json",
  expandedQuestions: [],
  setActiveReportFormat: (activeReportFormat) => set({ activeReportFormat }),
  toggleQuestionExpanded: (category) =>
    set((state) => ({
      expandedQuestions: state.expandedQuestions.includes(category)
        ? state.expandedQuestions.filter((item) => item !== category)
        : [...state.expandedQuestions, category],
    })),
  clearCopilotSettings: () => set({ activeReportFormat: "json", expandedQuestions: [] }),
}));
export default useCopilotStore;
