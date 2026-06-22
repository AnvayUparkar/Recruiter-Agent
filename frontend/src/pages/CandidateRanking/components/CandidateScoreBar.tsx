import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface CandidateScoreBarProps {
  label: string;
  score: number; // 0 to 100
  colorClass?: string;
}

export const CandidateScoreBar: React.FC<CandidateScoreBarProps> = ({
  label,
  score,
  colorClass = "from-blue-500 to-indigo-500",
}) => {
  const shouldReduceMotion = useReducedMotion();

  const roundedScore = Math.round(score);

  return (
    <div className="space-y-1 w-full select-none">
      {/* Title & Score Labels */}
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wide">
        <span>{label}</span>
        <span className="font-mono">{roundedScore}%</span>
      </div>

      {/* Progress track */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-250/30 dark:border-slate-850/50">
        <motion.div
          initial={shouldReduceMotion ? { width: `${roundedScore}%` } : { width: 0 }}
          animate={{ width: `${roundedScore}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
        />
      </div>
    </div>
  );
};

export default CandidateScoreBar;
