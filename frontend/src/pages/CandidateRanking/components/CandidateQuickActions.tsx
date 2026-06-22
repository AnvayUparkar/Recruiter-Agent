import React, { useState } from "react";
import { User, Bot, GitCompare, Bookmark } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface CandidateQuickActionsProps {
  onViewProfile: () => void;
  onOpenCopilot: () => void;
  isCompared: boolean;
  onToggleComparison: (checked: boolean) => void;
  isCompareDisabled: boolean;
}

export const CandidateQuickActions: React.FC<CandidateQuickActionsProps> = ({
  onViewProfile,
  onOpenCopilot,
  isCompared,
  onToggleComparison,
  isCompareDisabled,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const actionButtons = [
    {
      label: "View Dossier",
      icon: User,
      onClick: onViewProfile,
      color: "hover:text-blue-500 hover:bg-blue-500/10 border-slate-300 dark:border-slate-800",
    },
    {
      label: "AI Copilot Review",
      icon: Bot,
      onClick: onOpenCopilot,
      color: "hover:text-purple-500 hover:bg-purple-500/10 border-slate-300 dark:border-slate-800",
    },
    {
      label: isCompared ? "Remove from Finalists" : "Compare Finalist",
      icon: GitCompare,
      onClick: () => onToggleComparison(!isCompared),
      color: isCompared
        ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
        : isCompareDisabled
        ? "opacity-40 cursor-not-allowed border-slate-350 dark:border-slate-850"
        : "hover:text-emerald-500 hover:bg-emerald-500/10 border-slate-300 dark:border-slate-800",
      disabled: isCompareDisabled && !isCompared,
    },
    {
      label: isBookmarked ? "Saved" : "Save Candidate",
      icon: Bookmark,
      onClick: () => setIsBookmarked(!isBookmarked),
      color: isBookmarked
        ? "text-amber-500 bg-amber-500/10 border-amber-500/30 animate-pulse"
        : "hover:text-amber-500 hover:bg-amber-500/10 border-slate-300 dark:border-slate-800",
    },
  ];

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 350, damping: 20 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex items-center gap-2 select-none"
    >
      {actionButtons.map((btn, idx) => {
        const Icon = btn.icon;
        return (
          <motion.button
            key={idx}
            variants={shouldReduceMotion ? {} : itemVariants}
            onClick={(e) => {
              e.stopPropagation();
              if (!btn.disabled) btn.onClick();
            }}
            disabled={btn.disabled}
            className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center transition-all duration-200 outline-none focus-ring relative group/btn bg-slate-100/50 dark:bg-slate-900/60
              ${btn.color}`}
            title={btn.label}
            aria-label={btn.label}
          >
            <Icon size={14} />

            {/* Micro Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded bg-slate-950 text-white text-[8px] font-bold opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow">
              {btn.label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default CandidateQuickActions;
