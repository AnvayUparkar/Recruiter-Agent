import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface ConfidencePanelProps {
  confidence: number;
  extractedCount: number;
  totalEstimatedCount: number;
}

export const ConfidencePanel: React.FC<ConfidencePanelProps> = ({
  confidence,
  extractedCount,
  totalEstimatedCount,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Circle SVG metrics
  const radius = 42;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: "Elite Parsing", desc: "Structured parameters perfectly match source semantics.", color: "text-emerald-500", glow: "shadow-emerald-500/10" };
    if (score >= 75) return { label: "High Precision", desc: "Key tags validated with strong confidence index.", color: "text-blue-500", glow: "shadow-blue-500/10" };
    return { label: "Standard Analysis", desc: "Parsed metadata might benefit from recruiter vetting.", color: "text-amber-500", glow: "shadow-amber-500/10" };
  };

  const status = getConfidenceLevel(confidence);

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl flex flex-col sm:flex-row items-center gap-6 select-none relative overflow-hidden">
      
      {/* Background Soft Glow */}
      <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-blue-500/5 blur-[30px] pointer-events-none" />

      {/* Circle Chart wrapper */}
      <div className="relative flex items-center justify-center shrink-0 w-28 h-28">
        <svg className="w-full h-full transform -rotate-90">
          {/* Base Track */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-200 dark:stroke-slate-950 fill-transparent"
          />
          {/* Active Circle Progress */}
          <motion.circle
            cx="56"
            cy="56"
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={shouldReduceMotion ? { strokeDashoffset } : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.15 }}
            className={`fill-transparent stroke-linecap-round ${
              confidence >= 90
                ? "stroke-emerald-500"
                : confidence >= 75
                ? "stroke-blue-500"
                : "stroke-amber-500"
            }`}
          />
        </svg>

        {/* Floating Percentage Text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {confidence}%
          </span>
          <span className="text-[8px] font-extrabold uppercase text-slate-450 tracking-wider">
            Index
          </span>
        </div>
      </div>

      {/* Description Columns */}
      <div className="flex-1 space-y-3 text-center sm:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck size={14} className={`${status.color} shrink-0`} />
            <span className={`text-[11px] font-black uppercase tracking-wider ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
            {status.desc}
          </p>
        </div>

        {/* Extra Statistics tags */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-[9px] font-bold uppercase">
          <span className="px-2 py-0.5 rounded-lg bg-slate-200/50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 text-slate-655 dark:text-slate-450">
            {extractedCount} entities parsed
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-200/50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 text-slate-655 dark:text-slate-450">
            {Math.round((extractedCount / Math.max(1, totalEstimatedCount)) * 100)}% density
          </span>
        </div>
      </div>

    </div>
  );
};

export default ConfidencePanel;
