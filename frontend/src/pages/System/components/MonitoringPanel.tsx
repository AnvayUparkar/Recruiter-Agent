import React, { useState, useEffect } from "react";
import { LineChart, Activity, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export const MonitoringPanel: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [ticker, setTicker] = useState(0);

  // Cycle charts slightly every second for a live, glowing ticker feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const generateSvgPath = (points: number[], width: number, height: number, max: number) => {
    const stepX = width / (points.length - 1);
    return points
      .map((p, idx) => {
        const x = idx * stepX;
        const y = height - (p / max) * height;
        return `${idx === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  // Mock datasets modified by the ticker loop
  const latencyPoints = [120, 145, 130, 240, 180, 110, 135, 140, 160 + (ticker % 30) - 15];
  const memoryPoints = [520, 528, 532, 545, 540, 552, 556, 560, 558 + (ticker % 4) - 2];
  const requestPoints = [45, 62, 55, 78, 92, 110, 85, 98, 105 + (ticker % 10) - 5];
  const errorPoints = [0.1, 0.4, 0.2, 0.9, 0.5, 0.2, 0.1, 0.3, 0.2 + (ticker % 2 === 0 ? 0.2 : -0.1)];

  const charts = [
    { title: "API Latency (p95)", unit: "ms", points: latencyPoints, max: 300, color: "#4F7CFF", val: `${latencyPoints[latencyPoints.length - 1]}ms` },
    { title: "Node Memory Allocation", unit: "MB", points: memoryPoints, max: 700, color: "#10B981", val: `${memoryPoints[memoryPoints.length - 1]}MB` },
    { title: "Live Requests Throttle", unit: "RPM", points: requestPoints, max: 150, color: "#8B5CF6", val: `${requestPoints[requestPoints.length - 1]} RPM` },
    { title: "Gateway Client Errors", unit: "%", points: errorPoints, max: 2, color: "#EF4444", val: `${errorPoints[errorPoints.length - 1].toFixed(2)}%` }
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <div className="flex justify-between items-center pb-1">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <LineChart size={16} className="text-blue-500" />
          <span>Real-time System Metrics</span>
        </h3>
        <span className="flex items-center gap-1.5 text-[9px] text-emerald-500 font-extrabold uppercase font-mono tracking-wider">
          <Activity size={10} className="animate-pulse" />
          <span>Live feed active</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {charts.map((c) => {
          const path = generateSvgPath(c.points, 240, 70, c.max);
          return (
            <div
              key={c.title}
              className="p-4 rounded-xl border border-slate-200/10 dark:border-slate-850 bg-slate-200/20 dark:bg-slate-950/40 flex flex-col gap-2.5"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                  {c.title}
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-0.5">
                  <span>{c.val}</span>
                  <ArrowUpRight size={10} className="text-slate-400 shrink-0" />
                </span>
              </div>

              {/* Sparkline Graphic rendering */}
              <div className="h-[75px] w-full mt-1.5 relative overflow-hidden bg-slate-300/10 dark:bg-slate-950/20 rounded-lg flex items-end">
                <svg className="w-full h-[70px] overflow-visible" viewBox="0 0 240 70" preserveAspectRatio="none">
                  {/* Glowing line shadow */}
                  <motion.path
                    d={path}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={shouldReduceMotion ? 2.5 : 4.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={shouldReduceMotion ? 0.35 : 0.15}
                  />
                  {/* Core stroke */}
                  <motion.path
                    d={path}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonitoringPanel;
