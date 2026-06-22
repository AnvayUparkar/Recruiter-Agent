import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface ContinueCTAProps {
  onClick: () => void;
  disabled?: boolean;
}

export const ContinueCTA: React.FC<ContinueCTAProps> = ({
  onClick,
  disabled = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const hoverAnim = shouldReduceMotion ? {} : { scale: 1.02, y: -1 };
  const tapAnim = shouldReduceMotion ? {} : { scale: 0.98 };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : hoverAnim}
      whileTap={disabled ? {} : tapAnim}
      className={`relative w-full py-4.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all outline-none focus-ring shadow-xl select-none overflow-hidden
        ${
          disabled
            ? "bg-slate-350 dark:bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-400/20 dark:border-slate-800 shadow-none"
            : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-650 text-white shadow-blue-500/20 border border-blue-500/30"
        }`}
      aria-label="Proceed to candidate retrieval and ranking"
    >
      {/* Background sweep glow */}
      {!disabled && !shouldReduceMotion && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
      )}

      {/* Floating pulse glow border */}
      {!disabled && !shouldReduceMotion && (
        <span className="absolute inset-0 rounded-2xl border-2 border-blue-500/30 animate-pulse pointer-events-none" />
      )}

      <Sparkles size={16} className="text-white animate-pulse shrink-0" />
      <span className="font-extrabold">Retrieve & Rank Candidates</span>
      <ArrowRight size={16} className="text-white shrink-0 group-hover:translate-x-1 transition-transform" />
    </motion.button>
  );
};

export default ContinueCTA;
