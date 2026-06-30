import React, { useMemo } from "react";
import { Candidate, Skill } from "../../../types/candidate";
import { ParsedJD, RequirementDetail } from "../../../types/common";
import { Check, X, ShieldAlert, Award, Users } from "lucide-react";

interface ComparisonSkillsProps {
  candidate: Candidate;
  allCandidates: Candidate[];
  parsedJD: ParsedJD | null;
}

export const ComparisonSkills: React.FC<ComparisonSkillsProps> = ({
  candidate,
  allCandidates,
  parsedJD,
}) => {
  const candidateSkills = candidate.skills || [];

  // Extract JD required skills
  const mustHaveReqs = useMemo<RequirementDetail[]>(() => {
    return parsedJD?.mustHave || parsedJD?.must_have || [];
  }, [parsedJD]);

  const niceToHaveReqs = useMemo<RequirementDetail[]>(() => {
    return parsedJD?.niceToHave || parsedJD?.good_to_have || [];
  }, [parsedJD]);

  // Match logic
  const { matchedSkills, missingSkills, preferredSkills } = useMemo(() => {
    const matched: Skill[] = [];
    const preferred: Skill[] = [];
    const missing: string[] = [];

    // Check must-haves
    mustHaveReqs.forEach((req) => {
      const match = candidateSkills.find(
        (s) =>
          s.name.toLowerCase().includes(req.name.toLowerCase()) ||
          req.name.toLowerCase().includes(s.name.toLowerCase())
      );
      if (match) {
        matched.push(match);
      } else {
        missing.push(req.name);
      }
    });

    // Check nice-to-haves
    niceToHaveReqs.forEach((req) => {
      const match = candidateSkills.find(
        (s) =>
          s.name.toLowerCase().includes(req.name.toLowerCase()) ||
          req.name.toLowerCase().includes(s.name.toLowerCase())
      );
      if (match) {
        preferred.push(match);
      }
    });

    return {
      matchedSkills: matched,
      missingSkills: missing,
      preferredSkills: preferred,
    };
  }, [candidateSkills, mustHaveReqs, niceToHaveReqs]);

  // Cohort level analysis: Shared & Unique skills
  const { sharedSkills, uniqueSkills } = useMemo(() => {
    const shared: Skill[] = [];
    const unique: Skill[] = [];

    candidateSkills.forEach((skill) => {
      const isShared =
        allCandidates.length > 1 &&
        allCandidates.every(
          (c) =>
            c.candidateId === candidate.candidateId ||
            (c.skills || []).some(
              (s) => s.name.toLowerCase() === skill.name.toLowerCase()
            )
        );

      const isUnique =
        allCandidates.length > 1 &&
        allCandidates.every(
          (c) =>
            c.candidateId === candidate.candidateId ||
            !(c.skills || []).some(
              (s) => s.name.toLowerCase() === skill.name.toLowerCase()
            )
        );

      if (isShared) shared.push(skill);
      if (isUnique) unique.push(skill);
    });

    return { sharedSkills: shared, uniqueSkills: unique };
  }, [candidateSkills, allCandidates, candidate.candidateId]);

  const totalRequired = mustHaveReqs.length;
  const matchedCount = matchedSkills.length;
  const matchRatio = totalRequired > 0 ? `${matchedCount}/${totalRequired}` : `${candidateSkills.length} total`;

  return (
    <div className="p-5 rounded-2xl glass-panel border-border shadow-md flex flex-col gap-4 bg-surface h-full">
      <div className="border-b border-border pb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs text-muted font-bold uppercase tracking-wider">
            Skill Coverage
          </h3>
          <p className="text-sm font-semibold text-primary mt-0.5 candidate-name">
            {candidate.name}
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {matchRatio} Matched
        </span>
      </div>

      <p className="text-xs text-text-muted italic">
        Matches {matchedCount} of {totalRequired || "several"} required job description parameters.
      </p>

      {/* Grid of skill categories */}
      <div className="flex flex-col gap-4">
        {/* Matched required skills */}
        {matchedSkills.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <Check size={11} className="text-emerald-400" /> Matched Skills
            </span>
            <div className="flex flex-wrap gap-1.5 skills">
              {matchedSkills.map((s) => (
                <span
                  key={s.name}
                  className="text-[10px] font-medium bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2.5 py-1 rounded-lg transition-all duration-150 shadow-sm hover:shadow-glow"
                >
                  {s.name}
                  <span className="opacity-60 ml-1 font-mono">({s.proficiency[0].toUpperCase()})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nice-to-haves / Preferred matched */}
        {preferredSkills.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <Award size={11} className="text-blue-400" /> Preferred Matched
            </span>
            <div className="flex flex-wrap gap-1.5 skills">
              {preferredSkills.map((s) => (
                <span
                  key={s.name}
                  className="text-[10px] font-medium bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/25 text-blue-450 px-2.5 py-1 rounded-lg transition-all duration-150 shadow-sm"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing skills */}
        {missingSkills.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <X size={11} className="text-rose-400" /> Missing Requirements
            </span>
            <div className="flex flex-wrap gap-1.5 skills">
              {missingSkills.map((name) => (
                <span
                  key={name}
                  className="text-[10px] font-medium bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-450 px-2.5 py-1 rounded-lg transition-all duration-150"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Shared skills */}
        {sharedSkills.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-2.5">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <Users size={11} className="text-blue-400" /> Shared Skills (Cohort Overlap)
            </span>
            <div className="flex flex-wrap gap-1.5 skills">
              {sharedSkills.map((s) => (
                <span
                  key={s.name}
                  className="text-[10px] font-medium bg-blue-500/5 border border-blue-500/15 text-text-muted px-2.5 py-1 rounded-lg"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Unique capabilities */}
        {uniqueSkills.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-2.5">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={11} className="text-amber-400" /> Unique Skills (Cohort Edge)
            </span>
            <div className="flex flex-wrap gap-1.5 skills">
              {uniqueSkills.map((s) => (
                <span
                  key={s.name}
                  className="text-[10px] font-medium bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 text-amber-400 px-2.5 py-1 rounded-lg transition-all duration-150"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ComparisonSkills;
