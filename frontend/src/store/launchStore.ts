import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BackupLog {
  id: string;
  name: string;
  type: string;
  timestamp: number;
  sizeBytes: number;
}

export interface LaunchChecklistState {
  // Security
  httpsEnabled: boolean;
  secretsExternalized: boolean;
  corsConfigured: boolean;
  rateLimitingEnabled: boolean;
  authSecure: boolean;
  // QA & Testing
  unitTestsPassed: boolean;
  accessibilityAudited: boolean;
  responsiveVerified: boolean;
  offlineReady: boolean;
  // DevOps
  ciCdConfigured: boolean;
  backupsEnabled: boolean;
  monitoringConfigured: boolean;
  healthChecksActive: boolean;
}

interface LaunchStore {
  checklist: LaunchChecklistState;
  environment: "development" | "staging" | "production";
  backupLogs: BackupLog[];
  expandedSections: string[];
  recentIncidents: Array<{ id: string; event: string; status: string; time: string }>;
  
  toggleCheckItem: (key: keyof LaunchChecklistState) => void;
  setEnvironment: (env: "development" | "staging" | "production") => void;
  addBackupLog: (name: string, type: string, sizeBytes: number) => void;
  toggleSection: (sectionId: string) => void;
  clearBackupLogs: () => void;
  resetChecklist: () => void;
}

const INITIAL_CHECKLIST: LaunchChecklistState = {
  httpsEnabled: true,
  secretsExternalized: true,
  corsConfigured: true,
  rateLimitingEnabled: false,
  authSecure: true,
  unitTestsPassed: false,
  accessibilityAudited: true,
  responsiveVerified: true,
  offlineReady: true,
  ciCdConfigured: false,
  backupsEnabled: true,
  monitoringConfigured: false,
  healthChecksActive: true,
};

export const useLaunchStore = create<LaunchStore>()(
  persist(
    (set) => ({
      checklist: INITIAL_CHECKLIST,
      environment: "staging",
      backupLogs: [
        {
          id: "bk-001",
          name: "recruiter_configs_default.json",
          type: "Configurations",
          timestamp: Date.now() - 24 * 60 * 60 * 1000,
          sizeBytes: 1540
        }
      ],
      expandedSections: ["checklist", "monitoring", "presentation"],
      recentIncidents: [
        { id: "inc-01", event: "Vite dev bundle cache rebuilt", status: "Resolved", time: "10m ago" },
        { id: "inc-02", event: "FAISS Vector search index refreshed", status: "Active", time: "1h ago" },
        { id: "inc-03", event: "PWA Service Worker registered", status: "Resolved", time: "2h ago" }
      ],

      toggleCheckItem: (key) =>
        set((state) => ({
          checklist: {
            ...state.checklist,
            [key]: !state.checklist[key],
          },
        })),

      setEnvironment: (env) => set({ environment: env }),

      addBackupLog: (name, type, sizeBytes) => {
        const newLog: BackupLog = {
          id: `bk-${Math.random().toString(36).substring(2, 7)}`,
          name,
          type,
          timestamp: Date.now(),
          sizeBytes
        };
        set((state) => ({
          backupLogs: [newLog, ...state.backupLogs]
        }));
      },

      toggleSection: (sectionId) =>
        set((state) => ({
          expandedSections: state.expandedSections.includes(sectionId)
            ? state.expandedSections.filter((id) => id !== sectionId)
            : [...state.expandedSections, sectionId],
        })),

      clearBackupLogs: () => set({ backupLogs: [] }),

      resetChecklist: () => set({ checklist: INITIAL_CHECKLIST }),
    }),
    {
      name: "antigravity-launch-store",
    }
  )
);
