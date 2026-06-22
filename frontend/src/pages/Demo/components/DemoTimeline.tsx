import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { useDemoStore } from "../../../store/demoStore";

export const DemoTimeline: React.FC = () => {
  const { currentStep, steps, jumpToStep } = useDemoStore();

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200/10 dark:border-slate-800/80 shadow-xl space-y-4 max-w-xs select-none">
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 font-sans">
          Tour Stages
        </h4>
        <p className="text-[10px] text-slate-400">Jump to any evaluation section</p>
      </div>

      <div className="relative border-l border-slate-200/15 dark:border-slate-800/80 ml-3.5 space-y-3">
        {steps.map((step, idx) => {
          const isVisited = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <button
              key={step.id}
              onClick={() => jumpToStep(idx)}
              className="w-full flex items-center gap-3 pl-4 relative text-left group outline-none"
            >
              {/* Bullet circle index */}
              <div className="absolute -left-3 top-0.5 flex items-center justify-center bg-[#0d1117]">
                {isVisited ? (
                  <CheckCircle2 className="text-emerald-500" size={14} />
                ) : isActive ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-500 animate-pulse flex items-center justify-center text-[8px] font-black text-white">
                    {idx + 1}
                  </span>
                ) : (
                  <Circle className="text-slate-500 group-hover:text-slate-450" size={14} />
                )}
              </div>

              <div className="text-[11px] leading-tight">
                <span className={`font-bold block transition-colors ${
                  isActive 
                    ? "text-blue-500" 
                    : isVisited 
                    ? "text-slate-400 dark:text-slate-350" 
                    : "text-slate-500 dark:text-slate-450 group-hover:text-slate-350"
                }`}>
                  {step.title}
                </span>
                <span className="text-[9px] text-slate-500 font-medium block truncate max-w-[150px]">
                  {step.route}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DemoTimeline;
