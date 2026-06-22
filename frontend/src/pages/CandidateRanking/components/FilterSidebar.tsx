import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Filter, Sliders, ChevronDown, ChevronUp, RefreshCw, Briefcase, MapPin, ShieldCheck, Award } from "lucide-react";
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

  const handleExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, minExperience: Number(e.target.value) });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, location: e.target.value });
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, minScore: Number(e.target.value) });
  };

  const handleReliabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, minReliability: Number(e.target.value) });
  };

  const handleSkillToggle = (skillName: string) => {
    const activeSkills = filters.skills.includes(skillName)
      ? filters.skills.filter((s) => s !== skillName)
      : [...filters.skills, skillName];
    onChange({ ...filters, skills: activeSkills });
  };

  const handleAvailabilityToggle = (avail: string) => {
    const activeAvails = filters.availability.includes(avail)
      ? filters.availability.filter((a) => a !== avail)
      : [...filters.availability, avail];
    onChange({ ...filters, availability: activeAvails });
  };

  const accordionVariants = {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
  };

  const allJDSkills = [
    ...(parsedJD?.mustHave || parsedJD?.must_have || []).map((s) => s.name),
    ...(parsedJD?.niceToHave || parsedJD?.good_to_have || []).map((s) => s.name),
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl space-y-5 select-none w-full xl:w-72 shrink-0">
      
      {/* Header controls */}
      <div className="flex justify-between items-center pb-3.5 border-b border-slate-250/20 dark:border-slate-850">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-blue-500" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Filter Parameters
          </span>
        </div>
        <button
          onClick={onReset}
          className="text-[10px] text-slate-500 hover:text-blue-500 font-extrabold flex items-center gap-1 transition-colors outline-none focus-ring"
          title="Reset all filter options"
        >
          <RefreshCw size={11} />
          <span>Reset</span>
        </button>
      </div>

      {/* Accordions */}
      <div className="space-y-4">
        
        {/* 1. Experience Years */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("experience")}
            className="w-full flex justify-between items-center text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider hover:text-slate-700 dark:hover:text-slate-205 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Briefcase size={12} />
              <span>Experience (Tenure)</span>
            </span>
            {openSections.experience ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <AnimatePresence initial={false}>
            {openSections.experience && (
              <motion.div
                initial={shouldReduceMotion ? {} : "initial"}
                animate="animate"
                exit="exit"
                variants={accordionVariants}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="overflow-hidden space-y-3 pt-1.5"
              >
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={filters.minExperience}
                    onChange={handleExpChange}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Min: {filters.minExperience} years</span>
                    <span>15y+</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Target Location */}
        <div className="space-y-2 border-t border-slate-250/20 dark:border-slate-850 pt-3.5">
          <button
            onClick={() => toggleSection("location")}
            className="w-full flex justify-between items-center text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider hover:text-slate-700 dark:hover:text-slate-205 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <MapPin size={12} />
              <span>Work Location</span>
            </span>
            {openSections.location ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <AnimatePresence initial={false}>
            {openSections.location && (
              <motion.div
                initial={shouldReduceMotion ? {} : "initial"}
                animate="animate"
                exit="exit"
                variants={accordionVariants}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="overflow-hidden pt-1.5"
              >
                <input
                  type="text"
                  value={filters.location}
                  onChange={handleLocationChange}
                  placeholder="e.g. San Francisco, Remote"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-200/50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 text-slate-800 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:border-blue-500/50 transition-all font-semibold"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Availability Checkboxes */}
        <div className="space-y-2 border-t border-slate-250/20 dark:border-slate-850 pt-3.5">
          <button
            onClick={() => toggleSection("availability")}
            className="w-full flex justify-between items-center text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider hover:text-slate-700 dark:hover:text-slate-205 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sliders size={12} />
              <span>Availability / Notice</span>
            </span>
            {openSections.availability ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <AnimatePresence initial={false}>
            {openSections.availability && (
              <motion.div
                initial={shouldReduceMotion ? {} : "initial"}
                animate="animate"
                exit="exit"
                variants={accordionVariants}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="overflow-hidden space-y-2 pt-1.5"
              >
                {["Immediate", "30 Days", "60 Days"].map((avail) => {
                  const isChecked = filters.availability.includes(avail);
                  return (
                    <label key={avail} className="flex items-center gap-2 text-xs text-slate-655 dark:text-slate-400 font-bold cursor-pointer hover:text-slate-905 dark:hover:text-slate-200">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleAvailabilityToggle(avail)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 bg-slate-950 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                      <span>{avail}</span>
                    </label>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Score Minimum Thresholds */}
        <div className="space-y-2 border-t border-slate-250/20 dark:border-slate-850 pt-3.5">
          <button
            onClick={() => toggleSection("scores")}
            className="w-full flex justify-between items-center text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider hover:text-slate-700 dark:hover:text-slate-205 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} />
              <span>Min Score Benchmarks</span>
            </span>
            {openSections.scores ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <AnimatePresence initial={false}>
            {openSections.scores && (
              <motion.div
                initial={shouldReduceMotion ? {} : "initial"}
                animate="animate"
                exit="exit"
                variants={accordionVariants}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="overflow-hidden space-y-4 pt-1.5"
              >
                {/* Overall Score slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                    <span>Overall Fit</span>
                    <span className="font-mono">{filters.minScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minScore}
                    onChange={handleScoreChange}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Reliability Score slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                    <span>Reliability Index</span>
                    <span className="font-mono">{filters.minReliability}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minReliability}
                    onChange={handleReliabilityChange}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. Must-Have / Nice-to-Have Skills */}
        {allJDSkills.length > 0 && (
          <div className="space-y-2 border-t border-slate-250/20 dark:border-slate-850 pt-3.5">
            <button
              onClick={() => toggleSection("skills")}
              className="w-full flex justify-between items-center text-[10px] font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider hover:text-slate-700 dark:hover:text-slate-205 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Award size={12} />
                <span>Skills Alignment</span>
              </span>
              {openSections.skills ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <AnimatePresence initial={false}>
              {openSections.skills && (
                <motion.div
                  initial={shouldReduceMotion ? {} : "initial"}
                  animate="animate"
                  exit="exit"
                  variants={accordionVariants}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="overflow-hidden pt-1.5"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {allJDSkills.map((skill) => {
                      const isSelected = filters.skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => handleSkillToggle(skill)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors outline-none focus-ring capitalize
                            ${
                              isSelected
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                                : "bg-slate-200/50 dark:bg-slate-950/40 border-slate-250 dark:border-slate-850 text-slate-500 hover:border-slate-350 dark:hover:border-slate-800"
                            }`}
                        >
                          {skill}
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
  );
};

export default FilterSidebar;
