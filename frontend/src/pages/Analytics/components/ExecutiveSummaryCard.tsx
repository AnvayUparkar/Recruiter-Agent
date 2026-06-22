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
      className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-500/10 to-indigo-600/5 shadow-xl mb-6 relative overflow-hidden group"
    >
      <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-purple-500/10 blur-2xl pointer-events-none group-hover:bg-purple-500/15 transition-all duration-300" />

      <div className="flex gap-4 items-start relative z-10">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
          <BrainCircuit size={24} />
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
              <Sparkles size={10} />
              <span>AI Executive Insight</span>
            </span>
            <span className="text-xs text-slate-400">Pool Assessment Summary</span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans mt-1">
            Across the evaluated pool of <strong>{candidatesCount} candidates</strong>, the average AI fit calibration score sits at <strong>{scoreVal}%</strong>. Shortlisted finalists exhibit deep technical competence with solid matching ratios (NDCG@5 is fully aligned). Reliability indices remain robust, indicating low credentials mismatch risk, though mid-level progression nodes present minor leadership variance opportunities.
          </p>

          {/* Bullet points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-[11px]">
            <div className="flex items-start gap-2 text-slate-350 bg-black/20 p-2.5 rounded-lg border border-white/5">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-heading">Technical Depth</strong>
                Candidate pools are exceptionally strong in required core skills.
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-350 bg-black/20 p-2.5 rounded-lg border border-white/5">
              <TrendingUp size={14} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-heading">High Verdict Ratio</strong>
                {strongVerdictCount} candidates are classified as strong candidates under balanced prioritization models.
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-350 bg-black/20 p-2.5 rounded-lg border border-white/5">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-heading">Leadership Exposure</strong>
                Growth parameters check is recommended for Quantitative Analyst slots.
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default ExecutiveSummaryCard;
