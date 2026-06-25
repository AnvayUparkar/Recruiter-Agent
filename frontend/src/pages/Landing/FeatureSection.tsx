import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Cpu, ShieldAlert, Bot, ArrowRight } from "lucide-react";

interface FeatureCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  metric: string;
  delay: number;
}

const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Micro-elements around the card */}
    <motion.div 
      className="absolute top-8 right-8 w-1 h-1 rounded-full bg-blue-400"
      animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div 
      className="absolute bottom-12 left-6 w-1.5 h-1.5 rounded-full bg-purple-400"
      animate={{ y: [0, 8, 0], opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
    />
    <motion.div 
      className="absolute top-1/2 right-4 w-1 h-1 rounded-full bg-cyan-400"
      animate={{ x: [0, 5, 0], opacity: [0.2, 0.6, 0.2] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />
  </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  metric,
  delay,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const hoverAnim = shouldReduceMotion
    ? {}
    : {
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 200, damping: 25, delay }}
      whileHover={hoverAnim}
      className="group relative h-full flex flex-col"
    >
      {/* Animated gradient border wrapper */}
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-50 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-cyan-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ padding: '1px' }} />
      
      {/* Card Content Container */}
      <div className="relative flex flex-col h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-8 overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500 border border-white/40 dark:border-slate-800/50 m-[1px]">
        
        {/* Shifting background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-cyan-500/5 transition-colors duration-500" />
        
        <FloatingElements />

        {/* Top: Large icon with glowing halo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-50 transition-opacity duration-500" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl border border-white/60 dark:border-slate-700 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
            <motion.div
              whileHover={shouldReduceMotion ? {} : { rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Icon size={28} className="text-blue-600 dark:text-blue-400 drop-shadow-sm" />
            </motion.div>
          </div>
        </div>

        {/* Middle: Feature Info */}
        <div className="flex-grow flex flex-col gap-4 relative z-10">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            {title}
          </h3>
          <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* Bottom: Visual metric/stat */}
        <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50 relative z-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
            <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform duration-300" />
            <span>{metric}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const FeatureSection: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: "Understand the Role",
      description: "Transforms complex job description texts into detailed, structured semantic requirement profiles automatically.",
      metric: "98% JD Parsing Accuracy",
    },
    {
      icon: Cpu,
      title: "Retrieve the Best Matches",
      description: "Unifies deep semantic embeddings search (FAISS) with lexical keyword matching (BM25) to maintain perfect recall.",
      metric: "Top 5 Candidates in <2 sec",
    },
    {
      icon: ShieldAlert,
      title: "Rank with Confidence",
      description: "Analyzes profile tenure, job hops, verification gaps, and anomalies to score candidate reliability.",
      metric: "Reliability Score Engine",
    },
    {
      icon: Bot,
      title: "Recruit with AI",
      description: "Access instant recruiter summaries, structured manager submission proposals, and pre-calibrated interview lists.",
      metric: "AI-Generated Interview Insights",
    },
  ];

  return (
    <section className="relative w-full py-24 lg:py-32 overflow-hidden bg-slate-50 dark:bg-[#0B0F19]">
      {/* Background Enhancements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft gradient mesh */}
        <div className="absolute top-0 left-1/4 w-[1000px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[500px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">
              Core Intelligence
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Tailor-made <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Recruiter Intelligence
            </span>
          </h2>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Supercharge candidate sourcing, vetting, and submissions with explainable matching models built directly for elite talent acquisition teams.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, idx) => (
            <FeatureCard
              key={idx}
              icon={feat.icon}
              title={feat.title}
              description={feat.description}
              metric={feat.metric}
              delay={idx * 0.15}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
