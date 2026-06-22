import React, { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
  isLoading: boolean;
  progress?: number;
  stageText?: string;
}

const MESSAGES = [
  "Retrieving matched candidate pools...",
  "Evaluating technical stack alignment...",
  "Calculating profile consistency risk...",
  "Generating recruiter reasoning traces...",
  "Finalizing match leaderboard rankings...",
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, progress, stageText }) => {
  const [msgIdx, setMsgIdx] = useState(0);

  // Rotate messages while loading if no progress stages are actively set
  useEffect(() => {
    if (!isLoading || progress !== undefined) return;

    setMsgIdx(0);
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
    }, 850);

    return () => clearInterval(interval);
  }, [isLoading, progress]);

  if (!isLoading) return null;

  return (
    <div className="w-full space-y-8 select-none">
      {/* Dynamic Loader Panel */}
      <div className="glass-panel p-8 rounded-2xl border border-blue-500/15 dark:border-blue-500/10 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl flex flex-col items-center justify-center text-center gap-4 py-10 relative overflow-hidden">
        {/* Shimmer line overlay */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />

        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 animate-spin">
            <Loader2 size={22} />
          </div>
          <Sparkles size={14} className="text-purple-500 absolute -top-1 -right-1 animate-bounce" />
        </div>

        <div className="space-y-1.5 w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <motion.p
              key={stageText || msgIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs font-black text-slate-800 dark:text-slate-250 uppercase tracking-widest"
            >
              {stageText || MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>

          {progress !== undefined && (
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          )}

          <span className="text-[10px] text-slate-500 dark:text-slate-450 block font-semibold">
            {progress !== undefined ? `${progress}% complete` : "Running hybrid retrieval and neural rankers (approx. 2-3s)"}
          </span>
        </div>
      </div>

      {/* Shimmer Skeletons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="glass-panel p-5 rounded-2xl border border-slate-250/20 dark:border-slate-805 bg-slate-105/30 dark:bg-slate-900/20 shadow-xl space-y-4.5 animate-pulse"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-250 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-3 w-20 rounded bg-slate-250 dark:bg-slate-800" />
                  <div className="h-2 w-28 rounded bg-slate-250 dark:bg-slate-850" />
                </div>
              </div>
              <div className="w-14 h-5 rounded-lg bg-slate-250 dark:bg-slate-850" />
            </div>
            {/* Progress tracks */}
            <div className="space-y-2.5 pt-2">
              <div className="h-2 w-full rounded bg-slate-250 dark:bg-slate-850" />
              <div className="h-2 w-full rounded bg-slate-250 dark:bg-slate-850" />
              <div className="h-2 w-full rounded bg-slate-250 dark:bg-slate-850" />
            </div>
            {/* Chips */}
            <div className="flex gap-1.5 pt-1">
              <div className="h-4.5 w-12 rounded bg-slate-250 dark:bg-slate-850" />
              <div className="h-4.5 w-16 rounded bg-slate-250 dark:bg-slate-850" />
              <div className="h-4.5 w-10 rounded bg-slate-250 dark:bg-slate-850" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingOverlay;
