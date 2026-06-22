import React from "react";
import { Milestone, GitBranch, AlertTriangle, Activity } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "deploy" | "incident" | "export" | "sys";
  event: string;
  time: string;
  desc: string;
}

export const HealthTimeline: React.FC = () => {
  const events: TimelineEvent[] = [
    { id: "e-01", type: "deploy", event: "Production Release Tag v1.2.0", time: "10m ago", desc: "Successfully deployed frontend assets and PWA SW hooks to Staging." },
    { id: "e-02", type: "export", event: "Database Configurations Export", time: "1h ago", desc: "Generated settings backup log archive for scorer calibration factors." },
    { id: "e-03", type: "sys", event: "FAISS Index Refresh", time: "2h ago", desc: "Triggered lexical and inverted index rebuilds from the admin dashboard." },
    { id: "e-04", type: "incident", event: "Stale Cache Rebuild", time: "5h ago", desc: "Resolved dev bundle caching blockages in the development viewport." }
  ];

  const getIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "deploy":
        return <GitBranch size={13} className="text-emerald-500" />;
      case "incident":
        return <AlertTriangle size={13} className="text-rose-500" />;
      case "export":
        return <Milestone size={13} className="text-blue-500" />;
      case "sys":
      default:
        return <Activity size={13} className="text-purple-500" />;
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Milestone size={16} className="text-blue-500 animate-pulse" />
        <span>System Diagnostics & Events</span>
      </h3>

      <div className="flex flex-col gap-5 relative pl-4 mt-2">
        {/* Connecting Vertical Line */}
        <div className="absolute left-[7px] top-[10px] bottom-[10px] w-0.5 bg-slate-200 dark:bg-slate-800 pointer-events-none" />

        {events.map((e) => (
          <div key={e.id} className="flex gap-4 items-start relative select-none">
            {/* Timeline Icon Node */}
            <div className="absolute -left-5 bg-slate-100 dark:bg-slate-900 w-5 h-5 rounded-full flex items-center justify-center border border-slate-350 dark:border-slate-800 shrink-0">
              {getIcon(e.type)}
            </div>

            <div className="flex flex-col pl-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold text-slate-855 dark:text-slate-200">
                  {e.event}
                </span>
                <span className="text-[8px] font-mono text-slate-450 dark:text-slate-500">
                  {e.time}
                </span>
              </div>
              <span className="text-[9px] text-slate-500 leading-normal mt-0.5 max-w-sm sm:max-w-md">
                {e.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthTimeline;
