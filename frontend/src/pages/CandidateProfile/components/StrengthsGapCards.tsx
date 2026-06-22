import React from "react";
import { motion } from "framer-motion";
import { Zap, AlertCircle } from "lucide-react";
import { ExplanationResponse } from "../../../types/ranking";

interface StrengthsCardProps {
  explanation?: ExplanationResponse | null;
}

const StrengthsCard: React.FC<StrengthsCardProps> = ({ explanation }) => {
  const strengths = explanation?.strengths ?? [];
  if (!strengths.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/4 backdrop-blur-xl overflow-hidden"
    >
      <div className="px-5 pt-5 pb-3 border-b border-emerald-500/10 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Zap size={12} className="text-emerald-400" />
        </div>
        <span className="text-sm font-bold text-emerald-300">Key Strengths</span>
      </div>
      <ul className="p-5 flex flex-col gap-2.5">
        {strengths.map((s, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-2.5 text-sm text-slate-300"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            {s}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

interface GapAnalysisCardProps {
  explanation?: ExplanationResponse | null;
}

const GapAnalysisCard: React.FC<GapAnalysisCardProps> = ({ explanation }) => {
  const gaps = explanation?.gaps ?? explanation?.weaknesses ?? [];
  if (!gaps.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="rounded-2xl border border-amber-500/20 bg-amber-500/4 backdrop-blur-xl overflow-hidden"
    >
      <div className="px-5 pt-5 pb-3 border-b border-amber-500/10 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <AlertCircle size={12} className="text-amber-400" />
        </div>
        <span className="text-sm font-bold text-amber-300">Areas to Explore</span>
      </div>
      <ul className="p-5 flex flex-col gap-2.5">
        {gaps.map((g, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-2.5 text-sm text-slate-300"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            {g}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export { StrengthsCard, GapAnalysisCard };
