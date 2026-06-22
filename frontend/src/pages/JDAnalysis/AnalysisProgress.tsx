import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";

interface AnalysisProgressProps {
  isPending: boolean;
  onComplete?: () => void;
}

interface StepItem {
  id: number;
  label: string;
  sublabel: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  isPending,
  onComplete,
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const shouldReduceMotion = useReducedMotion();

  const steps: StepItem[] = [
    { id: 1, label: "Reading Job Description", sublabel: "Parsing lexical content and raw text blocks" },
    { id: 2, label: "Extracting Skills", sublabel: "Retrieving required, preferred, and nice-to-have capabilities" },
    { id: 3, label: "Understanding Experience", sublabel: "Vetting tenure criteria and domain expertise targets" },
    { id: 4, label: "Inferring Seniority", sublabel: "Identifying leadership profiles and tier brackets" },
    { id: 5, label: "Building AI Summary", sublabel: "Synthesizing executive recruiter briefs and details" },
  ];

  // Increment steps periodically to simulate deep semantic scanning
  useEffect(() => {
    if (!isPending) return;

    setActiveStep(1);
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          onComplete?.();
          return 5;
        }
        return prev + 1;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isPending, onComplete]);

  const springConfig = { type: "spring", stiffness: 300, damping: 25 };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start py-4">
      {/* Left Column: Progress Stepper Checklist */}
      <div className="md:col-span-5 glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl flex flex-col gap-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-250/20 dark:border-slate-850">
          <Sparkles size={16} className="text-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Analysis Progress
          </span>
        </div>

        {/* Stepper Timeline List */}
        <div className="flex flex-col gap-5 relative">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[17px] top-[14px] bottom-[14px] w-0.5 bg-slate-200 dark:bg-slate-800 pointer-events-none" />

          {steps.map((step) => {
            const isCompleted = step.id < activeStep;
            const isActive = step.id === activeStep;
            const isPendingStep = step.id > activeStep;

            return (
              <div key={step.id} className="flex gap-4 items-start relative select-none">
                {/* Node circle wrapper */}
                <div className="relative shrink-0">
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      /* Completed green check badge */
                      <motion.div
                        key="check"
                        initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.7, opacity: 0 }}
                        transition={springConfig}
                        className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/5"
                        role="status"
                        aria-label={`${step.label} Completed`}
                      >
                        <Check size={16} strokeWidth={3} />
                      </motion.div>
                    ) : isActive ? (
                      /* Active spinning blue loader badge */
                      <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-500 flex items-center justify-center shadow-md shadow-blue-500/5 relative"
                        role="status"
                        aria-label={`${step.label} Active`}
                      >
                        <Loader2 size={16} className="animate-spin text-blue-500" />
                        <span className="absolute inset-0 w-full h-full rounded-xl border border-blue-500 animate-ping opacity-25" />
                      </motion.div>
                    ) : (
                      /* Pending gray badge */
                      <motion.div
                        key="pending"
                        className="w-9 h-9 rounded-xl bg-slate-205 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600 flex items-center justify-center"
                      >
                        <span className="text-[10px] font-mono font-bold">{step.id}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Text titles */}
                <div className="space-y-0.5 pt-1">
                  <span
                    className={`text-xs font-bold block transition-colors duration-200
                      ${isCompleted ? "text-slate-900 dark:text-slate-200" : ""}
                      ${isActive ? "text-blue-500 dark:text-blue-400 font-extrabold" : ""}
                      ${isPendingStep ? "text-slate-450 dark:text-slate-650" : ""}`}
                  >
                    {step.label}
                  </span>
                  <span
                    className={`text-[10px] block transition-colors duration-200 leading-normal
                      ${isCompleted ? "text-slate-500 dark:text-slate-450" : ""}
                      ${isActive ? "text-slate-600 dark:text-slate-350" : ""}
                      ${isPendingStep ? "text-slate-400 dark:text-slate-700" : ""}`}
                  >
                    {step.sublabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Loading Skeletons */}
      <div className="md:col-span-7 space-y-5 animate-pulse">
        {/* Summary Skeleton */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/40 dark:bg-slate-900/30 flex flex-col gap-3">
          <div className="h-4 w-1/3 rounded bg-slate-250 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded bg-slate-300 dark:bg-slate-800/60" />
            <div className="h-2.5 w-11/12 rounded bg-slate-300 dark:bg-slate-800/60" />
          </div>
        </div>

        {/* Skills Grid Skeleton */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/40 dark:bg-slate-900/30 space-y-4">
          <div className="h-4 w-1/4 rounded bg-slate-250 dark:bg-slate-800" />
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="h-7 w-20 rounded-xl bg-slate-300 dark:bg-slate-800/60" />
            <div className="h-7 w-24 rounded-xl bg-slate-300 dark:bg-slate-800/60" />
            <div className="h-7 w-16 rounded-xl bg-slate-300 dark:bg-slate-800/60" />
            <div className="h-7 w-22 rounded-xl bg-slate-300 dark:bg-slate-800/60" />
          </div>
        </div>

        {/* Detail Cards Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/40 dark:bg-slate-900/30 flex flex-col gap-2.5">
            <div className="h-3 w-1/2 rounded bg-slate-250 dark:bg-slate-800" />
            <div className="h-6 w-2/3 rounded bg-slate-300 dark:bg-slate-800/60" />
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/40 dark:bg-slate-900/30 flex flex-col gap-2.5">
            <div className="h-3 w-1/2 rounded bg-slate-250 dark:bg-slate-800" />
            <div className="h-6 w-2/3 rounded bg-slate-300 dark:bg-slate-800/60" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgress;
