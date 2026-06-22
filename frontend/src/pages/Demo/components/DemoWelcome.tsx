import React from "react";
import { Play, Navigation, Eye, Sparkles } from "lucide-react";
import { useDemoStore } from "../../../store/demoStore";
import { motion } from "framer-motion";
import DemoScenarioSelector from "./DemoScenarioSelector";

export const DemoWelcome: React.FC = () => {
  const { startDemo, scenario } = useDemoStore();

  const handleStartGuided = () => {
    startDemo(scenario, "guided");
  };

  const handleStartAuto = () => {
    startDemo(scenario, "auto");
  };

  const handleManualExplore = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#0d1117] relative overflow-hidden text-white font-sans">
      {/* Cinematic Animated Gradient Mesh Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: Math.random() * 800, x: Math.random() * 1000, scale: Math.random() * 0.5 + 0.5 }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              opacity: [0, 1, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: Math.random() * 10 + 10,
              ease: "linear"
            }}
            className="absolute w-1.5 h-1.5 rounded-full bg-blue-400"
          />
        ))}
      </div>

      {/* Welcome Hero Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl glass-panel p-8 md:p-12 rounded-3xl border border-slate-200/10 dark:border-slate-800/80 shadow-2xl relative z-10 text-center space-y-8 bg-slate-950/20 backdrop-blur-xl"
      >
        <div className="space-y-4">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest select-none"
          >
            <Sparkles size={12} />
            Interactive Presentation Engine
          </motion.div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-300 to-indigo-400 font-sans leading-tight">
            Welcome to the AI Recruiter Experience
          </h1>
          
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Watch how explainable AI transforms hiring decisions in minutes. Explore ranking heuristics, vector similarities, and AI recruiters interactions.
          </p>
        </div>

        {/* Dynamic Preset Scenarios Selector Component */}
        <div className="pt-4 border-t border-slate-200/10 dark:border-slate-800/50">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Choose a Demo Hiring Scenario</h2>
          <DemoScenarioSelector />
        </div>

        {/* Buttons Controls Grid */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 text-xs font-extrabold select-none">
          {/* Start Guided */}
          <button
            onClick={handleStartGuided}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-98"
          >
            <Navigation size={14} className="rotate-45" />
            Start Guided Demo
          </button>

          {/* Start Auto */}
          <button
            onClick={handleStartAuto}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all hover:scale-105 active:scale-98"
          >
            <Play size={14} fill="white" />
            Watch Auto Demo
          </button>

          {/* Explore Manually */}
          <button
            onClick={handleManualExplore}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-350 border border-slate-200/10 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-98"
          >
            <Eye size={14} />
            Explore Manually
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DemoWelcome;
