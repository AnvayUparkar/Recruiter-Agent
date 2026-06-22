import React, { useState } from "react";
import { Shield, Sparkles, ChevronRight, Save, Trash2, AlertCircle } from "lucide-react";
import { useAdminStore } from "../../store/adminStore";

// Sub-components
import AdminSidebar from "./components/AdminSidebar";
import SystemOverviewCard from "./components/SystemOverviewCard";
import AIModelConfigPanel from "./components/AIModelConfigPanel";
import RankingWeightsEditor from "./components/RankingWeightsEditor";
import RetrievalConfigPanel from "./components/RetrievalConfigPanel";
import FeatureFlagsPanel from "./components/FeatureFlagsPanel";
import UserManagementPanel from "./components/UserManagementPanel";
import RolePermissionsPanel from "./components/RolePermissionsPanel";
import AuditLogViewer from "./components/AuditLogViewer";
import APIUsagePanel from "./components/APIUsagePanel";
import SystemDiagnosticsPanel from "./components/SystemDiagnosticsPanel";
import MaintenanceModePanel from "./components/MaintenanceModePanel";
import ConfigurationBackupPanel from "./components/ConfigurationBackupPanel";
import NotificationCenter from "./components/NotificationCenter";
import DangerZonePanel from "./components/DangerZonePanel";
import AdminActivityTimeline from "./components/AdminActivityTimeline";

export const AdminDashboardPage: React.FC = () => {
  const {
    activeTab,
    draftConfig,
    maintenanceMode,
    maintenanceBanner,
    showOnboarding,
    onboardingStep,
    saveDraft,
    revertDraft,
    setShowOnboarding,
    setOnboardingStep,
  } = useAdminStore();

  const [saving, setSaving] = useState(false);

  // Helper to determine modified sections
  const getModifiedSections = () => {
    if (!draftConfig) return [];
    const sections = [];
    if (draftConfig.ai) sections.push("AI Models");
    if (draftConfig.weights) sections.push("Scoring Weights");
    if (draftConfig.retrieval) sections.push("Retrieval settings");
    if (draftConfig.featureFlags) sections.push("Feature flags");
    return sections;
  };

  const modified = getModifiedSections();

  const handleSave = async () => {
    setSaving(true);
    // Simulate API save delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    saveDraft();
    setSaving(false);
  };

  // Onboarding walkthrough steps definition
  const tourSteps = [
    {
      title: "Platform Administration Control",
      text: "Welcome to the Enterprise Admin Console! Here you can monitor, configure, and override retrieval parameters.",
    },
    {
      title: "AI Model Config",
      text: "Switch primary language models, tune temperature sliders, or toggle streaming responses under the AI Calibrations tab.",
    },
    {
      title: "Normalized Weights Calibrations",
      text: "Tune ranking coefficients with live sum checks and test impact preview simulations on the fly.",
    },
    {
      title: "RBAC Access Lists",
      text: "Invite recruiting agents, update account roles, or inspect permission matrices under the User Access Control tab.",
    },
    {
      title: "Telemetry & Operation Logs",
      text: "Monitor hardware diagnostics, CPU usage rates, requests counts, and audit logs inside the Diagnostics & Logs section.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-6 min-w-0 pb-24 relative">
      {/* Maintenance Mode Header Warning Banner */}
      {maintenanceMode && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center justify-between text-xs font-semibold animate-pulse select-none">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{maintenanceBanner}</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Active Lockdown</span>
        </div>
      )}

      {/* Onboarding walktour tooltip cards */}
      {showOnboarding && (
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-600/10 to-purple-600/15 border border-blue-500/20 text-slate-800 dark:text-slate-200 relative overflow-hidden flex flex-col sm:flex-row justify-between gap-4">
          <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
          <div className="space-y-1 z-10">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-550 dark:text-blue-400 flex items-center gap-1.5 select-none">
              <Sparkles size={14} />
              Walkthrough Tour: {tourSteps[onboardingStep].title}
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-2xl font-medium leading-normal">
              {tourSteps[onboardingStep].text}
            </p>
          </div>

          <div className="flex items-center gap-2.5 z-10 text-xs shrink-0 self-end sm:self-center">
            <button
              onClick={() => setShowOnboarding(false)}
              className="text-slate-400 hover:text-slate-200 font-bold px-2 py-1 transition-colors select-none"
            >
              Skip Tour
            </button>
            <button
              onClick={() => {
                if (onboardingStep < tourSteps.length - 1) {
                  setOnboardingStep(onboardingStep + 1);
                } else {
                  setShowOnboarding(false);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-extrabold transition-all shadow shadow-blue-600/10 select-none"
            >
              <span>{onboardingStep === tourSteps.length - 1 ? "Get Started" : "Next Tip"}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3 font-sans">
            <Shield className="text-blue-500" size={24} />
            Enterprise Control Console
          </h1>
          <p className="text-xs text-slate-450 mt-0.5">Observe core engine diagnostics and configure scoring pipelines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Sidebar navigation */}
        <div className="md:col-span-3">
          <AdminSidebar />
        </div>

        {/* Right Side: content display grid */}
        <div className="md:col-span-9 space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <SystemOverviewCard />
                <NotificationCenter />
              </div>
              <div className="lg:col-span-4">
                <AdminActivityTimeline />
              </div>
            </div>
          )}

          {activeTab === "calibrations" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AIModelConfigPanel />
                <RetrievalConfigPanel />
              </div>
              <RankingWeightsEditor />
              <FeatureFlagsPanel />
            </div>
          )}

          {activeTab === "access" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <UserManagementPanel />
              </div>
              <div className="lg:col-span-4">
                <RolePermissionsPanel />
              </div>
            </div>
          )}

          {activeTab === "monitoring" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <APIUsagePanel />
                <SystemDiagnosticsPanel />
                <AuditLogViewer />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <MaintenanceModePanel />
                <ConfigurationBackupPanel />
                <DangerZonePanel />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Save Confirmation Footer (shown if draftConfig has items) */}
      {draftConfig && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur border border-slate-200/10 dark:border-slate-800/80 px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-8 max-w-xl w-[90%] select-none">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-black uppercase text-amber-500 tracking-wider block">Unsaved Calibrations</span>
            <p className="text-[10px] text-slate-400 truncate max-w-sm font-medium">
              Modified params: {modified.join(", ")}
            </p>
          </div>

          <div className="flex gap-2 text-xs shrink-0">
            <button
              onClick={revertDraft}
              className="px-3.5 py-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-extrabold rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Revert
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/35 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center gap-1.5"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {saving ? "Saving..." : "Apply Updates"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
