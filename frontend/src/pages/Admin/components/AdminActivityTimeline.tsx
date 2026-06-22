import React from "react";
import { Award, Lock, ShieldCheck, Cpu, Upload } from "lucide-react";
import { useAdminStore, AuditLog } from "../../../store/adminStore";

export const AdminActivityTimeline: React.FC = () => {
  const { auditLogs } = useAdminStore();

  // Group logs by date
  const getGroupLabel = (timestamp: string) => {
    const logDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (logDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (logDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return logDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    }
  };

  // Grouping operation
  const groupedLogs: Record<string, AuditLog[]> = {};
  auditLogs.slice(0, 10).forEach((log) => {
    const label = getGroupLabel(log.timestamp);
    if (!groupedLogs[label]) {
      groupedLogs[label] = [];
    }
    groupedLogs[label].push(log);
  });

  const getTimelineIcon = (category: AuditLog["category"]) => {
    switch (category) {
      case "Security":
        return <Lock className="text-rose-500" size={12} />;
      case "Ranking Weights":
        return <Award className="text-purple-500" size={12} />;
      case "Model Config":
        return <Cpu className="text-blue-500" size={12} />;
      case "Export":
        return <Upload className="text-emerald-500" size={12} />;
      default:
        return <ShieldCheck className="text-amber-500" size={12} />;
    }
  };

  const getTimelineIconBg = (category: AuditLog["category"]) => {
    switch (category) {
      case "Security": return "bg-rose-500/10 border-rose-500/25";
      case "Ranking Weights": return "bg-purple-500/10 border-purple-500/25";
      case "Model Config": return "bg-blue-500/10 border-blue-500/25";
      case "Export": return "bg-emerald-500/10 border-emerald-500/25";
      default: return "bg-amber-500/10 border-amber-500/25";
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          Admin Activity Log
        </h3>
        <p className="text-xs text-slate-400">Vertical timeline tracking cluster updates</p>
      </div>

      <div className="space-y-6 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
        {Object.entries(groupedLogs).map(([dateLabel, logs]) => (
          <div key={dateLabel} className="space-y-4">
            {/* Group date header */}
            <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider sticky top-0 bg-[#0d1117]/85 py-1 backdrop-blur-sm z-10 select-none">
              {dateLabel}
            </div>

            <div className="relative border-l border-slate-200/10 dark:border-slate-800/50 ml-3.5 space-y-5">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6 group">
                  {/* Timeline bullet icon */}
                  <div className={`absolute -left-3 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${getTimelineIconBg(log.category)} transition-transform group-hover:scale-105`}>
                    {getTimelineIcon(log.category)}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 leading-normal">
                        {log.action}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold shrink-0 self-center">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-medium">
                      {log.details}
                    </p>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      BY: {log.user}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {auditLogs.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold select-none">
            No activity logged yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityTimeline;
