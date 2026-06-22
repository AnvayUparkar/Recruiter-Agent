import React, { useState } from "react";
import { AlertOctagon, Save } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";

export const MaintenanceModePanel: React.FC = () => {
  const { maintenanceMode, maintenanceBanner, setMaintenanceMode } = useAdminStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [draftBanner, setDraftBanner] = useState(maintenanceBanner);

  const handleToggleClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmToggle = () => {
    setMaintenanceMode(!maintenanceMode, draftBanner);
    setShowConfirm(false);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <AlertOctagon className="text-amber-500" size={20} />
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Platform Maintenance Controls
          </h3>
          <p className="text-xs text-slate-400">Lock application routing for server database calibrations</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Toggle Mode */}
        <div className="p-4 rounded-xl border bg-slate-500/5 border-slate-200/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
              Global Maintenance Lock
            </span>
            <span className="text-[10px] text-slate-400 block max-w-md">
              Restricts access for non-admin sessions. Users will see a friendly landing notice screen.
            </span>
          </div>

          <button
            onClick={handleToggleClick}
            className={`w-11 h-6 rounded-full transition-colors duration-250 p-1 flex outline-none focus-ring relative shrink-0 ${
              maintenanceMode ? "bg-rose-600 animate-pulse" : "bg-slate-200 dark:bg-slate-800"
            }`}
            aria-label="Toggle maintenance mode"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 shadow-sm ${
                maintenanceMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Warning Banner Input */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">
            Custom Header Warning Banner
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={draftBanner}
              onChange={(e) => setDraftBanner(e.target.value)}
              placeholder="e.g. Scheduled Maintenance: Web APIs will be unavailable at 04:00 UTC."
              className="flex-1 bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus-ring font-medium font-sans"
            />
            {draftBanner !== maintenanceBanner && (
              <button
                onClick={() => setMaintenanceMode(maintenanceMode, draftBanner)}
                className="px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors select-none"
                title="Update Banner Text"
              >
                <Save size={14} />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setShowConfirm(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
          />
          
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-2xl w-full max-w-sm relative z-10 space-y-4">
            <div className="flex gap-3 text-rose-500">
              <AlertOctagon size={24} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Confirm Maintenance Mode
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  {maintenanceMode
                    ? "Are you sure you want to disable maintenance lock and allow standard users access?"
                    : "Are you sure you want to lock the system down? All active recruiter workflows will pause access."}
                </p>
              </div>
            </div>

            <div className="flex gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200/5 rounded-xl font-extrabold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                className={`flex-1 py-2 rounded-xl font-extrabold text-white transition-colors ${
                  maintenanceMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {maintenanceMode ? "Restore Site" : "Enable Lock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceModePanel;
