import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Cpu, ShieldAlert, Bot, ArrowUpRight } from "lucide-react";

interface FeatureCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  glowColor: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  glowColor,
  delay,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Card hover anims
  const hoverAnim = shouldReduceMotion
    ? {}
    : {
        y: -6,
        scale: 1.03,
        transition: { type: "spring", stiffness: 350, damping: 20 },
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 220, damping: 22, delay }}
      whileHover={hoverAnim}
      className="glass-panel p-6.5 rounded-2xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/60 backdrop-blur-md relative overflow-hidden group shadow-lg"
    >
      {/* Background Hover Accent Glow */}
      <div
        className={`absolute -right-16 -top-16 w-32 h-32 rounded-full ${glowColor} blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity duration-500`}
      />

      {/* Floating Animated Icon Wrapper */}
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-500 dark:text-blue-400 mb-5 relative shrink-0">
        <motion.div
          whileHover={shouldReduceMotion ? {} : { rotate: 15 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <Icon size={22} />
        </motion.div>
      </div>

      {/* Card Info */}
      <div className="flex flex-col gap-2 pb-2">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 group-hover:text-blue-500 transition-colors">
          <span>{title}</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Slide Arrow Reveal */}
      <div className="absolute right-4.5 bottom-4.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        <ArrowUpRight size={14} className="text-blue-500 dark:text-blue-400" />
      </div>
    </motion.div>
  );
};

export const FeatureSection: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: "Understand the Role",
      description:
        "Transforms complex job description texts into detailed, structured semantic requirement profiles—mapping target skills, weights, and role contexts automatically.",
      glowColor: "bg-purple-500/20",
    },
    {
      icon: Cpu,
      title: "Retrieve the Best Matches",
      description:
        "Unifies deep semantic embeddings search (FAISS) with lexical keyword matching (BM25) to avoid candidate retrieval gaps and maintain perfect recall.",
      glowColor: "bg-blue-500/20",
    },
    {
      icon: ShieldAlert,
      title: "Rank with Confidence",
      description:
        "Analyzes profile tenure, job hops, verification gaps, and anomalies to score candidate reliability.tailored to custom prioritization strategies.",
      glowColor: "bg-amber-500/20",
    },
    {
      icon: Bot,
      title: "Recruit with AI",
      description:
        "Access instant recruiter summaries, structured manager submission proposals, and pre-calibrated interview lists featuring targeted qualification questions.",
      glowColor: "bg-teal-500/20",
    },
  ];

  return (
    <section className="w-full py-16 lg:py-24 border-t border-slate-200/10 dark:border-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] font-black text-blue-550 uppercase tracking-widest">
            Core Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Tailor-made Recruiter Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Supercharge candidate sourcing, vetting, and submissions with explainable matching models built directly for talent acquisition teams.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <FeatureCard
              key={idx}
              icon={feat.icon}
              title={feat.title}
              description={feat.description}
              glowColor={feat.glowColor}
              delay={idx * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
