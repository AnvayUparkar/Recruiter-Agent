import React, { useEffect, useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface CounterDigitProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const CounterDigit: React.FC<CounterDigitProps> = ({
  target,
  duration = 1500,
  prefix = "",
  suffix = "",
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (shouldReduceMotion) {
      setCount(target); // skip animation if reduced motion is preferred
      return;
    }

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isInView, target, duration, shouldReduceMotion]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export const MetricsSection: React.FC = () => {
  const metrics = [
    {
      value: <CounterDigit target={100} suffix="K+" />,
      label: "Profiles Indexed",
      description: "Pre-loaded candidate profiles calibrated in database storage.",
    },
    {
      value: <CounterDigit target={95} suffix="%" />,
      label: "Vetting Accuracy",
      description: "Calibrated skill alignment matching precision.",
    },
    {
      value: <CounterDigit target={2} prefix="< " suffix="s" />,
      label: "Ranking Latency",
      description: "Average latency required to prioritize 1,000+ candidates.",
    },
    {
      value: <span className="text-xl sm:text-2xl font-black">Explainable</span>,
      label: "AI Fit Decisions",
      description: "Every fit decision is backed by transparent audit guidelines.",
    },
  ];

  return (
    <section className="w-full py-16 lg:py-24 border-t border-slate-200/10 dark:border-slate-800/30 bg-slate-200/10 dark:bg-slate-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl glass-panel border border-slate-250/20 dark:border-slate-800/40 bg-slate-100/50 dark:bg-slate-900/50 shadow-md"
            >
              {/* Metric Value */}
              <div className="text-3xl sm:text-4xl font-black text-blue-500 dark:text-blue-450 tracking-tight leading-none mb-1">
                {m.value}
              </div>

              {/* Label and Sub-copy */}
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
                  {m.label}
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium max-w-[200px] mx-auto">
                  {m.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
