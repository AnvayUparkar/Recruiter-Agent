import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, BookOpen } from "lucide-react";
import { RequirementDetail } from "../../types/common";

interface SkillsSectionProps {
  mustHave: RequirementDetail[];
  niceToHave: RequirementDetail[];
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  mustHave,
  niceToHave,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const getImportanceColor = (imp: RequirementDetail["importance"]) => {
    switch (imp.toLowerCase()) {
      case "critical":
        return "bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400 shadow-sm shadow-rose-500/3";
      case "important":
        return "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400 shadow-sm shadow-amber-500/3";
      default:
        return "bg-blue-500/10 border-blue-500/30 text-blue-500 dark:text-blue-400 shadow-sm shadow-blue-500/3";
    }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const chipVariants = {
    initial: { opacity: 0, scale: 0.92, y: 8 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 350, damping: 25 },
    },
  };

  const hoverAnim = shouldReduceMotion
    ? {}
    : { scale: 1.05, y: -1, transition: { duration: 0.15 } };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl space-y-6 select-none">
      
      {/* 1. Required / Must-Have Skills section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 animate-pulse" />
          <span>Required Capabilities ({mustHave.length})</span>
        </h3>

        {mustHave.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            className="flex flex-wrap gap-2.5"
          >
            {mustHave.map((skill, idx) => (
              <motion.div
                key={`${skill.name}-${idx}`}
                variants={chipVariants}
                whileHover={hoverAnim}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border capitalize flex items-center gap-1.5 cursor-pointer outline-none relative group
                  ${getImportanceColor(skill.importance)}`}
                tabIndex={0}
              >
                <span>{skill.name}</span>
                <span className="text-[9px] opacity-65 font-black uppercase">
                  ({skill.importance})
                </span>

                {/* Subtle Hover Tooltip detailing confidence */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-slate-900 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-md">
                  Extraction Confidence: {Math.round(skill.confidence * 100)}%
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-xs text-slate-500 italic">No critical skills extracted.</p>
        )}
      </div>

      {/* 2. Preferred / Nice-to-Have Skills section */}
      {niceToHave.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-250/20 dark:border-slate-850">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest flex items-center gap-2">
            <BookOpen size={16} className="text-blue-500 shrink-0" />
            <span>Preferred & Optional Qualifications ({niceToHave.length})</span>
          </h3>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            className="flex flex-wrap gap-2.5"
          >
            {niceToHave.map((skill, idx) => (
              <motion.div
                key={`${skill.name}-${idx}`}
                variants={chipVariants}
                whileHover={hoverAnim}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-200/40 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800 text-slate-650 dark:text-slate-400 capitalize cursor-pointer outline-none relative group"
                tabIndex={0}
              >
                <span>{skill.name}</span>
                {/* Subtle Hover Tooltip detailing confidence */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-slate-900 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-md">
                  Extraction Confidence: {Math.round(skill.confidence * 100)}%
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SkillsSection;
