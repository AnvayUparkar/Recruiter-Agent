import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GraduationCap, Award } from "lucide-react";

interface EducationSectionProps {
  degrees: string[];
  certifications?: string[];
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  degrees,
  certifications = [],
}) => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 280, damping: 25 },
    },
  };

  const hasDegrees = degrees && degrees.length > 0;
  const hasCerts = certifications && certifications.length > 0;

  if (!hasDegrees && !hasCerts) {
    return null;
  }

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl space-y-5 select-none">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-250/20 dark:border-slate-850">
        <GraduationCap size={16} className="text-teal-500 shrink-0" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest">
          Academic & Professional Credentials
        </span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Degrees Column */}
        {hasDegrees && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Required / Preferred Degrees</span>
            </h4>
            <div className="flex flex-col gap-2.5">
              {degrees.map((degree, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={shouldReduceMotion ? {} : { x: 2 }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-200/30 dark:bg-slate-950/40 border border-slate-250/50 dark:border-slate-850 cursor-pointer outline-none focus-ring"
                  tabIndex={0}
                >
                  <div className="w-6.5 h-6.5 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 shrink-0">
                    <GraduationCap size={13} />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-350 font-bold capitalize">
                    {degree}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications Column */}
        {hasCerts && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Key Licenses & Certifications</span>
            </h4>
            <div className="flex flex-col gap-2.5">
              {certifications.map((cert, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={shouldReduceMotion ? {} : { x: 2 }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-200/30 dark:bg-slate-950/40 border border-slate-250/50 dark:border-slate-850 cursor-pointer outline-none focus-ring"
                  tabIndex={0}
                >
                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <Award size={13} />
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-350 font-bold capitalize">
                    {cert}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EducationSection;
