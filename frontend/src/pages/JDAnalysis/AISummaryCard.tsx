import React from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, ShieldCheck } from "lucide-react";

interface AISummaryCardProps {
  title: string;
  company?: string;
  summary: string;
  seniority: string;
  confidence: number;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  title,
  company,
  summary,
  seniority,
  confidence,
}) => {

  // Confidence color ranges
  const getConfColor = (score: number) => {
    if (score >= 90) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 75) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="glass-panel p-5 sm:p-6 rounded-2xl border border-blue-500/20 dark:border-blue-400/20 bg-slate-100/90 dark:bg-slate-900/80 shadow-2xl relative overflow-hidden select-none"
    >
      {/* Background Soft Glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-blue-500/10 blur-[40px] pointer-events-none" />

      <div className="flex flex-col gap-4 relative z-10">
        
        {/* Header Metadata row */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Bot size={12} className="animate-pulse" />
              <span>AI Extracted Profile</span>
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1.5 leading-tight">
              {title}
            </h2>
            {company && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Client Organization: {company}
              </p>
            )}
          </div>

          {/* Seniority & Confidence Badges */}
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase shrink-0">
            <span className="px-2.5 py-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-350 dark:border-slate-700 shadow-sm">
              {seniority}
            </span>
            <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 ${getConfColor(confidence)}`}>
              <ShieldCheck size={11} />
              <span>{confidence}% Confidence</span>
            </span>
          </div>
        </div>

        {/* Recruiter Summary Paragraph */}
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2 mt-1">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-blue-500 shrink-0" />
            <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
              Recruiter Dossier Executive Summary
            </span>
          </div>
          <p className="text-xs text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
            {summary}
          </p>
        </div>

      </div>
    </motion.div>
  );
};

export default AISummaryCard;
