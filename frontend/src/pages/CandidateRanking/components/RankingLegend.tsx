import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export const RankingLegend: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  const legendItems = [
    {
      title: "Overall Fit Match",
      desc: "Comprehensive fit index computed by balancing skills matching, experience, reliability, and strategy weights.",
    },
    {
      title: "Technical Competence",
      desc: "Audits declared skill proficiency levels, tenure durations in specific tech stacks, and academic degrees.",
    },
    {
      title: "Behavioral Intelligence",
      desc: "Synthesizes platform response rates, interview completion rates, connection counts, and social signals.",
    },
    {
      title: "Profile Reliability",
      desc: "Audit score analyzing work timeline gaps, profile completeness, and data consistency across career roles.",
    },
    {
      title: "Leadership Fit",
      desc: "Heuristic based on seniority title matches (Lead, Staff, Manager) and historical experience brackets.",
    },
  ];

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/50 dark:bg-slate-900/50 shadow select-none w-full">
      {/* Accordion Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-xs font-bold text-slate-655 dark:text-slate-350 outline-none rounded-lg hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={15} className="text-blue-500 animate-pulse" />
          <span>Scoring Explainer & Metric Glossary</span>
        </div>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded Glossary list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="overflow-hidden mt-3 pt-3 border-t border-slate-250/20 dark:border-slate-850"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {legendItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-200/30 dark:bg-slate-950/40 border border-slate-250/50 dark:border-slate-850 space-y-1"
                >
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider block">
                    {item.title}
                  </span>
                  <p className="text-[9.5px] leading-relaxed text-slate-500 dark:text-slate-400 font-semibold">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RankingLegend;
