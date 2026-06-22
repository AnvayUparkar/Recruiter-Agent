import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Sparkles, Database, TrendingUp, Bot, ArrowRight, ArrowDown } from "lucide-react";

interface WorkflowStep {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

export const WorkflowSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const steps: WorkflowStep[] = [
    {
      number: "01",
      title: "Paste Job Description",
      description: "Paste role requirements or raw descriptions in our parser wizard.",
      icon: FileText,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/25",
    },
    {
      number: "02",
      title: "AI Understands Role",
      description: "AI extracts target skills, seniority weights, and credentials.",
      icon: Sparkles,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/25",
    },
    {
      number: "03",
      title: "Retrieve Candidates",
      description: "Triggers FAISS semantic lookup and BM25 keywords recall.",
      icon: Database,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/25",
    },
    {
      number: "04",
      title: "Calibrated Ranking",
      description: "Ranks candidate profiles tailormade to selected strategy metrics.",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      number: "05",
      title: "Generate Insights",
      description: "Access recruiter dossiers, verification alerts, and interview guidelines.",
      icon: Bot,
      color: "text-teal-500 bg-teal-500/10 border-teal-500/25",
    },
  ];

  return (
    <section className="w-full py-16 lg:py-24 border-t border-slate-200/10 dark:border-slate-800/30 bg-slate-200/10 dark:bg-slate-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] font-black text-blue-550 uppercase tracking-widest">
            Pipeline Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            How Candidate Calibration Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            A frictionless five-step recruiter pipeline converting uncalibrated candidate profiles into verified talent recommendations.
          </p>
        </div>

        {/* Workflow Pipeline Layout */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-4 relative w-full max-w-6xl mx-auto">
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={idx}>
                {/* Step node card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: idx * 0.1 }}
                  whileHover={shouldReduceMotion ? {} : { y: -4 }}
                  className="w-full max-w-xs lg:max-w-[190px] flex flex-col items-center text-center gap-4.5 group relative"
                >
                  {/* Step Icon circle */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 relative shadow-md group-hover:scale-105 group-hover:shadow-lg ${step.color}`}>
                    <Icon size={22} className="transition-transform duration-300 group-hover:rotate-12" />
                    
                    {/* Floating Step Number */}
                    <span className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[8px] font-bold shadow">
                      {step.number}
                    </span>
                  </div>

                  {/* Title and copy */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide group-hover:text-blue-500 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </div>
                </motion.div>

                {/* Connector Arrow */}
                {!isLast && (
                  <div className="hidden lg:flex items-center justify-center self-start mt-5 text-slate-300 dark:text-slate-800 animate-pulse shrink-0">
                    <ArrowRight size={16} />
                  </div>
                )}
                {!isLast && (
                  <div className="flex lg:hidden items-center justify-center py-2 text-slate-350 dark:text-slate-850 shrink-0">
                    <ArrowDown size={16} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
