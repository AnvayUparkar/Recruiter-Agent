import React, { useEffect, useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, XCircle, Info } from "lucide-react";
import { useDemoStore, DemoStep } from "../../../store/demoStore";
import { motion, AnimatePresence } from "framer-motion";
import JudgeModePanel from "./JudgeModePanel";

interface FeatureCalloutProps {
  step: DemoStep;
  totalSteps: number;
}

export const FeatureCallout: React.FC<FeatureCalloutProps> = ({ step, totalSteps }) => {
  const { currentStep, nextStep, prevStep, exitDemo, judgeMode } = useDemoStore();
  const [coords, setCoords] = useState<{ top: number; left: number; position: "left" | "right" | "bottom" | "top" | "center" }>({
    top: 200,
    left: 200,
    position: "center"
  });

  const calculatePosition = () => {
    if (!step.selector) {
      setCoords({ top: window.innerHeight / 2 - 150, left: window.innerWidth / 2 - 200, position: "center" });
      return;
    }

    const element = document.querySelector(step.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Position logic depending on selector layout quadrants
      let left = rect.right + 20;
      let top = rect.top;
      let position: typeof coords.position = "right";

      // If too close to right edge, place on left
      if (rect.right > viewportWidth - 340) {
        left = rect.left - 360;
        position = "left";
      }

      // If too close to both sides (wide element), place above or below
      if (rect.width > viewportWidth * 0.7) {
        left = viewportWidth / 2 - 170;
        if (rect.bottom < viewportHeight - 300) {
          top = rect.bottom + 20;
          position = "bottom";
        } else {
          top = rect.top - 280;
          position = "top";
        }
      }

      // Keep inside vertical screen limits
      top = Math.max(80, Math.min(viewportHeight - 360, top));
      // Keep inside horizontal screen limits
      left = Math.max(20, Math.min(viewportWidth - 360, left));

      setCoords({ top, left, position });
    } else {
      // Centered fallback
      setCoords({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 180,
        position: "center"
      });
    }
  };

  useEffect(() => {
    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, { passive: true });
    
    const interval = setInterval(calculatePosition, 1000);

    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition);
      clearInterval(interval);
    };
  }, [step]);

  return (
    <div 
      className="fixed z-50 transition-all duration-300 w-[340px] md:w-[360px]"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel p-5 rounded-3xl border border-slate-200/10 dark:border-slate-800/80 shadow-2xl space-y-5 bg-slate-950/90 backdrop-blur-xl relative"
      >
        {/* Glow border ring */}
        <div className="absolute inset-0 rounded-3xl border border-blue-500/20 pointer-events-none" />

        {/* Top Header details */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5 select-none">
            <Sparkles size={12} />
            Step {currentStep + 1} of {totalSteps}
          </span>
          <button
            onClick={exitDemo}
            className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
            title="Exit Tour"
            aria-label="Exit product tour"
          >
            <XCircle size={16} />
          </button>
        </div>

        {/* Title & explanation */}
        <div className="space-y-2">
          <h4 className="text-sm font-black text-slate-100 font-sans tracking-wide">
            {step.title}
          </h4>
          <p className="text-xs text-slate-400 leading-normal font-medium">
            {step.explanation}
          </p>
        </div>

        {/* Value Prop banner */}
        <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/15 flex items-start gap-2.5">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-300 leading-normal font-semibold">
            {step.valueProp}
          </p>
        </div>

        {/* Action navigation controls */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-200/10 select-none">
          <div className="flex gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-2.5 py-1.5 bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-20 disabled:hover:bg-slate-500/10 text-slate-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all"
            >
              <ArrowLeft size={12} />
              Back
            </button>
            <button
              onClick={nextStep}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all shadow-md shadow-blue-600/15"
            >
              <span>{currentStep === totalSteps - 1 ? "Complete" : "Next"}</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <button
            onClick={exitDemo}
            className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-400 transition-colors"
          >
            End Tour
          </button>
        </div>
      </motion.div>

      {/* Floating Judge Mode Details Overlay (attached next to Callouts if JudgeMode is true) */}
      <AnimatePresence>
        {judgeMode && (
          <div className="mt-4">
            <JudgeModePanel judgeInfo={step.judgeInfo} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureCallout;
