import React from "react";
import { CheckCircle2, RotateCcw, LayoutDashboard, Compass, Sparkles } from "lucide-react";
import { useDemoStore } from "../../../store/demoStore";
import { motion } from "framer-motion";

export const DemoCompletionScreen: React.FC = () => {
  const { startDemo, exitDemo, scenario } = useDemoStore();

  const handleRestart = () => {
    startDemo(scenario, "guided");
  };

  const handleManualExplore = () => {
    exitDemo();
    window.location.href = "/dashboard";
  };

  const handleExploreFreely = () => {
    exitDemo(); // clears demo active status but leaves user on current route
  };

  const featureSummaries = [
    { label: "JD Intelligence Parser", description: "Automated requirements mining and skill classification." },
    { label: "Hybrid Search Retrieval", description: "Seamless dual-path semantic vectors and exact keyword matches." },
    { label: "Explainable AI Ranking", description: "Top-K Cross-Encoder scoring structures with transparency parameters." },
    { label: "Reliability Profile Audit", description: "Integrity index mappings tracking anomaly ratios and career gaps." },
    { label: "AI Recruiter Copilot", description: "Interactive prompt chat audits over finalist credentials." },
    { label: "Multi-Candidate Comparison", description: "2-5 finalist matching matrices and radar curve comparisons." },
    { label: "IR telemetries Analytics", description: "Verification logs of search engine NDCG indices and health scores." },
    { label: "Platform Admin Console", description: "Scoring weights calibration sliders with proportional checks." },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0d1117] text-white font-sans relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[30%] left-[25%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[100px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl glass-panel p-8 md:p-10 rounded-3xl border border-slate-200/10 dark:border-slate-800/80 shadow-2xl relative z-10 text-center bg-slate-950/20 backdrop-blur-xl space-y-8"
      >
        {/* Glow border ring */}
        <div className="absolute inset-0 rounded-3xl border border-blue-500/20 pointer-events-none" />

        {/* Celebrate title */}
        <div className="space-y-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest select-none"
          >
            <Sparkles size={12} />
            Showcase Tour Completed
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-300 to-indigo-400 font-sans leading-tight">
            Congratulations! You've experienced the future of AI-assisted hiring.
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto font-medium">
            You have successfully audited the complete talent sourcing pipeline and observed configuration safeguards.
          </p>
        </div>

        {/* Traversed Modules Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2 border-t border-slate-200/10 dark:border-slate-800/50">
          {featureSummaries.map((feat) => (
            <div key={feat.label} className="p-3 bg-slate-500/5 border border-slate-250/[0.03] rounded-xl flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
              <div className="space-y-0.5">
                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 block">{feat.label}</span>
                <span className="text-[9px] text-slate-400 block leading-normal font-medium">{feat.description}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-200/10 dark:border-slate-800/50 text-xs font-extrabold select-none">
          <button
            onClick={handleRestart}
            className="w-full sm:w-auto px-6 py-3 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 rounded-xl border border-slate-200/10 flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <RotateCcw size={14} />
            Restart Tour
          </button>
          
          <button
            onClick={handleManualExplore}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 shadow shadow-blue-600/10 transition-all hover:scale-105"
          >
            <LayoutDashboard size={14} />
            Open Dashboard
          </button>
          
          <button
            onClick={handleExploreFreely}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl flex items-center justify-center gap-2 shadow shadow-emerald-650/10 transition-all hover:scale-105"
          >
            <Compass size={14} />
            Explore Freely
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DemoCompletionScreen;
