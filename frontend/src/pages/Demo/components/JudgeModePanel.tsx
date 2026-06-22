import React from "react";
import { Terminal, Database, TrendingUp, Cpu } from "lucide-react";
import { motion } from "framer-motion";

interface JudgeModePanelProps {
  judgeInfo: {
    whyItMatters: string;
    architecture: string;
    businessValue: string;
    innovation: string;
    enterpriseImpact: string;
  };
}

export const JudgeModePanel: React.FC<JudgeModePanelProps> = ({ judgeInfo }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="glass-panel p-4 rounded-2xl border border-purple-500/20 dark:border-purple-900/40 bg-purple-950/[0.05] backdrop-blur-xl shadow-xl space-y-4 text-[10px] md:text-xs"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-purple-500/10 pb-2">
        <Terminal className="text-purple-500" size={14} />
        <span className="font-black uppercase tracking-wider text-purple-400 font-sans">
          Judge Mode: Architecture Notes
        </span>
      </div>

      <div className="space-y-3 font-medium">
        {/* Architecture details */}
        <div className="flex gap-2.5">
          <Database className="text-purple-450 shrink-0 mt-0.5" size={13} />
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Backend Architecture</span>
            <span className="text-[10px] text-slate-400 block leading-normal">{judgeInfo.architecture}</span>
          </div>
        </div>

        {/* Business value */}
        <div className="flex gap-2.5">
          <TrendingUp className="text-emerald-500 shrink-0 mt-0.5" size={13} />
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Business value</span>
            <span className="text-[10px] text-slate-400 block leading-normal">{judgeInfo.businessValue}</span>
          </div>
        </div>

        {/* Innovation highlight */}
        <div className="flex gap-2.5">
          <Cpu className="text-blue-500 shrink-0 mt-0.5" size={13} />
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Innovation Highlight</span>
            <span className="text-[10px] text-slate-400 block leading-normal">{judgeInfo.innovation}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JudgeModePanel;
