import React from "react";
import { Info, GitBranch, Terminal, HardDrive, Calendar, Cpu } from "lucide-react";

export const VersionInfoCard: React.FC = () => {
  const specs = [
    { label: "Active Branch", value: "main", icon: <GitBranch size={12} className="text-purple-500" /> },
    { label: "Commit SHA", value: "d3f9e2b9c7b8e", icon: <Terminal size={12} className="text-blue-500" /> },
    { label: "Framework", value: "React v19.0.0", icon: <Cpu size={12} className="text-cyan-500" /> },
    { label: "Build Tool", value: "Vite v5.x", icon: <Zap size={12} className="text-amber-500" /> },
    { label: "Static Hosting", value: "Vercel / Edge Node", icon: <HardDrive size={12} className="text-pink-500" /> },
    { label: "Release Date", value: "2026-06-16 22:00", icon: <Calendar size={12} className="text-emerald-500" /> },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Info size={16} className="text-blue-500" />
        <span>Build & Version Details</span>
      </h3>

      <div className="grid grid-cols-2 gap-3.5">
        {specs.map((spec) => (
          <div key={spec.label} className="p-3 rounded-xl border border-slate-200/5 dark:border-slate-800/40 bg-slate-200/30 dark:bg-slate-950/40 flex flex-col gap-1.5 hover:border-slate-300/20 dark:hover:border-slate-800 transition-all duration-200">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
              {spec.icon}
              <span>{spec.label}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-250 truncate">
              {spec.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex items-center justify-between text-[8px] text-slate-450 dark:text-slate-500 uppercase tracking-wider font-extrabold border-t border-slate-250/30 dark:border-slate-805 pt-3">
        <span>Licensing: Apache 2.0</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Production Build Signed</span>
        </span>
      </div>
    </div>
  );
};

import { Zap } from "lucide-react";
export default VersionInfoCard;
