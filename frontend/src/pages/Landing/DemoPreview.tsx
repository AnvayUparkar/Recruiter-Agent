import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bot, UserCheck, CheckCircle2 } from "lucide-react";

export const DemoPreview: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Radar polygon vertices for a ML Engineer profile (skills: search, machine learning, systems, etc.)
  const radarPoints = "100,30 155,70 145,130 55,130 45,70"; // center is roughly 100,85

  return (
    <section className="w-full py-16 lg:py-24 border-t border-slate-200/10 dark:border-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left column: Text details */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
          <span className="text-[10px] font-black text-blue-550 uppercase tracking-widest">
            Interactive Showcase
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            See the Recruiter Intelligence in Action
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
            No more digging through uncalibrated lists. The platform instantly verifies profile tenure, checks for timeline gaps, and outputs recruiter summaries with custom structured interview target questions.
          </p>

          {/* Core Calibration checklist */}
          <div className="space-y-3 pt-2 w-full max-w-sm">
            {[
              "Calibrated ranking tailed to strategy profiles",
              "Verifies tenure alignment and detects anomalies",
              "Outputs detailed explainability reports",
              "Generates structured questions for phone screens"
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs text-slate-650 dark:text-slate-350 font-medium">
                <CheckCircle2 size={15} className="text-blue-500 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Arc-browser dashboard mockup preview */}
        <div className="lg:col-span-7 w-full flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="w-full max-w-2xl bg-slate-150/70 dark:bg-slate-950/75 glass-panel rounded-2xl border border-slate-250 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col select-none relative"
          >
            {/* Top Arc-style Mock Browser Header */}
            <div className="h-10 border-b border-slate-200/10 dark:border-slate-800/50 bg-slate-200/40 dark:bg-slate-900/30 px-4 flex items-center gap-2">
              <div className="flex gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-800" />
              </div>
              <div className="mx-auto w-40 sm:w-60 h-5.5 rounded-lg bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-mono tracking-wide">
                antigravity.ai/candidates/cand_01
              </div>
            </div>

            {/* Inner Dashboard layout mock */}
            <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-5 relative overflow-hidden">
              
              {/* Shimmer sweep effect */}
              {!shouldReduceMotion && (
                <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-blue-500/3 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
              )}

              {/* Main Candidate Card Column */}
              <div className="md:col-span-7 space-y-4">
                <div className="glass-panel p-4.5 rounded-2xl border border-blue-500/20 dark:border-blue-400/20 bg-slate-100/90 dark:bg-slate-900/80 shadow relative">
                  
                  {/* Strong fit badge */}
                  <div className="absolute right-4 top-4 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-[9px] tracking-wide uppercase flex items-center gap-1.5 shadow-sm">
                    <UserCheck size={10} />
                    <span>Strong Fit</span>
                  </div>

                  {/* Profile Header info */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase">Calibration Candidate</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      Alexander K. Rivera
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium">
                      Senior Machine Learning Engineer • FAISS specialist
                    </p>
                  </div>

                  {/* Key Scores display */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-3.5 border-t border-slate-250/20 dark:border-slate-850">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-450 dark:text-slate-550 font-bold uppercase tracking-wider block">Calibrated Fit</span>
                      <span className="text-lg font-black text-blue-500 dark:text-blue-400">96.8%</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-450 dark:text-slate-550 font-bold uppercase tracking-wider block">Reliability score</span>
                      <span className="text-lg font-black text-purple-500 dark:text-purple-400">98.2%</span>
                    </div>
                  </div>
                </div>

                {/* Recruiter Summary Card */}
                <div className="glass-panel p-4.5 rounded-2xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/60 shadow space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Bot size={14} className="text-blue-500 shrink-0" />
                    <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 tracking-wider uppercase">Executive Summary</span>
                  </div>
                  <p className="text-[10px] text-slate-650 dark:text-slate-400 leading-relaxed font-medium">
                    Alexander demonstrates exceptional competence in vector distance search models. He possesses 6 years of tenure in search engineering, verifying clean transitions. No timeline gaps detected.
                  </p>
                </div>
              </div>

              {/* Side Stats Radar Column */}
              <div className="md:col-span-5 flex flex-col gap-4">
                
                {/* Custom SVG Radar Chart */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/60 flex flex-col items-center justify-center shadow">
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-550 tracking-wider uppercase mb-2">Alignment Radar</span>
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    
                    {/* SVG graphic */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 200 170">
                      {/* Grid rings */}
                      <circle cx="100" cy="85" r="75" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-850" strokeWidth="1" />
                      <circle cx="100" cy="85" r="50" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-850" strokeWidth="1" />
                      <circle cx="100" cy="85" r="25" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-850" strokeWidth="1" />
                      
                      {/* Axis Lines */}
                      <line x1="100" y1="10" x2="100" y2="160" stroke="currentColor" className="text-slate-200 dark:text-slate-850" strokeWidth="1" />
                      <line x1="25" y1="85" x2="175" y2="85" stroke="currentColor" className="text-slate-200 dark:text-slate-850" strokeWidth="1" />
                      
                      {/* Filled Radar Polygon */}
                      <polygon
                        points={radarPoints}
                        fill="rgba(59, 130, 246, 0.25)"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        className="animate-pulse duration-[3000ms]"
                      />
                      
                      {/* Vertices indicator points */}
                      <circle cx="100" cy="30" r="3" fill="#3b82f6" />
                      <circle cx="155" cy="70" r="3" fill="#3b82f6" />
                      <circle cx="145" cy="130" r="3" fill="#3b82f6" />
                      <circle cx="55" cy="130" r="3" fill="#3b82f6" />
                      <circle cx="45" cy="70" r="3" fill="#3b82f6" />
                    </svg>
                  </div>
                </div>

                {/* Verification checklist indicators */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/60 flex flex-col gap-2.5 shadow">
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-550 tracking-wider uppercase">Vetting Checks</span>
                  <div className="space-y-2">
                    {[
                      { label: "Tenure Authenticated", status: "pass" },
                      { label: "Keyword Stuffing", status: "clear" },
                      { label: "Tenure Stability", status: "pass" }
                    ].map((check, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold">{check.label}</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-extrabold uppercase text-[8px] tracking-wide">
                          {check.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DemoPreview;
