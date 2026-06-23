import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface StrengthWeaknessPanelProps {
  strengths?: string[];
  weaknesses?: string[];
}

const StrengthWeaknessPanel: React.FC<StrengthWeaknessPanelProps> = ({
  strengths = [],
  weaknesses = [],
}) => {
  if (!strengths.length && !weaknesses.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Strengths */}
      {strengths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/4 backdrop-blur-xl overflow-hidden"
        >
          <div className="px-4 pt-4 pb-2 border-b border-emerald-500/10 flex items-center gap-2">
            <CheckCircle size={13} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">Core Strengths</span>
          </div>
          <ul className="p-4 flex flex-col gap-2">
            {strengths.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-xs text-text-muted leading-relaxed"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                {s}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/4 backdrop-blur-xl overflow-hidden"
        >
          <div className="px-4 pt-4 pb-2 border-b border-amber-500/10 flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-300">Areas to Explore</span>
          </div>
          <ul className="p-4 flex flex-col gap-2">
            {weaknesses.map((w, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-xs text-text-muted leading-relaxed"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {w}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default StrengthWeaknessPanel;
