import React from "react";
import { AlertCircle, RotateCcw, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyResultsProps {
  onResetFilters: () => void;
}

export const EmptyResults: React.FC<EmptyResultsProps> = ({ onResetFilters }) => {
  return (
    <div className="glass-panel p-10 md:p-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/10 flex flex-col items-center justify-center text-center gap-6 select-none w-full">
      <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
        <AlertCircle size={28} className="animate-pulse" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm font-black text-slate-805 dark:text-slate-200 uppercase tracking-widest">
          No Matching Candidates Found
        </h3>
        <p className="text-[10.5px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
          Your active filter configurations are too restrictive. Try resetting parameters or uploading a new position description context.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onResetFilters}
          className="px-5 py-2.5 rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors outline-none focus-ring"
        >
          <RotateCcw size={13} />
          <span>Reset Filters</span>
        </button>
        <Link
          to="/jd-analysis"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 transition-colors"
        >
          <FileText size={13} />
          <span>Analyze New JD</span>
        </Link>
      </div>
    </div>
  );
};

export default EmptyResults;
