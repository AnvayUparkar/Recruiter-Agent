import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DEFAULT_QUICK_PROMPTS } from "./QuickPromptBar";

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
  candidateName?: string;
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelect,
  candidateName,
}) => {
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🤖</span>
        </div>
        <h3 className="text-sm font-bold text-text-primary">
          AI Recruiter Copilot
        </h3>
        <p className="text-xs text-text-muted mt-1">
          {candidateName
            ? `Ready to analyze ${candidateName}. What would you like to know?`
            : "Select a candidate to begin your AI-powered hiring analysis."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DEFAULT_QUICK_PROMPTS.slice(0, 6).map((qp, i) => (
          <motion.button
            key={qp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : i * 0.06 }}
            whileHover={{ scale: 1.02, y: -1 }}
            onClick={() => onSelect(qp.prompt)}
            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-blue-500/25 text-left transition-all group"
          >
            <span className="text-lg leading-none mt-0.5">{qp.icon}</span>
            <div>
              <span className="text-xs font-bold text-text-primary group-hover:text-blue-500 transition-colors">
                {qp.label}
              </span>
              <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed line-clamp-2">
                {qp.prompt}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PromptSuggestions;
