import React from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useDemoStore } from "../../../store/demoStore";

export const TourNavigation: React.FC = () => {
  const { currentStep, steps, nextStep, prevStep, exitDemo } = useDemoStore();
  const total = steps.length;

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur border border-slate-200/10 dark:border-slate-800/80 px-4 py-2 rounded-2xl shadow-xl select-none">
      <button
        onClick={prevStep}
        disabled={currentStep === 0}
        className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 rounded-lg text-xs font-bold transition-all disabled:hover:bg-slate-800 outline-none"
        title="Previous Stage"
        aria-label="Previous step"
      >
        <ArrowLeft size={14} />
      </button>

      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        Stage {currentStep + 1} / {total}
      </span>

      <button
        onClick={nextStep}
        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all outline-none"
        title="Next Stage"
        aria-label="Next step"
      >
        <ArrowRight size={14} />
      </button>

      <div className="w-px h-5 bg-slate-800 shrink-0" />

      <button
        onClick={exitDemo}
        className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors outline-none"
        title="Exit Guided Tour"
        aria-label="Exit tour"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default TourNavigation;
