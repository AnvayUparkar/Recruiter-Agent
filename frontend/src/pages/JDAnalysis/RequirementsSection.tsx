import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, Compass, Globe, UserCheck } from "lucide-react";

interface RequirementsSectionProps {
  experienceRange: [number, number];
  leadership: string;
  domain: string;
  workMode: string;
}

export const RequirementsSection: React.FC<RequirementsSectionProps> = ({
  experienceRange,
  leadership,
  domain,
  workMode,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const details = [
    {
      label: "Experience Tenure",
      value: `${experienceRange[0]} - ${experienceRange[1]} Years`,
      icon: Briefcase,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Leadership Expectation",
      value: leadership,
      icon: UserCheck,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Domain Focus",
      value: domain,
      icon: Compass,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Work Mode & Location",
      value: workMode,
      icon: Globe,
      color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    },
  ];

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 24 },
    },
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-40px" }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      {details.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            variants={cardVariants}
            whileHover={shouldReduceMotion ? {} : { y: -3, transition: { duration: 0.15 } }}
            className="glass-panel p-4 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow flex flex-col gap-2.5 cursor-pointer outline-none focus-ring"
            tabIndex={0}
          >
            {/* Icon circle */}
            <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center border shrink-0 ${item.color}`}>
              <Icon size={16} />
            </div>

            {/* Label and Value */}
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider block">
                {item.label}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                {item.value}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default RequirementsSection;
