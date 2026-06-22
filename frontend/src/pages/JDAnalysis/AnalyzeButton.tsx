import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

interface AnalyzeButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({
  onClick,
  isLoading,
  disabled = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Button micro-interactions
  const hoverAnim = shouldReduceMotion ? {} : { scale: 1.02 };
  const tapAnim = shouldReduceMotion ? {} : { scale: 0.97 };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={disabled || isLoading ? {} : hoverAnim}
      whileTap={disabled || isLoading ? {} : tapAnim}
      className={`relative w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all outline-none focus-ring shadow-lg select-none overflow-hidden
        ${
          disabled || isLoading
            ? "bg-slate-300 dark:bg-slate-900 border border-slate-400/20 dark:border-slate-800 text-slate-500 cursor-not-allowed shadow-none"
            : "bg-gradient-to-r from-blue-600 to-purple-650 hover:from-blue-500 hover:to-purple-550 text-white shadow-blue-500/15"
        }`}
    >
      {/* Dynamic processing gradient sweep overlay */}
      {isLoading && !shouldReduceMotion && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
      )}

      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin text-slate-500 dark:text-slate-450 shrink-0" />
          <span>Understanding Requirements...</span>
        </>
      ) : (
        <>
          <Sparkles size={15} className="text-white animate-pulse" />
          <span>Analyze Job Description</span>
        </>
      )}
    </motion.button>
  );
};

export default AnalyzeButton;
