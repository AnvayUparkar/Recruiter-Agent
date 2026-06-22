import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface QuickPrompt {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export const DEFAULT_QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "why-ranked",
    icon: "🏆",
    label: "Why ranked?",
    prompt: "Why is this candidate ranked highly for this role?",
  },
  {
    id: "summarize",
    icon: "📋",
    label: "Summarize profile",
    prompt: "Give me a concise executive summary of this candidate's profile.",
  },
  {
    id: "risks",
    icon: "⚠️",
    label: "Key risks",
    prompt: "What are the biggest hiring risks for this candidate?",
  },
  {
    id: "technical-q",
    icon: "⚡",
    label: "Technical questions",
    prompt: "Generate targeted technical interview questions for this candidate.",
  },
  {
    id: "behavioral-q",
    icon: "🎯",
    label: "Behavioral questions",
    prompt: "Generate behavioral interview questions tailored to this candidate's profile.",
  },
  {
    id: "hire-decision",
    icon: "✅",
    label: "Should I hire?",
    prompt: "Based on the JD and candidate profile, should I advance this candidate to the next round?",
  },
  {
    id: "jd-compare",
    icon: "🔍",
    label: "Compare to JD",
    prompt: "Compare this candidate's skills and experience against the job description requirements.",
  },
  {
    id: "reliability",
    icon: "🛡",
    label: "Reliability score",
    prompt: "Explain the reliability score and what it means for this candidate.",
  },
];

interface QuickPromptBarProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const QuickPromptBar: React.FC<QuickPromptBarProps> = ({ onSelect, disabled }) => {
  const reduced = useReducedMotion();

  return (
    <div
      className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-none"
      role="group"
      aria-label="Quick prompt suggestions"
    >
      {DEFAULT_QUICK_PROMPTS.map((qp, i) => (
        <motion.button
          key={qp.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : i * 0.04 }}
          whileHover={!disabled ? { scale: 1.04, y: -1 } : undefined}
          whileTap={!disabled ? { scale: 0.97 } : undefined}
          onClick={() => !disabled && onSelect(qp.prompt)}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/8 text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
            disabled
              ? "text-slate-600 cursor-not-allowed bg-slate-900/40"
              : "text-slate-300 bg-slate-900/60 hover:bg-slate-800/80 hover:border-blue-500/30 hover:text-blue-300 cursor-pointer"
          }`}
          aria-label={qp.label}
        >
          <span>{qp.icon}</span>
          {qp.label}
        </motion.button>
      ))}
    </div>
  );
};

export default QuickPromptBar;
