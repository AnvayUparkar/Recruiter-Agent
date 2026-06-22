import React from "react";
import { ToggleLeft, ShieldAlert } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";

export const FeatureFlagsPanel: React.FC = () => {
  const { activeConfig, draftConfig, updateFeatureFlagsDraft } = useAdminStore();

  const flags = {
    ...activeConfig.featureFlags,
    ...draftConfig?.featureFlags
  };

  const isChanged = (key: keyof typeof activeConfig.featureFlags) => {
    return draftConfig?.featureFlags?.[key] !== undefined && draftConfig.featureFlags[key] !== activeConfig.featureFlags[key];
  };

  const flagItems = [
    { key: "copilot" as const, label: "Recruiter Copilot Integration", description: "Enable interactive conversational chatbot guides on profiles deep-dives." },
    { key: "comparison" as const, label: "Candidate Comparison Workspace", description: "Allow recruiters to queue 2-5 finalists in side-by-side matrices." },
    { key: "analytics" as const, label: "Analytics Dashboard", description: "Expose system quality precision logs and statistics graphs to team leaders." },
    { key: "experimentalAI" as const, label: "Experimental AI Engines", description: "Enables unstable reasoning models for candidate summaries generation." },
    { key: "streamingResponses" as const, label: "Streaming Web Client Logs", description: "Render live token streaming feeds inside the Copilot dialogue UI." },
    { key: "advancedExplanations" as const, label: "Advanced Explanations Pipeline", description: "Generate secondary technical justification metrics for finalist matching scores." },
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <ToggleLeft className="text-blue-500" size={20} />
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Platform Feature Flags
          </h3>
          <p className="text-xs text-slate-400">Toggle application portals and experimental LLM pipelines</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flagItems.map((flag) => {
          const isActive = flags[flag.key];
          const changed = isChanged(flag.key);

          return (
            <div
              key={flag.key}
              className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-4 ${
                isActive
                  ? "bg-blue-600/5 border-blue-500/20"
                  : "bg-slate-500/5 border-slate-200/5"
              } ${changed ? "ring-1 ring-amber-500/30" : ""}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {flag.label}
                  </span>
                  {changed && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-500 font-black uppercase">
                      Unsaved
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal max-w-[240px]">
                  {flag.description}
                </p>
              </div>

              <button
                onClick={() => updateFeatureFlagsDraft({ [flag.key]: !isActive })}
                className={`w-10 h-5.5 rounded-full transition-colors duration-250 p-0.5 flex outline-none focus-ring relative shrink-0 ${
                  isActive ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
                }`}
                aria-label={`Toggle ${flag.label}`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-250 shadow-sm ${
                    isActive ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5">
        <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={14} />
        <p className="text-[10px] text-slate-400 leading-normal">
          <strong>Security Notice:</strong> Disabling production portals (such as Candidate Comparison or Analytics) restricts API queries from unauthorized sessions instantly. Ensure changes are verified.
        </p>
      </div>
    </div>
  );
};

export default FeatureFlagsPanel;
