import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Play, Sparkles, Database, ShieldCheck, UserCheck } from "lucide-react";
import { FloatingIllustration } from "./FloatingIllustration";

export const LandingHero: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const headline = "Find the Right Candidate — Not Just the Right Keywords";
  const words = headline.split(" ");

  // Stagger container for headline words
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  // Individual word variants
  const wordVariants = {
    initial: { opacity: 0, y: 15, filter: "blur(2px)" },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 18,
      },
    },
  };

  // Subheadline & CTA container reveal
  const blockVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 140,
        damping: 22,
        delay: 0.6,
      },
    },
  };

  // Trust badges configurations
  const trustBadges = [
    { label: "Explainable AI", icon: Sparkles, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
    { label: "Hybrid Search", icon: Database, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { label: "Recruiter Copilot", icon: UserCheck, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Reliability Scoring", icon: ShieldCheck, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <section className="relative w-full min-h-[calc(100vh-140px)] flex items-center py-10 lg:py-16 overflow-visible">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Left Side Content Column */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-6.5">
          
          {/* Active Version Pills */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2"
          >
            <span>Platform v1.2</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </motion.div>

          {/* Staggered Headline */}
          <motion.h1
            variants={shouldReduceMotion ? undefined : containerVariants}
            initial="initial"
            animate="animate"
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-2xl bg-gradient-to-r from-slate-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
          >
            {shouldReduceMotion
              ? headline
              : words.map((word, idx) => (
                  <motion.span
                    key={idx}
                    variants={wordVariants}
                    className="inline-block mr-1.5 sm:mr-2.5 pb-1"
                  >
                    {word}
                  </motion.span>
                ))}
          </motion.h1>

          {/* Subheadline & Action Blocks */}
          <motion.div
            variants={blockVariants}
            initial="initial"
            animate="animate"
            className="space-y-7 max-w-xl"
          >
            <p className="text-sm sm:text-base text-slate-550 dark:text-slate-400 leading-relaxed font-sans font-medium">
              AI-powered recruiter intelligence that understands experience, skills, trust, and career growth to deliver explainable hiring decisions.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/jd-analysis"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all active:scale-95 duration-200 focus-ring"
              >
                <FileText size={16} />
                <span>Analyze a Job Description</span>
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-200/40 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 duration-200 focus-ring"
              >
                <Play size={13} className="text-slate-500" />
                <span>See It in Action</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-4 border-t border-slate-200/10 dark:border-slate-800/30">
              {trustBadges.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-wide ${badge.color}`}
                  >
                    <Icon size={12} />
                    <span>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right Side Illustration Column */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <FloatingIllustration />
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
