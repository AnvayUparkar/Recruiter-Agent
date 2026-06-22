import React from "react";
import { Laptop, Server, Globe, Calendar, GitCommit } from "lucide-react";
import { useLaunchStore } from "../../../store/launchStore";

export const EnvironmentPanel: React.FC = () => {
  const { environment, setEnvironment } = useLaunchStore();

  const envs = [
    { key: "development", label: "Development", desc: "Local sandbox testing", icon: <Laptop size={14} /> },
    { key: "staging", label: "Staging", desc: "QA verification node", icon: <Server size={14} /> },
    { key: "production", label: "Production", desc: "Live recruiter access", icon: <Globe size={14} /> },
  ] as const;

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        Target Environment Node
      </h3>

      <div className="flex flex-col sm:flex-row gap-3">
        {envs.map((env) => {
          const isActive = environment === env.key;
          return (
            <button
              key={env.key}
              onClick={() => setEnvironment(env.key)}
              className={`flex-1 p-4 rounded-xl border text-left transition-all duration-300 flex items-start gap-3.5 focus-ring outline-none
                ${isActive
                  ? "bg-blue-600/10 dark:bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/5"
                  : "border-slate-200/10 dark:border-slate-850 hover:bg-slate-200/50 dark:hover:bg-slate-950 text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              <div className={`p-2 rounded-lg border ${isActive ? "bg-blue-600/15 border-blue-500/20" : "bg-slate-200/60 dark:bg-slate-900 border-slate-300/10"}`}>
                {env.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black uppercase tracking-wider block">
                  {env.label}
                </span>
                <span className="text-[9px] text-slate-500 leading-normal mt-0.5 truncate">
                  {env.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* DevOps metadata labels */}
      <div className="grid grid-cols-2 gap-4 mt-1.5 pt-4 border-t border-slate-200/10 dark:border-slate-805">
        <div className="flex items-center gap-2 text-[10px] text-slate-450 dark:text-slate-500 font-semibold">
          <GitCommit size={14} className="shrink-0" />
          <span>Active Git SHA:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">d3f9e2b (Phase 14 submissions)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-450 dark:text-slate-500 font-semibold justify-end">
          <Calendar size={14} className="shrink-0" />
          <span>Deployed At:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">2026-06-16 22:00 UTC</span>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentPanel;
