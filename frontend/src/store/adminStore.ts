import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AIConfig {
  activeLLM: string;
  embeddingModel: string;
  rankingModel: string;
  copilotModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
}

export interface RankingWeights {
  techWeight: number;
  behaviorWeight: number;
  reliabilityWeight: number;
  leadershipWeight: number;
  marketWeight: number;
  matchWeight: number;
  confidenceMultiplier: number;
}

export interface RetrievalConfig {
  topK: number;
  hybridRatio: number; // weight of vector search (0 to 1)
  similarityThreshold: number;
  keywordBoost: number;
  rerankingLimit: number;
  deduplication: boolean;
  chunkSize: number;
}

export interface FeatureFlags {
  copilot: boolean;
  comparison: boolean;
  analytics: boolean;
  experimentalAI: boolean;
  streamingResponses: boolean;
  advancedExplanations: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Recruiter" | "Hiring Manager" | "Viewer";
  status: "Active" | "Blocked" | "Pending";
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: "Security" | "Model Config" | "Ranking Weights" | "System" | "Export";
  details: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: string;
}

interface AdminStoreState {
  activeTab: "overview" | "calibrations" | "access" | "monitoring";
  showOnboarding: boolean;
  onboardingStep: number;
  maintenanceMode: boolean;
  maintenanceBanner: string;
  
  // Configurations
  activeConfig: {
    ai: AIConfig;
    weights: RankingWeights;
    retrieval: RetrievalConfig;
    featureFlags: FeatureFlags;
  };
  
  // Diff engine draft config (contains local modifications)
  draftConfig: {
    ai?: Partial<AIConfig>;
    weights?: Partial<RankingWeights>;
    retrieval?: Partial<RetrievalConfig>;
    featureFlags?: Partial<FeatureFlags>;
  } | null;

  // Collections
  users: SystemUser[];
  auditLogs: AuditLog[];
  notifications: AdminNotification[];
  
  // Core Actions
  setActiveTab: (tab: AdminStoreState["activeTab"]) => void;
  setShowOnboarding: (show: boolean) => void;
  setOnboardingStep: (step: number) => void;
  setMaintenanceMode: (enabled: boolean, banner?: string) => void;
  
  // Config Updates (Drafts & Save)
  updateAIDraft: (updates: Partial<AIConfig>) => void;
  updateWeightsDraft: (updates: Partial<RankingWeights>) => void;
  updateRetrievalDraft: (updates: Partial<RetrievalConfig>) => void;
  updateFeatureFlagsDraft: (updates: Partial<FeatureFlags>) => void;
  
  saveDraft: () => void;
  revertDraft: () => void;
  resetWeightsToDefault: () => void;
  importConfig: (imported: AdminStoreState["activeConfig"]) => boolean;
  
  // User Actions
  updateUserRole: (id: string, role: SystemUser["role"]) => void;
  updateUserStatus: (id: string, status: SystemUser["status"]) => void;
  addUser: (user: Omit<SystemUser, "id" | "lastLogin">) => void;
  
  // Logs & Notification Actions
  addAuditLog: (action: string, category: AuditLog["category"], details: string) => void;
  addNotification: (title: string, message: string, type: AdminNotification["type"]) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  techWeight: 0.30,
  behaviorWeight: 0.15,
  reliabilityWeight: 0.20,
  leadershipWeight: 0.10,
  marketWeight: 0.10,
  matchWeight: 0.15,
  confidenceMultiplier: 1.10,
};

const INITIAL_STATE = {
  ai: {
    activeLLM: "gpt-4o",
    embeddingModel: "text-embedding-3-large",
    rankingModel: "cross-encoder-ms-marco",
    copilotModel: "gpt-4o-mini",
    fallbackModel: "gpt-3.5-turbo",
    temperature: 0.2,
    maxTokens: 2048,
    streaming: true,
  },
  weights: { ...DEFAULT_WEIGHTS },
  retrieval: {
    topK: 50,
    hybridRatio: 0.7,
    similarityThreshold: 0.65,
    keywordBoost: 1.2,
    rerankingLimit: 15,
    deduplication: true,
    chunkSize: 1000,
  },
  featureFlags: {
    copilot: true,
    comparison: true,
    analytics: true,
    experimentalAI: false,
    streamingResponses: true,
    advancedExplanations: true,
  },
};

export const useAdminStore = create<AdminStoreState>()(
  persist(
    (set) => ({
      activeTab: "overview",
      showOnboarding: true,
      onboardingStep: 0,
      maintenanceMode: false,
      maintenanceBanner: "SYSTEM MAINTENANCE: The platform will undergo database calibrations tonight at 02:00 UTC.",
      
      activeConfig: { ...INITIAL_STATE },
      draftConfig: null,
      
      users: [
        { id: "usr_1", name: "Sarah Jenkins", email: "sarah.j@redrob-recruiting.com", role: "Admin", status: "Active", lastLogin: new Date(Date.now() - 600000).toISOString() },
        { id: "usr_2", name: "David Miller", email: "david.m@redrob-recruiting.com", role: "Recruiter", status: "Active", lastLogin: new Date(Date.now() - 3600000).toISOString() },
        { id: "usr_3", name: "Elena Rostova", email: "elena.r@finance-partners.com", role: "Hiring Manager", status: "Active", lastLogin: new Date(Date.now() - 86400000).toISOString() },
        { id: "usr_4", name: "Mark Chen", email: "m.chen@hackathon-judging.local", role: "Viewer", status: "Active", lastLogin: new Date(Date.now() - 172800000).toISOString() },
        { id: "usr_5", name: "Alex Thompson", email: "alex.t@external-sourcing.org", role: "Recruiter", status: "Pending", lastLogin: "Never" },
      ],
      
      auditLogs: [
        { id: "log_1", timestamp: new Date(Date.now() - 7200000).toISOString(), user: "Sarah Jenkins", action: "Updated Retrieval Configuration", category: "Model Config", details: "Changed Top-K from 40 to 50 and hybrid search ratio to 0.7." },
        { id: "log_2", timestamp: new Date(Date.now() - 14400000).toISOString(), user: "Sarah Jenkins", action: "Toggle Feature Flag", category: "System", details: "Enabled Recruiter Copilot globally." },
        { id: "log_3", timestamp: new Date(Date.now() - 86400000).toISOString(), user: "System Scheduler", action: "Automated Configuration Snapshot", category: "Export", details: "Successfully generated configurations checksum hash: 7e8ad9c8." },
        { id: "log_4", timestamp: new Date(Date.now() - 172800000).toISOString(), user: "David Miller", action: "Exported Candidate Leaderboard", category: "Export", details: "Downloaded pool export with SHA-256 hash ending in 20015ad." },
        { id: "log_5", timestamp: new Date(Date.now() - 259200000).toISOString(), user: "Sarah Jenkins", action: "Updated Permissions Matrix", category: "Security", details: "Promoted Elena Rostova to Hiring Manager role." },
      ],
      
      notifications: [
        { id: "notif_1", title: "Configuration Snapshot Synced", message: "Live weights and models verified and saved to server metadata storage.", type: "success", timestamp: new Date(Date.now() - 1200000).toISOString() },
        { id: "notif_2", title: "High Query Latency Detected", message: "Average LLM parsing latency reached 3,400ms. Monitoring connection queues.", type: "warning", timestamp: new Date(Date.now() - 3600000).toISOString() },
      ],

      setActiveTab: (activeTab) => set({ activeTab }),
      setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
      setMaintenanceMode: (maintenanceMode, banner) => {
        const currentUser = "Sarah Jenkins";
        set((state) => ({
          maintenanceMode,
          maintenanceBanner: banner || state.maintenanceBanner,
          auditLogs: [
            {
              id: `log_${Date.now()}`,
              timestamp: new Date().toISOString(),
              user: currentUser,
              action: maintenanceMode ? "Enabled Maintenance Mode" : "Disabled Maintenance Mode",
              category: "System",
              details: maintenanceMode 
                ? `System locked for maintenance with banner: "${banner || state.maintenanceBanner}"`
                : "System returned to active production routing."
            },
            ...state.auditLogs
          ]
        }));
      },
      
      // Initialize drafts on demand
      updateAIDraft: (updates) => set((state) => {
        const currentDraft = state.draftConfig || {};
        return {
          draftConfig: {
            ...currentDraft,
            ai: { ...(currentDraft.ai || state.activeConfig.ai), ...updates }
          }
        };
      }),
      
      updateWeightsDraft: (updates) => set((state) => {
        const currentDraft = state.draftConfig || {};
        return {
          draftConfig: {
            ...currentDraft,
            weights: { ...(currentDraft.weights || state.activeConfig.weights), ...updates }
          }
        };
      }),
      
      updateRetrievalDraft: (updates) => set((state) => {
        const currentDraft = state.draftConfig || {};
        return {
          draftConfig: {
            ...currentDraft,
            retrieval: { ...(currentDraft.retrieval || state.activeConfig.retrieval), ...updates }
          }
        };
      }),
      
      updateFeatureFlagsDraft: (updates) => set((state) => {
        const currentDraft = state.draftConfig || {};
        return {
          draftConfig: {
            ...currentDraft,
            featureFlags: { ...(currentDraft.featureFlags || state.activeConfig.featureFlags), ...updates }
          }
        };
      }),
      
      saveDraft: () => set((state) => {
        if (!state.draftConfig) return {};
        
        const mergedAI = { ...state.activeConfig.ai, ...state.draftConfig.ai };
        const mergedWeights = { ...state.activeConfig.weights, ...state.draftConfig.weights };
        const mergedRetrieval = { ...state.activeConfig.retrieval, ...state.draftConfig.retrieval };
        const mergedFlags = { ...state.activeConfig.featureFlags, ...state.draftConfig.featureFlags };
        
        const currentUser = "Sarah Jenkins";
        const newLogs: AuditLog[] = [];
        
        if (state.draftConfig.ai) {
          newLogs.push({
            id: `log_ai_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: currentUser,
            action: "Updated AI Model Configurations",
            category: "Model Config",
            details: `Updated model settings. Temp: ${mergedAI.temperature}, active LLM: ${mergedAI.activeLLM}.`
          });
        }
        
        if (state.draftConfig.weights) {
          newLogs.push({
            id: `log_w_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: currentUser,
            action: "Recalibrated Ranking Weights",
            category: "Ranking Weights",
            details: `Recalibrated scoring model. Tech: ${mergedWeights.techWeight}, Reliability: ${mergedWeights.reliabilityWeight}, Matching: ${mergedWeights.matchWeight}.`
          });
        }

        if (state.draftConfig.retrieval) {
          newLogs.push({
            id: `log_r_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: currentUser,
            action: "Configured Retrieval Hyperparameters",
            category: "Model Config",
            details: `Adjusted Top-K: ${mergedRetrieval.topK}, hybrid ratio: ${mergedRetrieval.hybridRatio}.`
          });
        }
        
        if (state.draftConfig.featureFlags) {
          newLogs.push({
            id: `log_ff_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: currentUser,
            action: "Modified Platform Feature Flags",
            category: "System",
            details: `Flags updated: ${Object.entries(state.draftConfig.featureFlags).map(([k, v]) => `${k}=${v}`).join(", ")}`
          });
        }

        return {
          activeConfig: {
            ai: mergedAI,
            weights: mergedWeights,
            retrieval: mergedRetrieval,
            featureFlags: mergedFlags,
          },
          draftConfig: null,
          auditLogs: [...newLogs, ...state.auditLogs],
          notifications: [
            {
              id: `notif_${Date.now()}`,
              title: "Changes Saved Successfully",
              message: "Platform settings have been synced and updated across all gateway nodes.",
              type: "success",
              timestamp: new Date().toISOString()
            },
            ...state.notifications
          ]
        };
      }),
      
      revertDraft: () => set({ draftConfig: null }),
      
      resetWeightsToDefault: () => set((state) => {
        const currentDraft = state.draftConfig || {};
        return {
          draftConfig: {
            ...currentDraft,
            weights: { ...DEFAULT_WEIGHTS }
          }
        };
      }),
      
      importConfig: (imported) => {
        // Validation check
        if (
          !imported ||
          typeof imported.ai !== "object" ||
          typeof imported.weights !== "object" ||
          typeof imported.retrieval !== "object" ||
          typeof imported.featureFlags !== "object"
        ) {
          return false;
        }
        
        set((state) => ({
          activeConfig: {
            ai: { ...state.activeConfig.ai, ...imported.ai },
            weights: { ...state.activeConfig.weights, ...imported.weights },
            retrieval: { ...state.activeConfig.retrieval, ...imported.retrieval },
            featureFlags: { ...state.activeConfig.featureFlags, ...imported.featureFlags },
          },
          draftConfig: null,
          auditLogs: [
            {
              id: `log_import_${Date.now()}`,
              timestamp: new Date().toISOString(),
              user: "Sarah Jenkins",
              action: "Imported Configuration Profile",
              category: "System",
              details: "Successfully validated and imported external configuration JSON snapshot."
            },
            ...state.auditLogs
          ],
          notifications: [
            {
              id: `notif_imp_${Date.now()}`,
              title: "Configuration Imported",
              message: "Imported configuration verified and deployed successfully.",
              type: "success",
              timestamp: new Date().toISOString()
            },
            ...state.notifications
          ]
        }));
        
        return true;
      },
      
      updateUserRole: (id, role) => set((state) => {
        const target = state.users.find(u => u.id === id);
        return {
          users: state.users.map(u => u.id === id ? { ...u, role } : u),
          auditLogs: [
            {
              id: `log_usr_${Date.now()}`,
              timestamp: new Date().toISOString(),
              user: "Sarah Jenkins",
              action: "Modified User Access Role",
              category: "Security",
              details: `Changed role of user ${target?.name || id} to ${role}.`
            },
            ...state.auditLogs
          ]
        };
      }),
      
      updateUserStatus: (id, status) => set((state) => {
        const target = state.users.find(u => u.id === id);
        return {
          users: state.users.map(u => u.id === id ? { ...u, status } : u),
          auditLogs: [
            {
              id: `log_status_${Date.now()}`,
              timestamp: new Date().toISOString(),
              user: "Sarah Jenkins",
              action: `User ${status === "Blocked" ? "Blocked" : "Activated"}`,
              category: "Security",
              details: `Set account status of ${target?.name || id} to ${status}.`
            },
            ...state.auditLogs
          ]
        };
      }),
      
      addUser: (user) => set((state) => {
        const newUser: SystemUser = {
          ...user,
          id: `usr_${Date.now()}`,
          lastLogin: "Never",
        };
        return {
          users: [...state.users, newUser],
          auditLogs: [
            {
              id: `log_add_${Date.now()}`,
              timestamp: new Date().toISOString(),
              user: "Sarah Jenkins",
              action: "Created New System User",
              category: "Security",
              details: `Invited user ${user.name} (${user.email}) with role ${user.role}.`
            },
            ...state.auditLogs
          ]
        };
      }),
      
      addAuditLog: (action, category, details) => set((state) => ({
        auditLogs: [
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: "Sarah Jenkins",
            action,
            category,
            details,
          },
          ...state.auditLogs
        ]
      })),
      
      addNotification: (title, message, type) => set((state) => ({
        notifications: [
          {
            id: `notif_${Date.now()}`,
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
          },
          ...state.notifications
        ]
      })),
      
      dismissNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "admin-store",
    }
  )
);
