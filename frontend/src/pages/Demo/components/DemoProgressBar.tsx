import React from "react";
import { useDemoStore } from "../../../store/demoStore";

export const DemoProgressBar: React.FC = () => {
  const { currentStep, steps, playbackSpeed } = useDemoStore();
  const total = steps.length;
  const progressPercent = Math.round(((currentStep) / total) * 100);

  // Compute remaining time in seconds: assume 6 seconds per step, adjusted by speed
  const stepDelaySeconds = 6;
  const remainingSteps = total - currentStep;
  const remainingSeconds = Math.round((remainingSteps * stepDelaySeconds) / playbackSpeed);

  const formatTime = (sec: number) => {
    if (sec <= 0) return "Finished";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div 
      role="progressbar"
      aria-valuenow={progressPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-200/10 dark:border-slate-800/80 px-4 py-2 select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 text-[10px] md:text-xs">
        {/* Step details */}
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-blue-500">Stage {currentStep + 1} of {total}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px] md:max-w-none">
            {steps[currentStep]?.title || "Product Tour"}
          </span>
        </div>

        {/* Time and percentage details */}
        <div className="flex items-center gap-4 shrink-0 font-bold">
          <div className="text-slate-400">
            Est. remaining: <span className="text-slate-700 dark:text-slate-250 font-black">{formatTime(remainingSeconds)}</span>
          </div>
          <div className="px-2.5 py-0.5 rounded-lg bg-blue-600/15 text-blue-500 font-extrabold">
            {progressPercent}% Complete
          </div>
        </div>
      </div>

      {/* Progress timeline gauge bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default DemoProgressBar;
