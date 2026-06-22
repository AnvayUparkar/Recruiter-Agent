import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Compass, Home } from "lucide-react";

export const NotFound: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Floating/swerving animation configurations for background neon items
  const floatVariants = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 2, 0],
      transition: {
        duration: 5,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f6f8fa] dark:bg-[#0d1117] relative overflow-hidden">
      {/* Decorative Neon Blurs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

      {/* Main Content Card */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="glass-panel p-8 sm:p-12 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-md text-center border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/80 dark:bg-slate-900/60 relative z-10"
      >
        {/* Animated Compass Icon */}
        <motion.div
          variants={shouldReduceMotion ? undefined : floatVariants}
          animate="animate"
          className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600/10 to-purple-600/10 border border-blue-500/20 dark:border-blue-400/20 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/5"
        >
          <Compass size={44} className="text-blue-500 animate-pulse" />
        </motion.div>

        {/* Text Details */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-blue-550 uppercase tracking-widest">
            Error 404
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
            The calibration route you are trying to access does not exist or has been shifted in active system memory.
          </p>
        </div>

        {/* Home navigation CTA button */}
        <Link
          to="/dashboard"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all select-none focus-ring outline-none mt-2"
        >
          <Home size={14} />
          <span>Return to Leaderboard</span>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
