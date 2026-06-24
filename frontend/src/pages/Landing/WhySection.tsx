import React from "react";
import { motion } from "framer-motion";
import { Check, X, Sparkles } from "lucide-react";

export const WhySection: React.FC = () => {
  return (
    <section className="w-full py-16 lg:py-24 border-t border-slate-200/10 dark:border-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] font-black text-blue-550 uppercase tracking-widest">
            Strategic Calibrator
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Why Recruiter-Grade AI Matters
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            How our calibrated platform performs against outdated keyword scanners and generic semantic matcher APIs.
          </p>
        </div>

        {/* 3 Column comparison layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Card 1: Traditional ATS */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass-panel p-7 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 bg-white/80 dark:bg-slate-900/30 shadow-lg flex flex-col gap-5"
          >
            <div className="space-y-2 pb-4 border-b border-slate-200/60 dark:border-slate-800/40">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Outdated Scanners</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Traditional ATS</h3>
            </div>
            
            <div className="flex-1 space-y-4">
              {[
                { label: "Keyword Matching only", supported: true },
                { label: "No profile tenure reasoning", supported: false },
                { label: "No trust scoring audits", supported: false },
                { label: "Weak fit explainability", supported: false }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {item.supported ? (
                    <Check size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <X size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <span className={!item.supported ? "opacity-75" : ""}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 2: Basic AI matching */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-panel p-7 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 bg-white/80 dark:bg-slate-900/30 shadow-lg flex flex-col gap-5"
          >
            <div className="space-y-2 pb-4 border-b border-slate-200/60 dark:border-slate-800/40">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Standard API Matches</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Basic AI Matching</h3>
            </div>
            
            <div className="flex-1 space-y-4">
              {[
                { label: "Semantic similarity models", supported: true },
                { label: "No recruiter intelligence", supported: false },
                { label: "Limited profile transparency", supported: false },
                { label: "No phone screen insights", supported: false }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {item.supported ? (
                    <Check size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <X size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <span className={!item.supported ? "opacity-75" : ""}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3: Our Platform (Highlighted) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-panel p-7 rounded-3xl border-2 border-blue-400/40 dark:border-blue-400/30 bg-gradient-to-br from-blue-50/50 to-white/90 dark:from-slate-900/90 dark:to-slate-900/70 shadow-2xl flex flex-col gap-5 relative"
          >
            {/* Highlighted indicator badge */}
            <div className="absolute right-5 top-5 px-3 py-1.5 rounded-full bg-blue-500 text-white font-extrabold text-[9px] tracking-wider uppercase shadow-lg">
              Active Setup
            </div>

            <div className="space-y-2 pb-4 border-b-2 border-blue-300/40 dark:border-blue-450/25">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Next-Gen Calibrations</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" />
                <span>Our Copilot Platform</span>
              </h3>
            </div>
            
            <div className="flex-1 space-y-4">
              {[
                "Hybrid FAISS + BM25 Retrieval",
                "Calibrated Reliability Auditing",
                "Explainable Calibrated Ranking",
                "AI Recruiter Executive Summaries",
                "Structured Phone Screen Questions"
              ].map((label, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-900 dark:text-slate-100 font-bold">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default WhySection;
