import React from "react";
import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { Skill } from "../../../types/candidate";

interface SkillCoverageProps {
  skills?: Skill[];
  /**
   * Skills extracted from the JD to classify as must-have / preferred.
   * These come from parsedJD.required_skills and parsedJD.preferred_skills.
   */
  jdRequired?: string[];
  jdPreferred?: string[];
}

type SkillCategory = "must-have" | "preferred" | "additional";

interface ClassifiedSkill {
  skill: Skill;
  category: SkillCategory;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const CATEGORY_META: Record<
  SkillCategory,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  "must-have": {
    label: "Required Match",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  preferred: {
    label: "Preferred Match",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    dot: "bg-blue-500",
  },
  additional: {
    label: "Additional Skills",
    color: "text-slate-400",
    bg: "bg-slate-800/60",
    border: "border-slate-700/50",
    dot: "bg-slate-500",
  },
};

const PROFICIENCY_ORDER = ["expert", "advanced", "intermediate", "beginner"];
const proficiencyLabel = (p: string) =>
  p.charAt(0).toUpperCase() + p.slice(1);

const SkillChip: React.FC<{ skill: Skill; category: SkillCategory; delay: number }> = ({
  skill,
  category,
  delay,
}) => {
  const meta = CATEGORY_META[category];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${meta.bg} ${meta.border} ${meta.color} cursor-default select-none`}
      title={`${skill.proficiency} · ${skill.endorsements} endorsements`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
      {skill.name}
      {skill.endorsements > 0 && (
        <span className="ml-0.5 text-[10px] opacity-60 font-normal">
          ×{skill.endorsements}
        </span>
      )}
    </motion.div>
  );
};

const SkillCoverage: React.FC<SkillCoverageProps> = ({
  skills = [],
  jdRequired = [],
  jdPreferred = [],
}) => {
  if (!skills.length) return null;

  // Classify skills
  const classified: ClassifiedSkill[] = skills
    .slice()
    .sort(
      (a, b) =>
        PROFICIENCY_ORDER.indexOf(b.proficiency) -
        PROFICIENCY_ORDER.indexOf(a.proficiency)
    )
    .map((skill) => {
      const norm = normalize(skill.name);
      if (jdRequired.some((r) => normalize(r) === norm))
        return { skill, category: "must-have" as SkillCategory };
      if (jdPreferred.some((p) => normalize(p) === norm))
        return { skill, category: "preferred" as SkillCategory };
      return { skill, category: "additional" as SkillCategory };
    });

  const mustHave = classified.filter((c) => c.category === "must-have");
  const preferred = classified.filter((c) => c.category === "preferred");
  const additional = classified.filter((c) => c.category === "additional");

  const matchedRequired = mustHave.length;
  const totalRequired = jdRequired.length || 1;
  const coveragePct = Math.round((matchedRequired / totalRequired) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Tag size={14} className="text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-slate-100 tracking-tight">
            Skill Coverage
          </span>
        </div>
        {jdRequired.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Required coverage</span>
            <span
              className={`font-black ${
                coveragePct >= 70
                  ? "text-emerald-400"
                  : coveragePct >= 40
                  ? "text-blue-400"
                  : "text-amber-400"
              }`}
            >
              {coveragePct}%
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {(Object.entries(CATEGORY_META) as [SkillCategory, (typeof CATEGORY_META)[SkillCategory]][]).map(
            ([cat, meta]) => (
              <span key={cat} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            )
          )}
        </div>

        {/* Must-have */}
        {mustHave.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
              ✓ Required Matches ({mustHave.length}/{jdRequired.length || mustHave.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {mustHave.map(({ skill }, i) => (
                <SkillChip key={skill.name} skill={skill} category="must-have" delay={i * 0.03} />
              ))}
            </div>
          </div>
        )}

        {/* Preferred */}
        {preferred.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
              ◎ Preferred Matches ({preferred.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {preferred.map(({ skill }, i) => (
                <SkillChip key={skill.name} skill={skill} category="preferred" delay={i * 0.03} />
              ))}
            </div>
          </div>
        )}

        {/* Additional */}
        {additional.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Additional ({additional.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {additional.map(({ skill }, i) => (
                <SkillChip key={skill.name} skill={skill} category="additional" delay={i * 0.02} />
              ))}
            </div>
          </div>
        )}

        {/* Proficiency legend */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap gap-3">
          {PROFICIENCY_ORDER.map((p) => (
            <span key={p} className="text-[10px] text-slate-600 font-semibold">
              {proficiencyLabel(p)}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SkillCoverage;
