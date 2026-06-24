import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, Shield, Sparkles, Clock, FileSpreadsheet, ChevronDown } from "lucide-react";
import { SplineScene } from "@/components/ui/SplineScene";
import { Spotlight } from "@/components/ui/Spotlight";

interface AnalyticsHeroProps {
  totalCandidates: number;
  shortlistedCount: number;
  avgReliability: number;
  avgMatchScore: number;
  processingTime: number;
  reportsCount: number;
}

export const AnalyticsHero: React.FC<AnalyticsHeroProps> = ({
  totalCandidates,
  shortlistedCount,
  avgReliability,
  avgMatchScore,
  processingTime,
  reportsCount,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const kpis = [
    {
      label: "Total Pool Candidates",
      value: totalCandidates,
      suffix: "",
      icon: <Users size={20} className="text-blue-400" />,
      bg: "from-blue-500/10 to-indigo-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Shortlisted Candidates",
      value: shortlistedCount,
      suffix: "",
      icon: <CheckCircle size={20} className="text-emerald-400" />,
      bg: "from-emerald-500/10 to-teal-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Avg Reliability Score",
      value: Math.round(avgReliability * 100),
      suffix: "%",
      icon: <Shield size={20} className="text-violet-400" />,
      bg: "from-violet-500/10 to-purple-500/10",
      border: "border-violet-500/20",
    },
    {
      label: "Avg Match Score",
      value: Math.round(avgMatchScore * 100),
      suffix: "%",
      icon: <Sparkles size={20} className="text-amber-400" />,
      bg: "from-amber-500/10 to-orange-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Avg Telemetry Latency",
      value: processingTime,
      suffix: " ms",
      icon: <Clock size={20} className="text-cyan-400" />,
      bg: "from-cyan-500/10 to-blue-500/10",
      border: "border-cyan-500/20",
    },
    {
      label: "Reports Exported",
      value: reportsCount,
      suffix: "",
      icon: <FileSpreadsheet size={20} className="text-pink-400" />,
      bg: "from-pink-500/10 to-fuchsia-500/10",
      border: "border-pink-500/20",
    },
  ];

  return (
    <div 
      className="relative w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden rounded-3xl shadow-2xl mb-6"
      onMouseMove={handleMouseMove}
    >
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left content - Analytics Info */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative z-10">
          {/* Mouse follower effect */}
          <div
            className="absolute pointer-events-none bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full opacity-60 blur-3xl transition-transform duration-300 ease-out"
            style={{
              width: "300px",
              height: "300px",
              left: `${mousePosition.x - 150}px`,
              top: `${mousePosition.y - 150}px`,
              transform: `translate(${(mousePosition.x - 150) * 0.02}px, ${(mousePosition.y - 150) * 0.02}px)`,
            }}
          />

          <div className="max-w-2xl relative">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-heading mb-4">
                AI Recruiter Analytics
              </h1>
              <div className="my-6 border-t-2 border-b-2 border-slate-300 dark:border-slate-600 py-4">
                <p className="italic text-lg text-slate-700 dark:text-slate-300">
                  Where intelligent hiring meets data-driven insights.
                </p>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-lg leading-relaxed mb-4 text-slate-700 dark:text-slate-300">
                Monitor ranking quality, hiring insights, system latency, and AI evaluation metrics in real time. 
                Our AI-powered platform transforms recruitment with cutting-edge analytics and intelligent automation.
              </p>
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                From candidate evaluation to performance tracking, experience the future of talent acquisition 
                where technology and human expertise converge.
              </p>
            </motion.div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {kpis.map((kpi, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 20,
                    delay: 0.4 + idx * 0.05,
                  }}
                  className={`p-4 rounded-xl glass-panel border bg-gradient-to-br ${kpi.bg} ${kpi.border} shadow-lg flex flex-col gap-2 group hover:shadow-xl transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider">
                      {kpi.label}
                    </span>
                    <div className="shrink-0 group-hover:scale-110 transition-transform duration-200">
                      {kpi.icon}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {kpi.value}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-400 font-mono">
                      {kpi.suffix}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Explore More */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 flex items-center"
            >
              <div className="h-px bg-slate-400 dark:bg-slate-600 flex-grow mr-4"></div>
              <span className="text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">
                Explore Insights
              </span>
              <ChevronDown className="ml-2 h-4 w-4 text-slate-600 dark:text-slate-400 animate-bounce" />
            </motion.div>
          </div>
        </div>

        {/* Right content - 3D Spline Scene */}
        <div className="w-full lg:w-1/2 relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
          {/* Grid background effect */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
          
          <div className="relative z-10 w-full h-full min-h-[400px] lg:min-h-full">
            <Spotlight size={400} springOptions={{ stiffness: 50, damping: 20, mass: 0.5 }} />
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHero;
