import React from "react";
import { Download, History, Database, Calendar, FileText } from "lucide-react";
import { useLaunchStore } from "../../../store/launchStore";
import { useToastStore } from "../../../store/toastStore";

export const BackupCenter: React.FC = () => {
  const { backupLogs, addBackupLog } = useLaunchStore();
  const toastStore = useToastStore();

  const handleExportBackup = (type: "configurations" | "preferences" | "metrics") => {
    toastStore.loading(`Generating export for ${type}...`);
    
    // Simulate generating and downloading files
    setTimeout(() => {
      const payload = {
        app: "antigravity-recruiter-copilot",
        exportType: type,
        timestamp: Date.now(),
        data: {
          strategy: "balanced",
          limits: 100,
          notesQueueCount: 0,
        }
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rc_backup_${type}_${Math.floor(Date.now() / 1000)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      addBackupLog(`rc_backup_${type}.json`, type.toUpperCase(), blob.size);
      
      toastStore.success(`${type.toUpperCase()} exported and downloaded successfully!`);
    }, 1000);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Database size={16} className="text-blue-500" />
        <span>Metadata Backup Center</span>
      </h3>
      <p className="text-[10px] text-slate-500 leading-normal">
        Export active scorer weights configurations, system preference templates, or observability latency metrics history logs.
      </p>

      {/* Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleExportBackup("configurations")}
          className="py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 focus-ring outline-none transition-colors"
        >
          <Download size={13} />
          <span>Export Configs</span>
        </button>
        <button
          onClick={() => handleExportBackup("preferences")}
          className="py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 focus-ring outline-none transition-colors"
        >
          <Download size={13} />
          <span>Export Preferences</span>
        </button>
        <button
          onClick={() => handleExportBackup("metrics")}
          className="py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 focus-ring outline-none transition-colors"
        >
          <Download size={13} />
          <span>Export Metrics Logs</span>
        </button>
      </div>

      {/* Logs History */}
      <div className="mt-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider pb-2 border-b border-slate-200/10 dark:border-slate-805">
          <History size={13} />
          <span>Backup History Logs</span>
        </div>

        <div className="flex flex-col gap-2 mt-2 max-h-[140px] overflow-y-auto custom-scrollbar">
          {backupLogs.length > 0 ? (
            backupLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-200/40 dark:bg-slate-950/20 border border-slate-300/5 dark:border-slate-850 text-[10px]"
              >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                  <FileText size={12} className="text-slate-450 shrink-0" />
                  <span className="truncate">{log.name}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-450 shrink-0">
                  <span className="font-mono">{(log.sizeBytes / 1024).toFixed(2)} KB</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-500 text-[10px] font-medium">
              No recent backups recorded. Click export parameters to backup configurations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupCenter;
