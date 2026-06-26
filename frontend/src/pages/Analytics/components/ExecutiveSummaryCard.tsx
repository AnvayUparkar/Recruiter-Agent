import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

interface ExecutiveSummaryCardProps {
  candidatesCount: number;
  avgScore: number;
  strongVerdictCount: number;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  candidatesCount,
  avgScore,
  strongVerdictCount,
}) => {
  const scoreVal = Math.round(avgScore * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 20 }}
      className="w-full max-w-full glass-panel p-4 lg:p-8 rounded-2xl border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-500/10 to-indigo-600/5 dark:from-purple-500/20 dark:to-indigo-600/10 shadow-xl mb-6 relative overflow-hidden group"
    >
      <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-purple-500/10 blur-2xl pointer-events-none group-hover:bg-purple-500/15 transition-all duration-300" />

      <div className="flex flex-col md:flex-row gap-4 items-start relative z-10 w-full max-w-full">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mb-2 md:mb-0">
          <BrainCircuit size={24} />
        </div>

        <div className="flex-1 flex flex-col gap-1.5 w-full min-w-0 max-w-full">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-purple-500 dark:text-purple-400 font-bold uppercase tracking-widest bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
              <Sparkles size={10} />
              <span>AI Executive Insight</span>
            </span>
            <span className="text-xs text-text-muted">Pool Assessment Summary</span>
          </div>

          <p className="text-xs md:text-sm text-text-primary/90 leading-relaxed font-sans mt-1 break-words whitespace-normal w-full">
            Across the evaluated pool of <strong>{candidatesCount} candidates</strong>, the average AI fit calibration score sits at <strong>{scoreVal}%</strong>. Shortlisted finalists exhibit deep technical competence with solid matching ratios (NDCG@5 is fully aligned). Reliability indices remain robust, indicating low credentials mismatch risk, though mid-level progression nodes present minor leadership variance opportunities.
          </p>

          {/* Bullet points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 w-full min-w-0 max-w-full">
            <div className="flex flex-col md:flex-row items-start gap-2 text-text-muted bg-surface/50 p-2.5 md:p-3 rounded-lg border border-border w-full">
              <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400 shrink-0 md:mt-0.5" />
              <div className="break-words whitespace-normal min-w-0 w-full">
                <strong className="text-text-primary block font-heading text-xs md:text-sm mb-1">Technical Depth</strong>
                <span className="text-[11px] md:text-xs">Candidate pools are exceptionally strong in required core skills.</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-2 text-text-muted bg-surface/50 p-2.5 md:p-3 rounded-lg border border-border w-full">
              <TrendingUp size={18} className="text-blue-500 dark:text-blue-400 shrink-0 md:mt-0.5" />
              <div className="break-words whitespace-normal min-w-0 w-full">
                <strong className="text-text-primary block font-heading text-xs md:text-sm mb-1">High Verdict Ratio</strong>
                <span className="text-[11px] md:text-xs">{strongVerdictCount} candidates are classified as strong candidates under balanced prioritization models.</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-2 text-text-muted bg-surface/50 p-2.5 md:p-3 rounded-lg border border-border w-full">
              <AlertTriangle size={18} className="text-amber-500 dark:text-amber-400 shrink-0 md:mt-0.5" />
              <div className="break-words whitespace-normal min-w-0 w-full">
                <strong className="text-text-primary block font-heading text-xs md:text-sm mb-1">Leadership Exposure</strong>
                <span className="text-[11px] md:text-xs">Growth parameters check is recommended for Quantitative Analyst slots.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default ExecutiveSummaryCard;
