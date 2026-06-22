import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, ArrowRight } from "lucide-react";

interface ExperienceSectionProps {
  experienceRange: [number, number];
  highlights?: string[];
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experienceRange,
  highlights = [],
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [min, max] = experienceRange || [0, 0];

  // Map tenure points to render on the timeline
  const tenurePoints = [0, 2, 5, 8, 12, 15];

  // Helper to calculate percentage offset on the timeline
  const getPercentage = (value: number) => {
    const maxTimeline = 15;
    const clamped = Math.min(Math.max(value, 0), maxTimeline);
    return (clamped / maxTimeline) * 100;
  };

  const startPct = getPercentage(min);
  const endPct = getPercentage(max || min + 2); // default range width if max not specified

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl space-y-6 select-none relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-250/20 dark:border-slate-850">
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-blue-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest">
            Professional Tenure Bracket
          </span>
        </div>
        <span className="text-xs font-black text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg">
          {min === max ? `${min} Years` : `${min} - ${max} Years Required`}
        </span>
      </div>

      {/* Visual Timeline Bar */}
      <div className="pt-2 pb-5 px-3 space-y-4">
        <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-950 rounded-full border border-slate-250/40 dark:border-slate-850">
          {/* Active Highlight Range */}
          <motion.div
            initial={shouldReduceMotion ? { left: `${startPct}%`, width: `${endPct - startPct}%` } : { left: 0, width: 0 }}
            animate={{ left: `${startPct}%`, width: `${Math.max(4, endPct - startPct)}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-inner-glow"
          >
            {/* Glowing effect nodes */}
            <span className="absolute -left-1.5 -top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 shadow-md" />
            <span className="absolute -right-1.5 -top-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 shadow-md" />
          </motion.div>

          {/* Core Timeline Ticks */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
            {tenurePoints.map((pt, idx) => {
              const isActive = pt >= min && pt <= max;
              return (
                <div key={idx} className="relative flex flex-col items-center">
                  <div className={`w-1 h-2 rounded-full mt-[-1px] ${isActive ? "bg-white/40" : "bg-slate-300 dark:bg-slate-800"}`} />
                  <span className={`absolute top-4 text-[9px] font-mono font-bold transition-colors ${isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-600"}`}>
                    {pt}y
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seniority Context Card */}
      {highlights.length > 0 && (
        <div className="pt-3 border-t border-slate-250/20 dark:border-slate-850 space-y-2.5">
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider block">
            Target Domain Experience
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {highlights.map((highlight, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-200/20 dark:bg-slate-950/20 border border-slate-250/30 dark:border-slate-850 text-[10.5px] font-medium text-slate-650 dark:text-slate-400"
              >
                <ArrowRight size={11} className="text-blue-500 shrink-0" />
                <span className="capitalize">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceSection;
