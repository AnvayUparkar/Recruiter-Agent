import React, { useRef, useState } from "react";
import { Download, Upload, ShieldAlert, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";
import { adminService } from "../../../services/adminService";

export const ConfigurationBackupPanel: React.FC = () => {
  const { activeConfig, importConfig, addNotification } = useAdminStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const configStr = JSON.stringify(activeConfig, null, 2);
      const blob = new Blob([configStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recruiter_copilot_config_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      addNotification(
        "Configuration Exported",
        "Backup file downloaded successfully.",
        "success"
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        // Validation check
        const isValid = adminService.validateConfigSnapshot(parsed);
        if (!isValid) {
          setErrorText("Validation Failed: Uploaded JSON schema is corrupted or missing critical keys.");
          setSuccessText(null);
          return;
        }

        // Apply config
        const applied = importConfig(parsed);
        if (applied) {
          setSuccessText("System configuration snapshot successfully verified and applied.");
          setErrorText(null);
        } else {
          setErrorText("Import Failed: An unexpected error occurred while loading settings.");
          setSuccessText(null);
        }
      } catch (err) {
        setErrorText("File Parsing Failed: Make sure the uploaded file is a valid JSON document.");
        setSuccessText(null);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset input
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <FileText className="text-blue-500" size={20} />
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            System Snapshots & Backups
          </h3>
          <p className="text-xs text-slate-400">Save active configurations or restore configurations from snapshots</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export card */}
        <div className="p-4 bg-slate-500/5 border border-slate-200/5 rounded-xl space-y-3.5 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Export Settings Profile</span>
            <p className="text-[10px] text-slate-450 leading-normal font-medium">
              Downloads a local JSON file mapping active weights, feature flags, rerank options, and LLM hyperparameters.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="w-full py-2.5 bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200/10 dark:border-slate-800/80 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 text-slate-750 dark:text-slate-200 transition-colors select-none"
          >
            <Download size={14} />
            Download JSON Snapshot
          </button>
        </div>

        {/* Import card */}
        <div className="p-4 bg-slate-500/5 border border-slate-200/5 rounded-xl space-y-3.5 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Upload Settings Profile</span>
            <p className="text-[10px] text-slate-450 leading-normal font-medium">
              Upload a valid configurations snapshot. The system will inspect and deploy parameters automatically.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleImportClick}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors select-none shadow-md shadow-blue-600/10"
          >
            <Upload size={14} />
            Upload JSON Snapshot
          </button>
        </div>
      </div>

      {/* Verification alerts */}
      {errorText && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-3 text-xs">
          <AlertTriangle className="shrink-0 mt-0.5" size={16} />
          <div>
            <span className="font-extrabold block">Configuration Validation Alert</span>
            <span className="text-[10px] text-slate-400 block mt-0.5 leading-normal">{errorText}</span>
          </div>
        </div>
      )}

      {successText && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-start gap-3 text-xs">
          <CheckCircle className="shrink-0 mt-0.5" size={16} />
          <div>
            <span className="font-extrabold block">Verification Succeeded</span>
            <span className="text-[10px] text-slate-450 block mt-0.5 leading-normal">{successText}</span>
          </div>
        </div>
      )}

      <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5">
        <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={14} />
        <p className="text-[10px] text-slate-400 leading-normal">
          <strong>Caution:</strong> Importing snapshots modifies active scores calculation schemas instantly. Verify matching scores impact before deploying backups.
        </p>
      </div>
    </div>
  );
};

export default ConfigurationBackupPanel;
