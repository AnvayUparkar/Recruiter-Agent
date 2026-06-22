import React from "react";
import { Loader2, Sparkles } from "lucide-react";

export const GlobalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-md select-none">
      {/* Premium Loader Panel */}
      <div className="glass-panel p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4.5 max-w-xs border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60">
        {/* Loading Spinner Wrapper */}
        <div className="relative flex items-center justify-center">
          {/* Neon spinning outer ring */}
          <div className="absolute w-12 h-12 rounded-full border-2 border-t-blue-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin duration-700" />
          {/* Inner slow spinner */}
          <Loader2 size={24} className="text-slate-400 dark:text-slate-600 animate-spin duration-1000" />
        </div>

        {/* Loading text details */}
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <Sparkles size={11} className="text-blue-500 animate-pulse" />
            <span>Assembling Dossiers</span>
          </span>
          <span className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
            Calibrating models and loading platform layout assets...
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;
