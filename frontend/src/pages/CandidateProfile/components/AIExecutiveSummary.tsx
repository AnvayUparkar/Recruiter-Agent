import React from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { ExplanationResponse } from "../../../types/ranking";

interface AIExecutiveSummaryProps {
  explanation?: ExplanationResponse | null;
  isLoading?: boolean;
}

const TypingText: React.FC<{ text: string }> = ({ text }) => (
  <motion.p
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6 }}
    className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-sans"
  >
    {text}
  </motion.p>
);

const AIExecutiveSummary: React.FC<AIExecutiveSummaryProps> = ({
  explanation,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/20 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 animate-pulse" />
          <div className="h-4 w-40 rounded bg-slate-300 dark:bg-slate-700 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse"
            style={{ width: `${90 - i * 10}%` }}
          />
        ))}
      </div>
    );
  }

  if (!explanation) return null;

  const fitVerdict = explanation.fit_verdict || explanation.fitVerdict || "—";
  const strengths = explanation.strengths ?? [];
  const gaps = (explanation.gaps ?? explanation.weaknesses) ?? [];

  const verdictColor =
    fitVerdict.toLowerCase().includes("strong") ||
    fitVerdict.toLowerCase().includes("excellent")
      ? { ring: "#10b981", bg: "bg-emerald-500/10", text: "text-emerald-400" }
      : fitVerdict.toLowerCase().includes("moderate") ||
        fitVerdict.toLowerCase().includes("good")
      ? { ring: "#3b82f6", bg: "bg-blue-500/10", text: "text-blue-400" }
      : { ring: "#f59e0b", bg: "bg-amber-500/10", text: "text-amber-400" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="rounded-2xl border border-slate-200/20 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200/40 dark:border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Sparkles size={14} className="text-blue-400" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            AI Executive Summary
          </span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${verdictColor.bg} ${verdictColor.text}`}
          style={{ borderColor: `${verdictColor.ring}33` }}
        >
          {fitVerdict}
        </span>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Summary prose */}
        {explanation.summary && (
          <div className="p-4 rounded-xl bg-slate-200/50 dark:bg-white/3 border border-slate-300/30 dark:border-white/6">
            <TypingText text={explanation.summary} />
          </div>
        )}

        {/* Strengths + Gaps two-col */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                <CheckCircle size={12} />
                Strengths
              </span>
              <ul className="flex flex-col gap-1.5">
                {strengths.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <ChevronRight
                      size={12}
                      className="text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0"
                    />
                    {s}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {gaps.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
                <AlertTriangle size={12} />
                Areas to Probe
              </span>
              <ul className="flex flex-col gap-1.5">
                {gaps.map((g, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                  >
                    <ChevronRight
                      size={12}
                      className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0"
                    />
                    {g}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Reasoning trace (collapsible via CSS) */}
        {explanation.reasoning && (
          <details className="group">
            <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors select-none list-none flex items-center gap-1.5">
              <ChevronRight
                size={11}
                className="group-open:rotate-90 transition-transform"
              />
              Scoring Trace
            </summary>
            <pre className="mt-3 p-4 rounded-xl bg-slate-200 dark:bg-slate-950 text-slate-700 dark:text-slate-400 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-300/60 dark:border-slate-800/60">
              {explanation.reasoning}
            </pre>
          </details>
        )}
      </div>
    </motion.div>
  );
};

export default AIExecutiveSummary;
