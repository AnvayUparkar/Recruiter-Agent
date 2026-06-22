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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Card 1: Traditional ATS */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass-panel p-6.5 rounded-2xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-100/40 dark:bg-slate-900/30 shadow flex flex-col gap-4.5"
          >
            <div className="space-y-1 pb-3.5 border-b border-slate-250/20 dark:border-slate-800/40">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Outdated Scanners</span>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-250">Traditional ATS</h3>
            </div>
            
            <div className="flex-1 space-y-3.5">
              {[
                { label: "Keyword Matching only", supported: true },
                { label: "No profile tenure reasoning", supported: false },
                { label: "No trust scoring audits", supported: false },
                { label: "Weak fit explainability", supported: false }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  {item.supported ? (
                    <Check size={14} className="text-blue-500 shrink-0" />
                  ) : (
                    <X size={14} className="text-rose-500 shrink-0" />
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
            className="glass-panel p-6.5 rounded-2xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-100/40 dark:bg-slate-900/30 shadow flex flex-col gap-4.5"
          >
            <div className="space-y-1 pb-3.5 border-b border-slate-250/20 dark:border-slate-800/40">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Standard API Matches</span>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-250">Basic AI Matching</h3>
            </div>
            
            <div className="flex-1 space-y-3.5">
              {[
                { label: "Semantic similarity models", supported: true },
                { label: "No recruiter intelligence", supported: false },
                { label: "Limited profile transparency", supported: false },
                { label: "No phone screen insights", supported: false }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  {item.supported ? (
                    <Check size={14} className="text-blue-500 shrink-0" />
                  ) : (
                    <X size={14} className="text-rose-500 shrink-0" />
                  )}
                  <span className={!item.supported ? "opacity-75" : ""}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3: Our Platform (Highlighted Gradient Border) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-panel p-6.5 rounded-2xl border border-blue-500/30 dark:border-blue-400/20 bg-slate-100/90 dark:bg-slate-900/90 shadow-2xl flex flex-col gap-4.5 relative"
          >
            {/* Highlighted indicator badge */}
            <div className="absolute right-4.5 top-4.5 px-2 py-0.5 rounded bg-blue-500 text-white font-extrabold text-[8px] tracking-wider uppercase shadow">
              Active Setup
            </div>

            <div className="space-y-1 pb-3.5 border-b border-blue-500/20 dark:border-blue-450/25">
              <span className="text-[9px] font-bold text-blue-550 dark:text-blue-400 uppercase tracking-wider block">Next-Gen Calibrations</span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles size={16} className="text-blue-500" />
                <span>Our Copilot Platform</span>
              </h3>
            </div>
            
            <div className="flex-1 space-y-3.5">
              {[
                "Hybrid FAISS + BM25 Retrieval",
                "Calibrated Reliability Auditing",
                "Explainable Calibrated Ranking",
                "AI Recruiter Executive Summaries",
                "Structured Phone Screen Questions"
              ].map((label, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-slate-800 dark:text-slate-200 font-bold">
                  <Check size={14} className="text-emerald-500 shrink-0" />
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
