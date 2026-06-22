import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, FileText, ArrowRight, Compass } from "lucide-react";

export const CTASection: React.FC = () => {

  return (
    <section className="w-full py-16 lg:py-24 relative overflow-hidden border-t border-slate-200/10 dark:border-slate-800/30">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 bg-slate-100 dark:bg-slate-950 transition-colors duration-300 z-0">
        <div className="absolute inset-0 opacity-20 dark:opacity-30 bg-gradient-to-tr from-blue-500/20 via-purple-500/15 to-emerald-500/10 blur-[120px] animate-pulse duration-[8000ms]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
        
        {/* Animated Glow Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 dark:border-blue-400/20 text-blue-550 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest"
        >
          <Sparkles size={11} className="animate-pulse" />
          <span>Explainable Recruiter Intelligence</span>
        </motion.div>

        {/* Headlines */}
        <div className="space-y-4">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Ready to Calibrate Your Hiring?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-450 leading-relaxed font-medium max-w-xl mx-auto">
            Transform job descriptions into recruiter-grade candidate shortlists powered by transparent, explainable AI matching algorithms.
          </p>
        </div>

        {/* Call to Actions buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
          <Link
            to="/jd-analysis"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all active:scale-95 duration-200 focus-ring"
          >
            <FileText size={16} />
            <span>Start Calibrating Now</span>
            <ArrowRight size={14} className="ml-1" />
          </Link>
          <Link
            to="/design-system"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-200/40 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-850 dark:text-slate-250 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 duration-200 focus-ring"
          >
            <Compass size={14} className="text-slate-500" />
            <span>Explore Component Library</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
