import React, { useState } from "react";
import { AlertOctagon, ShieldAlert } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";

export const DangerZonePanel: React.FC = () => {
  const { resetWeightsToDefault, addNotification, addAuditLog } = useAdminStore();
  const [showModal, setShowModal] = useState<"weights" | "cache" | "exports" | "disableAI" | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const handleAction = (action: typeof showModal) => {
    if (confirmText !== "CONFIRM") return;

    
    if (action === "weights") {
      resetWeightsToDefault();
      addNotification("Ranking Weights Reset", "Heuristic weights returned to default values in draft mode.", "success");
      addAuditLog("Reset Calibrated Weights", "Ranking Weights", "Restored standard factory weights in configuration drafts.");
    } else if (action === "cache") {
      addNotification("System Cache Cleared", "LRU and Redis vector index cache buffers cleared.", "success");
      addAuditLog("Cleared Indices Caches", "System", "Manual flush of system similarity index query caches.");
    } else if (action === "exports") {
      addNotification("Export Files Purged", "Cleaned all stored CSV and JSON leaderboard documents.", "warning");
      addAuditLog("Purged Leaderboard Files", "Export", "Flushed local outputs/submissions directories.");
    } else if (action === "disableAI") {
      addNotification("Inference Pipeline Disabled", "Terminated core model execution loops.", "error");
      addAuditLog("Suspended AI Core Pipeline", "Security", "Executed platform-wide emergency model freeze.");
    }

    setConfirmText("");
    setShowModal(null);
  };

  const getModalTitle = (action: typeof showModal) => {
    switch (action) {
      case "weights": return "Reset Calibrations Weights";
      case "cache": return "Purge System Caches";
      case "exports": return "Delete Saved Exports Files";
      case "disableAI": return "Emergency System Freeze";
      default: return "";
    }
  };

  const getModalWarning = (action: typeof showModal) => {
    switch (action) {
      case "weights": return "This restores standard parameters (30% Tech, 20% Reliability, 15% Match etc.) in configuration drafts, discarding active calibrations.";
      case "cache": return "This clears all cached sentence embeddings and parsed JDs from memory. Next queries might experience higher API latencies.";
      case "exports": return "Permanently deletes all candidate CSV listings from the server directory. Checksums records will be preserved.";
      case "disableAI": return "EMERGENCY ONLY: Completely halts language processing pathways. Rerank services will refuse connection requests instantly.";
      default: return "";
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-rose-500/10 dark:border-rose-950/20 bg-rose-500/[0.02] shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.02] rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <AlertOctagon className="text-rose-500" size={20} />
        <div>
          <h3 className="text-base font-extrabold text-rose-500 font-sans">Danger Zone</h3>
          <p className="text-xs text-slate-400">Irreversible cluster modifications and emergency access locks</p>
        </div>
      </div>

      <div className="divide-y divide-rose-500/10 dark:divide-rose-950/20 text-xs">
        {/* Reset weights */}
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0">
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Reset scoring calibrations</span>
            <p className="text-[10px] text-slate-400 max-w-md">Resets active weights weights to balanced values in draft configuration.</p>
          </div>
          <button
            onClick={() => setShowModal("weights")}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold rounded-lg transition-colors text-[11px] shrink-0 self-start sm:self-center"
          >
            Reset Weights
          </button>
        </div>

        {/* Clear caches */}
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Clear index cache caches</span>
            <p className="text-[10px] text-slate-400 max-w-md">Flushes similarity vectors cache database. Use when index outputs feel out of sync.</p>
          </div>
          <button
            onClick={() => setShowModal("cache")}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold rounded-lg transition-colors text-[11px] shrink-0 self-start sm:self-center"
          >
            Flush Caches
          </button>
        </div>

        {/* Delete exports */}
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Purge outputs file directory</span>
            <p className="text-[10px] text-slate-400 max-w-md">Deletes saved CSV outputs. Free up backend disk storage space.</p>
          </div>
          <button
            onClick={() => setShowModal("exports")}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold rounded-lg transition-colors text-[11px] shrink-0 self-start sm:self-center"
          >
            Purge Exports
          </button>
        </div>

        {/* Emergency Halt */}
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 last:pb-0">
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Freeze LLM processing pipelines</span>
            <p className="text-[10px] text-slate-400 max-w-md">EMERGENCY: Shuts down Copilots and scoring routes in case of billing spikes or API issues.</p>
          </div>
          <button
            onClick={() => setShowModal("disableAI")}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg transition-colors text-[11px] shrink-0 self-start sm:self-center shadow-lg shadow-rose-600/10"
          >
            Freeze System
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => {
              setConfirmText("");
              setShowModal(null);
            }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
          />
          
          <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 dark:border-rose-950/40 bg-[#0d1117] shadow-2xl w-full max-w-sm relative z-10 space-y-4">
            <div className="flex gap-3 text-rose-500">
              <ShieldAlert size={24} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {getModalTitle(showModal)}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  {getModalWarning(showModal)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">
                Type <span className="text-rose-500">CONFIRM</span> to verify action
              </label>
              <input
                type="text"
                placeholder="Type CONFIRM"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus-ring font-bold font-sans text-center tracking-widest"
              />
            </div>

            <div className="flex gap-2 text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmText("");
                  setShowModal(null);
                }}
                className="flex-1 py-2 bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200/5 rounded-xl font-extrabold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(showModal)}
                disabled={confirmText !== "CONFIRM"}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-35 text-white rounded-xl font-extrabold transition-all"
              >
                Verify & Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerZonePanel;
