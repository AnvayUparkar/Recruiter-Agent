import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Filter, 
  Sliders, 
  ChevronDown, 
  RefreshCw, 
  Briefcase, 
  MapPin, 
  ShieldCheck, 
  Cpu, 
  BrainCircuit,
  Zap
} from "lucide-react";
import { ParsedJD } from "../../../types/common";

export interface FilterState {
  minExperience: number;
  location: string;
  availability: string[];
  minScore: number;
  minReliability: number;
  skills: string[];
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  parsedJD: ParsedJD | null;
}

const PremiumSlider = ({ label, value, min, max, unit, onChange }: any) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="relative pt-2 pb-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-black text-blue-500 shadow-inner">
          {value}{unit}
        </div>
      </div>
      <div className="relative h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full group cursor-pointer" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onChange(Math.round(min + percent * (max - min)));
      }}>
        <motion.div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]"
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <motion.div 
          className="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)] group-hover:scale-125 transition-transform"
          initial={false}
          animate={{ left: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          onDrag={(e, info) => {
             // simplified slider logic, the underlying range input handles exact drag better, 
             // but we'll use a native range underneath invisibly for accessibility
          }}
        />
        <input 
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
  parsedJD,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Accordion toggle states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    experience: true,
    location: true,
    scores: true,
    skills: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSkillToggle = (skillName: string) => {
    const activeSkills = filters.skills.includes(skillName)
      ? filters.skills.filter((s) => s !== skillName)
      : [...filters.skills, skillName];
    onChange({ ...filters, skills: activeSkills });
  };

  const accordionVariants = {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
  };

  const allJDSkills = [
    ...(parsedJD?.mustHave || parsedJD?.must_have || []).map((s: any) => s.name),
    ...(parsedJD?.niceToHave || parsedJD?.good_to_have || []).map((s: any) => s.name),
  ];

  return (
    <div className="relative w-full xl:w-80 shrink-0 sticky top-24 z-20">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-blue-500/10 to-transparent blur-xl pointer-events-none" />
      
      <div className="relative bg-white/70 dark:bg-[#0A0F1C]/80 backdrop-blur-3xl p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800 shadow-2xl space-y-6 select-none overflow-hidden">
        
        {/* Glowing border accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

        {/* AI Header */}
        <div className="flex flex-col gap-2 pb-4 border-b border-slate-200/50 dark:border-slate-800">
          <div className="flex justify-between items-start">
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
              <BrainCircuit size={18} className="text-blue-500" />
              AI Intelligence
            </h2>
            <button
              onClick={onReset}
              className="text-[10px] text-slate-500 hover:text-blue-500 font-black flex items-center gap-1.5 transition-colors uppercase tracking-wider bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md"
              title="Reset Filters"
            >
              <RefreshCw size={10} />
              Reset
            </button>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Refine candidate intelligence using semantic and recruiter-driven signals.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-1">
          
          {/* Experience Section */}
          <div className="group border-b border-slate-100 dark:border-slate-800/50 pb-2">
            <button
              onClick={() => toggleSection("experience")}
              className="w-full flex justify-between items-center py-3 text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Briefcase size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                Experience
              </span>
              <motion.div animate={{ rotate: openSections.experience ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} className="text-slate-400" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {openSections.experience && (
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={accordionVariants}
                  className="overflow-hidden"
                >
                  <PremiumSlider 
                    label="Minimum Tenure"
                    value={filters.minExperience} 
                    min={0} max={15} unit="y" 
                    onChange={(val: number) => onChange({ ...filters, minExperience: val })} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Location Section */}
          <div className="group border-b border-slate-100 dark:border-slate-800/50 pb-2">
            <button
              onClick={() => toggleSection("location")}
              className="w-full flex justify-between items-center py-3 text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                Location
              </span>
              <motion.div animate={{ rotate: openSections.location ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} className="text-slate-400" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {openSections.location && (
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={accordionVariants}
                  className="overflow-hidden pb-4"
                >
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) => onChange({ ...filters, location: e.target.value })}
                      placeholder="e.g. Remote, NY"
                      className="w-full pl-9 pr-4 py-2.5 text-[11px] rounded-xl bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-bold"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Availability */}
          <div className="group border-b border-slate-100 dark:border-slate-800/50 pb-2">
            <button
              onClick={() => toggleSection("availability")}
              className="w-full flex justify-between items-center py-3 text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sliders size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                Availability
              </span>
              <motion.div animate={{ rotate: openSections.availability ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} className="text-slate-400" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {openSections.availability && (
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={accordionVariants}
                  className="overflow-hidden pb-4"
                >
                  <div className="flex flex-col gap-2.5">
                    {["Immediate", "30 Days", "60 Days"].map((avail) => {
                      const isChecked = filters.availability.includes(avail);
                      return (
                        <label key={avail} className="group/check flex items-center gap-3 cursor-pointer">
                          <div className={`relative w-5 h-5 rounded-md flex items-center justify-center transition-all ${isChecked ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover/check:border-blue-400'}`}>
                            {isChecked && <Zap size={12} className="text-white fill-white" />}
                          </div>
                          <span className={`text-xs font-bold transition-colors ${isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover/check:text-slate-700 dark:group-hover/check:text-slate-300'}`}>
                            {avail}
                          </span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const activeAvails = isChecked
                                ? filters.availability.filter((a) => a !== avail)
                                : [...filters.availability, avail];
                              onChange({ ...filters, availability: activeAvails });
                            }}
                            className="hidden"
                          />
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Min Scores */}
          <div className="group border-b border-slate-100 dark:border-slate-800/50 pb-2">
            <button
              onClick={() => toggleSection("scores")}
              className="w-full flex justify-between items-center py-3 text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                Confidence Thresholds
              </span>
              <motion.div animate={{ rotate: openSections.scores ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} className="text-slate-400" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {openSections.scores && (
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={accordionVariants}
                  className="overflow-hidden space-y-2 pb-2"
                >
                  <PremiumSlider 
                    label="Match Conf"
                    value={filters.minScore} 
                    min={0} max={100} unit="%" 
                    onChange={(val: number) => onChange({ ...filters, minScore: val })} 
                  />
                  <PremiumSlider 
                    label="Trust Index"
                    value={filters.minReliability} 
                    min={0} max={100} unit="%" 
                    onChange={(val: number) => onChange({ ...filters, minReliability: val })} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Skills */}
          {allJDSkills.length > 0 && (
            <div className="group pb-2 pt-2">
              <button
                onClick={() => toggleSection("skills")}
                className="w-full flex justify-between items-center pb-3 text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Cpu size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  Semantic Vectors
                </span>
                <motion.div animate={{ rotate: openSections.skills ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} className="text-slate-400" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openSections.skills && (
                  <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={accordionVariants}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 pb-2">
                      {allJDSkills.map((skill) => {
                        const isSelected = filters.skills.includes(skill);
                        return (
                          <button
                            key={skill}
                            onClick={() => handleSkillToggle(skill)}
                            className={`relative px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all outline-none overflow-hidden group/capsule
                              ${
                                isSelected
                                  ? "text-blue-900 dark:text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.3)] border-transparent"
                                  : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500"
                              }`}
                          >
                            {isSelected && (
                              <motion.div 
                                layoutId="capsule-bg"
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-cyan-500/80"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                              {skill}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
