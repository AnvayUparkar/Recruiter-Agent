import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  BrainCircuit, 
  Database, 
  Radar, 
  Bot,
  CheckCircle2,
  Activity
} from "lucide-react";

interface WorkflowStep {
  number: string;
  title: string;
  metric: string;
  icon: React.ComponentType<any>;
  color: string;
  glowColor: string;
  details: {
    status: string;
    confidence: string;
    explanation: string;
    examples: string[];
  };
}

export const WorkflowSection: React.FC = () => {
  const [activeHover, setActiveHover] = useState<number | null>(null);

  const steps: WorkflowStep[] = [
    {
      number: "01",
      title: "Job Description Analysis",
      metric: "150+ Skills Identified",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-500",
      glowColor: "from-blue-500/30 to-cyan-500/30 dark:from-blue-500/20 dark:to-cyan-500/20",
      details: {
        status: "Processing Complete",
        confidence: "99.9%",
        explanation: "Extracts keywords, responsibilities, and core requirements automatically.",
        examples: ["✓ Skills Extracted", "✓ Experience Mapped", "✓ Seniority Detected"],
      }
    },
    {
      number: "02",
      title: "AI Role Understanding",
      metric: "Context-Aware Matching",
      icon: BrainCircuit,
      color: "text-indigo-600 dark:text-indigo-500",
      glowColor: "from-indigo-500/30 to-purple-500/30 dark:from-indigo-500/20 dark:to-purple-500/20",
      details: {
        status: "Semantic Engine Active",
        confidence: "98.5%",
        explanation: "Forms skill clusters and builds a deep semantic understanding of the target persona.",
        examples: ["✓ Implicit Skills Inferred", "✓ Domain Context Built", "✓ Weightings Assigned"],
      }
    },
    {
      number: "03",
      title: "Hybrid Candidate Retrieval",
      metric: "10,000+ Profiles Scanned",
      icon: Database,
      color: "text-purple-600 dark:text-purple-500",
      glowColor: "from-purple-500/30 to-pink-500/30 dark:from-purple-500/20 dark:to-pink-500/20",
      details: {
        status: "Dual Stream Search",
        confidence: "99.0%",
        explanation: "Combines FAISS semantic lookup with BM25 exact keyword recall for zero drop-off.",
        examples: ["✓ Semantic Matches", "✓ Exact Keyword Hits", "✓ Edge Cases Captured"],
      }
    },
    {
      number: "04",
      title: "Candidate Calibration",
      metric: "95% Ranking Confidence",
      icon: Radar,
      color: "text-emerald-600 dark:text-emerald-500",
      glowColor: "from-emerald-500/30 to-teal-500/30 dark:from-emerald-500/20 dark:to-teal-500/20",
      details: {
        status: "Calibration Engine Live",
        confidence: "96.2%",
        explanation: "Evaluates reliability, tenure consistency, and skill authenticity across the pool.",
        examples: ["✓ Tenure Verified", "✓ Job Hops Penalized", "✓ Score Normalized"],
      }
    },
    {
      number: "05",
      title: "Intelligence Generation",
      metric: "Instant Recruiter Brief",
      icon: Bot,
      color: "text-cyan-600 dark:text-cyan-500",
      glowColor: "from-cyan-500/30 to-blue-500/30 dark:from-cyan-500/20 dark:to-blue-500/20",
      details: {
        status: "Copilot Ready",
        confidence: "99.5%",
        explanation: "Generates actionable dossiers, interview questions, and manager submission summaries.",
        examples: ["✓ Screening Questions", "✓ Manager Summary", "✓ Red Flag Alerts"],
      }
    },
  ];

  return (
    <section className="relative w-full py-24 lg:py-32 overflow-hidden bg-slate-50 dark:bg-[#0A0F1C]">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle AI Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
          }}
        />
        {/* Blurred Gradient Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-blue-500 dark:bg-blue-600 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-purple-500 dark:bg-purple-600 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Title */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-6 max-w-3xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 backdrop-blur-md">
            <Activity size={14} className="text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">
              AI Decision Engine
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            How Candidate Calibration Works
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            A frictionless five-step recruiter pipeline converting uncalibrated candidate profiles into verified talent recommendations through our advanced semantic intelligence layer.
          </p>
        </motion.div>

        {/* Workflow Pipeline Layout */}
        <div className="relative w-full max-w-6xl mx-auto">
          
          {/* Animated Glowing Connection Line */}
          <div className="hidden lg:block absolute top-[4.5rem] left-0 w-full h-[2px] bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent"
            />
          </div>

          <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isHovered = activeHover === idx;

              return (
                <div 
                  key={idx} 
                  className="relative flex-1 group z-10"
                  onMouseEnter={() => setActiveHover(idx)}
                  onMouseLeave={() => setActiveHover(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: idx * 0.1 }}
                    className="h-full"
                  >
                    {/* Glassmorphism Card */}
                    <div className={`relative h-full flex flex-col p-6 rounded-3xl backdrop-blur-2xl border border-slate-200 dark:border-white/5 bg-white/70 dark:bg-white/[0.02] hover:bg-white/90 dark:hover:bg-white/[0.04] transition-all duration-500 cursor-default ${isHovered ? 'shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] scale-105 z-20' : ''}`}>
                      
                      {/* Active Glow Accent */}
                      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.glowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`} />
                      
                      {/* Step Number Badge */}
                      <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold shadow-md dark:shadow-xl">
                        {step.number}
                      </div>

                      {/* Icon Container */}
                      <div className="relative mb-6 self-start">
                        <div className={`absolute inset-0 bg-gradient-to-br ${step.glowColor} rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                        <div className="relative w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm dark:shadow-inner">
                          <Icon size={24} className={`${step.color} drop-shadow-sm dark:drop-shadow-lg`} />
                        </div>
                      </div>

                      {/* Title & Metric */}
                      <div className="space-y-2 mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                          {step.title}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                          <span className={`w-1.5 h-1.5 rounded-full bg-current ${step.color} animate-pulse`} />
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                            {step.metric}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Hover Details */}
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isHovered ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {step.details.explanation}
                          </p>
                          
                          <div className="space-y-2">
                            {step.details.examples.map((ex, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                <CheckCircle2 size={12} className={step.color} />
                                <span>{ex}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wider">{step.details.status}</span>
                            <span className={`text-xs font-bold ${step.color}`}>{step.details.confidence}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
