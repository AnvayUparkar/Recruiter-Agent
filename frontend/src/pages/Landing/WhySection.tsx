import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { Check, X, Sparkles } from "lucide-react";

interface ItemProps {
  label: string;
  supported: boolean;
}

interface CardProps {
  index: number;
  eyebrow: string;
  title: string;
  items: ItemProps[];
  isHero?: boolean;
}

const FeatureItem = ({ item, i, isHero }: { item: ItemProps; i: number, isHero?: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
      className={`group/feature relative flex items-center gap-4 py-[12px] px-[14px] rounded-2xl transition-all duration-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 hover:translate-x-1 border-b border-slate-200/30 dark:border-slate-700/30 last:border-0`}
    >
      <div className="relative shrink-0">
        {item.supported ? (
          <>
            <div className="absolute inset-0 bg-emerald-400 blur-md opacity-0 group-hover/feature:opacity-60 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center w-[24px] h-[24px] rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm transition-transform duration-300 group-hover/feature:scale-110">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300, delay: 0.5 + i * 0.1 }}
              >
                <Check size={14} strokeWidth={3} className="text-emerald-500 drop-shadow-sm" />
              </motion.div>
            </div>
          </>
        ) : (
          <div className="relative flex items-center justify-center w-[24px] h-[24px] rounded-full bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 opacity-40">
            <X size={14} strokeWidth={3} className="text-rose-400" />
          </div>
        )}
      </div>
      <span className={`text-[16px] leading-tight font-semibold transition-colors duration-300 ${item.supported ? (isHero ? 'text-slate-900 dark:text-white group-hover/feature:text-blue-600 dark:group-hover/feature:text-blue-400' : 'text-slate-700 dark:text-slate-200 group-hover/feature:text-slate-900 dark:group-hover/feature:text-white') : 'text-slate-400 dark:text-slate-500'}`}>
        {item.label}
      </span>
    </motion.div>
  );
};

const ComparisonCard = ({ index, eyebrow, title, items, isHero }: CardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mouseX.set(x);
    mouseY.set(y);

    // Max rotation: 6deg
    const rX = ((y / height) - 0.5) * -12;
    const rY = ((x / width) - 0.5) * 12;

    rotateX.set(rX);
    rotateY.set(rY);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "100px" }}
      variants={{
        hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
        visible: (i: number) => ({
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
        })
      }}
      className={`relative group ${isHero ? 'z-10 lg:scale-[1.04]' : 'z-0 lg:mt-3'} h-full flex`}
      style={{ perspective: 2000 }}
    >
      {/* Ambient glow underneath hero card */}
      {isHero && (
        <div className="absolute -inset-6 bg-blue-500/20 dark:bg-blue-500/15 blur-[40px] rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      )}

      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          rotateX, 
          rotateY, 
          transformStyle: "preserve-3d" 
        }}
        className={`relative flex flex-col w-full rounded-[30px] p-[1.5px] transition-all duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:-translate-y-[12px] group-hover:scale-[1.03] cursor-default`}
      >
        {/* Animated gradient border */}
        <div className={`absolute inset-0 bg-gradient-to-r ${isHero ? 'from-[#3B82F6] via-[#A5F3FC] to-[#3B82F6] opacity-100' : 'from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 opacity-60 group-hover:from-[#3B82F6] group-hover:via-[#A5F3FC] group-hover:to-[#3B82F6] group-hover:opacity-100'} bg-[length:200%_auto] animate-border-glow rounded-[30px] transition-colors duration-500`} />
        
        {/* Inner Card Glassmorphism */}
        <div 
          className={`relative flex flex-col flex-1 rounded-[29px] bg-[rgba(255,255,255,0.78)] group-hover:bg-[rgba(255,255,255,0.9)] dark:bg-[rgba(15,23,42,0.78)] dark:group-hover:bg-[rgba(20,30,50,0.85)] backdrop-blur-[18px] p-7 sm:p-8 overflow-hidden ${isHero ? 'hero-shadow' : 'premium-shadow'} transition-all duration-500`}
        >
          {/* Cursor Light Follow Effect */}
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-[29px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10"
            style={{
              background: useMotionTemplate`
                radial-gradient(
                  600px circle at ${mouseX}px ${mouseY}px,
                  rgba(59,130,246,0.12),
                  transparent 45%
                )
              `
            }}
          />

          {/* Inner Highlight for 3D depth */}
          <div className="absolute inset-0 rounded-[29px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] pointer-events-none" />

          {/* Header */}
          <div className="relative z-20 space-y-3 pb-6 border-b border-slate-200/50 dark:border-slate-700/50 mb-6" style={{ transform: "translateZ(30px)" }}>
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">
                {eyebrow}
              </span>
              {isHero && (
                <div className="relative px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 backdrop-blur-md overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse-slow">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent -translate-x-full animate-shimmer" />
                  <span className="relative z-10 text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase">
                    Active Setup
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] flex items-center gap-3">
              {isHero && <Sparkles size={28} className="text-blue-500" />}
              {title}
            </h3>
          </div>

          {/* Feature List */}
          <div className="relative z-20 flex-1 space-y-1" style={{ transform: "translateZ(40px)" }}>
            {items.map((item, i) => (
              <FeatureItem key={i} item={item} i={i} isHero={isHero} />
            ))}
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};

export const WhySection: React.FC = () => {
  return (
    <section className="relative w-full py-24 lg:py-32 overflow-hidden border-t border-slate-200/10 dark:border-slate-800/30">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="absolute top-[10%] left-[10%] w-[40rem] h-[40rem] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-[45rem] h-[45rem] bg-cyan-300/20 dark:bg-cyan-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(248,250,252,0.9)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,1)_100%)]" />
      </div>

      <style>{`
        .premium-shadow {
          box-shadow: 0 25px 60px rgba(15,23,42,0.08), 0 8px 25px rgba(59,130,246,0.06), inset 0 1px rgba(255,255,255,0.7);
        }
        .group:hover .premium-shadow {
          box-shadow: 0 35px 75px rgba(15,23,42,0.12), 0 12px 35px rgba(59,130,246,0.1), inset 0 1px rgba(255,255,255,0.8);
        }
        .dark .premium-shadow {
          box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 8px 25px rgba(59,130,246,0.08), inset 0 1px rgba(255,255,255,0.05);
        }
        .dark .group:hover .premium-shadow {
          box-shadow: 0 35px 75px rgba(0,0,0,0.7), 0 12px 35px rgba(59,130,246,0.12), inset 0 1px rgba(255,255,255,0.08);
        }
        
        .hero-shadow {
          box-shadow: 0 30px 70px rgba(59,130,246,0.15), 0 10px 30px rgba(59,130,246,0.1), inset 0 1px rgba(255,255,255,0.9);
        }
        .group:hover .hero-shadow {
          box-shadow: 0 40px 80px rgba(59,130,246,0.2), 0 15px 40px rgba(59,130,246,0.15), inset 0 1px rgba(255,255,255,1);
        }
        .dark .hero-shadow {
          box-shadow: 0 30px 70px rgba(0,0,0,0.6), 0 10px 30px rgba(59,130,246,0.15), inset 0 1px rgba(255,255,255,0.1);
        }
        .dark .group:hover .hero-shadow {
          box-shadow: 0 40px 80px rgba(0,0,0,0.8), 0 15px 40px rgba(59,130,246,0.2), inset 0 1px rgba(255,255,255,0.15);
        }
        
        @keyframes border-glow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-border-glow {
          animation: border-glow 8s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Header Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="inline-block text-[11px] font-bold text-blue-550 dark:text-blue-400 uppercase tracking-[2px] bg-blue-100/50 dark:bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-200/50 dark:border-blue-500/20 shadow-sm">
              Strategic Calibrator
            </span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]"
          >
            Why <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">Recruiter-Grade AI<div className="absolute bottom-1 left-0 w-full h-[6px] bg-gradient-to-r from-blue-500/30 to-cyan-400/30 rounded-full blur-[2px]" /></span> Matters
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-2xl mx-auto"
          >
            How our calibrated platform performs against outdated keyword scanners and generic semantic matcher APIs.
          </motion.p>
        </div>

        {/* 3 Column comparison layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6 max-w-6xl mx-auto items-stretch px-2 sm:px-0">
          <ComparisonCard 
            index={0}
            eyebrow="Outdated Scanners"
            title="Traditional ATS"
            items={[
              { label: "Keyword Matching only", supported: true },
              { label: "No profile tenure reasoning", supported: false },
              { label: "No trust scoring audits", supported: false },
              { label: "Weak fit explainability", supported: false }
            ]}
          />
          <ComparisonCard 
            index={1}
            eyebrow="Standard API Matches"
            title="Basic AI Matching"
            items={[
              { label: "Semantic similarity models", supported: true },
              { label: "No recruiter intelligence", supported: false },
              { label: "Limited profile transparency", supported: false },
              { label: "No phone screen insights", supported: false }
            ]}
          />
          <ComparisonCard 
            index={2}
            isHero={true}
            eyebrow="Next-Gen Calibrations"
            title="Our Copilot Platform"
            items={[
              { label: "Hybrid FAISS + BM25 Retrieval", supported: true },
              { label: "Calibrated Reliability Auditing", supported: true },
              { label: "Explainable Calibrated Ranking", supported: true },
              { label: "AI Recruiter Executive Summaries", supported: true },
              { label: "Structured Phone Screen Questions", supported: true }
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default WhySection;
