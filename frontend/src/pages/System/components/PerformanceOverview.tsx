import React from "react";
import { Gauge, Clock, Zap, Cpu, Compass } from "lucide-react";

export const PerformanceOverview: React.FC = () => {

  const metrics = [
    { label: "Lighthouse Score", val: "99/100", status: "good", icon: <Gauge size={14} className="text-emerald-500" /> },
    { label: "Largest Contentful Paint (LCP)", val: "0.85s", status: "good", icon: <Clock size={14} className="text-emerald-500" /> },
    { label: "First Input Delay (FID)", val: "14ms", status: "good", icon: <Zap size={14} className="text-emerald-500" /> },
    { label: "Cumulative Layout Shift (CLS)", val: "0.01", status: "good", icon: <Compass size={14} className="text-emerald-500" /> }
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Gauge size={16} className="text-blue-500" />
        <span>Web Vitals & Bundle Health</span>
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="p-3.5 rounded-xl border border-slate-200/10 dark:border-slate-850 bg-slate-200/20 dark:bg-slate-950/40 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                {m.label}
              </span>
              {m.icon}
            </div>
            <span className="text-lg font-black text-slate-855 dark:text-slate-200 tracking-tight">
              {m.val}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[8px] text-emerald-505 dark:text-emerald-400 font-extrabold uppercase font-sans tracking-wide">
                Optimal Limit
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-550 dark:text-blue-400 text-[10px] mt-1 font-semibold leading-relaxed">
        <Cpu size={14} className="shrink-0 animate-pulse" />
        <span>Compressed static production build: CSS (116.9 kB) and main layout JS chunks loaded under 2.1s threshold.</span>
      </div>
    </div>
  );
};

export default PerformanceOverview;
