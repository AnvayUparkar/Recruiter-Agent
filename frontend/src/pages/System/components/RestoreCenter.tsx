import React, { useState } from "react";
import { Upload, RefreshCw, AlertTriangle, Database } from "lucide-react";
import { useToastStore } from "../../../store/toastStore";
import { useLaunchStore } from "../../../store/launchStore";

export const RestoreCenter: React.FC = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [restoreType, setRestoreType] = useState<"custom" | "factory" | null>(null);
  const toastStore = useToastStore();
  const { resetChecklist } = useLaunchStore();

  const triggerRestore = (type: "custom" | "factory") => {
    setRestoreType(type);
    setShowConfirm(true);
  };

  const executeRestore = () => {
    toastStore.loading("Initiating system restoration process...");
    setShowConfirm(false);

    setTimeout(() => {
      if (restoreType === "factory") {
        resetChecklist();
        toastStore.success("Factory configurations and launch checklists restored successfully!");
      } else {
        toastStore.success("Custom parameters imported successfully!");
      }
      setRestoreType(null);
    }, 1200);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Database size={16} className="text-blue-500" />
        <span>System Restoration & Recovery</span>
      </h3>
      <p className="text-[10px] text-slate-500 leading-normal">
        Upload settings backups archives to restore prior scoring formulas, or restore factory defaults to reset the dashboard.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => triggerRestore("custom")}
          className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex flex-col items-center gap-2 transition-colors focus-ring outline-none"
        >
          <Upload size={18} className="text-blue-500" />
          <div className="flex flex-col items-center">
            <span>Import Configuration</span>
            <span className="text-[9px] text-slate-500 font-medium mt-0.5">Upload JSON backup file</span>
          </div>
        </button>

        <button
          onClick={() => triggerRestore("factory")}
          className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex flex-col items-center gap-2 transition-colors focus-ring outline-none"
        >
          <RefreshCw size={18} className="text-amber-500" />
          <div className="flex flex-col items-center">
            <span>Restore Factory Defaults</span>
            <span className="text-[9px] text-slate-500 font-medium mt-0.5">Reset checks and weights</span>
          </div>
        </button>
      </div>

      {/* Confirmation Dialog Modal overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="bg-slate-900 border border-slate-200/10 dark:border-slate-800/60 p-6 rounded-2xl max-w-sm w-full relative z-10 text-center flex flex-col items-center gap-4.5 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/35 flex items-center justify-center text-amber-500">
              <AlertTriangle size={24} />
            </div>

            <div className="flex flex-col gap-1.5">
              <h4 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide">
                Confirm System Restoration?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[280px]">
                Restoring parameters will overwrite current scoring variables and calibration settings. This operation is irreversible.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={executeRestore}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/10 transition-colors focus-ring outline-none"
              >
                Restore Now
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-750 hover:bg-white/5 text-slate-400 hover:text-slate-250 transition-colors text-xs font-semibold focus-ring outline-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestoreCenter;
