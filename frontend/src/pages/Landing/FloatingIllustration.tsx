import React from "react";
import { motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import { Sparkles, FileText, UserCheck, TrendingUp } from "lucide-react";

export const FloatingIllustration: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Motion values to track mouse coordinate offsets
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Map coordinates to subtle rotational degree tilts (-15 to 15 degrees)
  const rotateX = useTransform(mouseY, [-200, 200], [10, -10]);
  const rotateY = useTransform(mouseX, [-200, 200], [-10, 10]);

  // Handle pointer movements within bounds
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = e.clientX - rect.left - width / 2;
    const y = e.clientY - rect.top - height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  // Reset rotation when pointer exits
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Continuous floating variants for elements (disabled if reduced motion is preferred)
  const floatVariant = (yOffset: number, duration: number) => ({
    animate: shouldReduceMotion
      ? {}
      : {
          y: [0, yOffset, 0],
          transition: {
            duration,
            ease: "easeInOut",
            repeat: Infinity,
          },
        },
  });

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-[4/3] max-w-lg mx-auto flex items-center justify-center cursor-pointer select-none perspective-[1000px] z-10"
      role="img"
      aria-label="Interactive visual diagram showing AI extracting requirements from a Job Description to match and rank candidate files."
    >
      {/* 3D Parallax Rotation Layer */}
      <motion.div
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full relative flex items-center justify-center transition-all duration-200"
      >
        {/* Neon Glow base background ring */}
        <div className="absolute w-[280px] sm:w-[320px] h-[280px] sm:h-[320px] rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/15 blur-[60px] animate-pulse duration-[4000ms] pointer-events-none" />

        {/* 1. Job Description File Card (Left-back layer) */}
        <motion.div
          variants={floatVariant(-12, 6.2)}
          animate="animate"
          style={{ transform: "translateZ(-30px)" }}
          className="absolute left-[8%] top-[10%] w-[200px] sm:w-[220px] glass-panel p-4.5 rounded-2xl border border-slate-200/10 dark:border-slate-800/40 shadow-xl bg-slate-100/60 dark:bg-slate-900/60 backdrop-blur-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/35 flex items-center justify-center text-blue-500">
              <FileText size={14} />
            </div>
            <span className="text-[10px] font-bold tracking-wide text-slate-900 dark:text-slate-100 uppercase">
              Job Description
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-11/12 rounded bg-slate-300 dark:bg-slate-800" />
            <div className="h-2 w-full rounded bg-slate-350 dark:bg-slate-800/70" />
            <div className="h-2 w-4/5 rounded bg-slate-350 dark:bg-slate-800/70" />
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-250/20 dark:border-slate-800/30 text-[9px] text-blue-500 font-bold uppercase">
              <Sparkles size={10} className="animate-pulse" />
              <span>AI CALIBRATING</span>
            </div>
          </div>
        </motion.div>

        {/* Connecting SVG Particles / Energy Flow */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0 opacity-40 dark:opacity-60">
          {/* Path from JD to Brain */}
          <motion.path
            d="M 180 180 Q 220 190 260 210"
            fill="none"
            stroke="url(#gradient-line)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-dash"
          />
          {/* Path from Brain to Candidate */}
          <motion.path
            d="M 320 220 Q 360 200 390 170"
            fill="none"
            stroke="url(#gradient-line)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-dash"
          />

          <defs>
            <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        {/* 2. AI Recruiter Brain Node (Center-middle layer) */}
        <motion.div
          variants={floatVariant(8, 5)}
          animate="animate"
          style={{ transform: "translateZ(0px)" }}
          className="absolute w-22 h-22 rounded-3xl bg-gradient-to-tr from-blue-600/15 to-purple-600/15 border border-blue-500/30 dark:border-purple-500/25 flex items-center justify-center shadow-lg shadow-purple-500/5 z-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-extrabold relative shadow-inner-glow">
            <Sparkles size={26} className="animate-pulse duration-1000" />
            {/* Spinning pulse ring */}
            <div className="absolute inset-0 w-full h-full rounded-2xl border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin duration-700 pointer-events-none" />
          </div>
        </motion.div>

        {/* 3. Top Candidate Ranking Card (Right-front layer) */}
        <motion.div
          variants={floatVariant(-14, 5.5)}
          animate="animate"
          style={{ transform: "translateZ(40px)" }}
          className="absolute right-[5%] bottom-[12%] w-[210px] sm:w-[230px] glass-panel p-4 rounded-2xl border border-blue-500/25 dark:border-blue-400/20 shadow-2xl bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md"
        >
          <div className="flex justify-between items-start mb-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono text-slate-450 dark:text-slate-500">ID: candidate_01</span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">Senior ML Engineer</span>
            </div>
            <span className="text-xs font-black text-blue-500 dark:text-blue-400">96%</span>
          </div>

          <div className="space-y-2">
            {/* Custom fit tags */}
            <div className="flex gap-1">
              <span className="px-1.5 py-0.2 bg-blue-500/10 text-[8px] font-bold text-blue-500 rounded uppercase">
                FAISS
              </span>
              <span className="px-1.5 py-0.2 bg-purple-500/10 text-[8px] font-bold text-purple-500 rounded uppercase">
                Python
              </span>
              <span className="px-1.5 py-0.2 bg-emerald-500/10 text-[8px] font-bold text-emerald-500 rounded uppercase">
                Verified
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[96%] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
            </div>
          </div>

          {/* 4. Strong Hire Badge overlay (Far-front pop layer) */}
          <motion.div
            variants={floatVariant(6, 4.2)}
            animate="animate"
            style={{ transform: "translateZ(70px)" }}
            className="absolute -right-4.5 -top-4.5 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-extrabold text-[10px] tracking-wide shadow-lg shadow-emerald-500/20 border border-emerald-400/30 flex items-center gap-1.5 uppercase shrink-0"
          >
            <UserCheck size={11} />
            <span>Strong Fit</span>
          </motion.div>
        </motion.div>

        {/* Decorative Floating Calibrated stats Badge */}
        <motion.div
          variants={floatVariant(10, 7)}
          animate="animate"
          style={{ transform: "translateZ(20px)" }}
          className="absolute left-[15%] bottom-[15%] px-3 py-2 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 glass-panel border border-slate-250/20 dark:border-slate-800/40 shadow-xl flex items-center gap-2 text-[10px] text-slate-500 font-bold"
        >
          <TrendingUp size={12} className="text-emerald-500" />
          <span>Reliability: 98%</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FloatingIllustration;
