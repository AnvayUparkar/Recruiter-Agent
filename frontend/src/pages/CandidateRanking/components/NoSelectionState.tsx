import React from "react";
import { UserCheck, Info } from "lucide-react";

export const NoSelectionState: React.FC = () => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-150/30 dark:bg-slate-900/10 flex flex-col items-center justify-center text-center gap-3 select-none">
      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
        <UserCheck size={18} />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5 justify-center">
          <Info size={11} />
          <span>Profile Standby</span>
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold max-w-xs">
          Select any candidate's cards to open their detailed dossiers, career histories, and AI match explainer reports.
        </p>
      </div>
    </div>
  );
};

export default NoSelectionState;
