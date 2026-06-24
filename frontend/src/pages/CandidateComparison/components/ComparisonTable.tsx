import React from "react";
import { Candidate } from "../../../types/candidate";
import { Star } from "lucide-react";

interface ComparisonTableProps {
  candidates: Candidate[];
}

interface RowItem {
  key: string;
  label: string;
  getValue: (c: Candidate) => number | string;
  isNumeric: boolean;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ candidates }) => {
  const rows: RowItem[] = [
    {
      key: "finalScore",
      label: "AI Composite Score",
      getValue: (c) =>
        c.rankingScore?.finalScore
          ? Math.round(c.rankingScore.finalScore * 100)
          : 0,
      isNumeric: true,
    },
    {
      key: "technicalScore",
      label: "Technical Strength",
      getValue: (c) =>
        c.rankingScore?.technicalScore
          ? Math.round(c.rankingScore.technicalScore * 100)
          : 0,
      isNumeric: true,
    },
    {
      key: "matchingScore",
      label: "Job Description Match",
      getValue: (c) =>
        c.rankingScore?.matchingScore
          ? Math.round(c.rankingScore.matchingScore * 100)
          : 0,
      isNumeric: true,
    },
    {
      key: "reliabilityScore",
      label: "Profile Reliability Score",
      getValue: (c) =>
        c.rankingScore?.trustScore
          ? Math.round(c.rankingScore.trustScore * 100)
          : c.reliabilityProfile?.reliabilityScore
          ? Math.round(c.reliabilityProfile.reliabilityScore * 100)
          : 0,
      isNumeric: true,
    },
    {
      key: "behavioralScore",
      label: "Behavioral Signal",
      getValue: (c) =>
        c.rankingScore?.behavioralScore
          ? Math.round(c.rankingScore.behavioralScore * 100)
          : c.behaviorProfile?.behavioralScore
          ? Math.round(c.behaviorProfile.behavioralScore * 100)
          : 0,
      isNumeric: true,
    },
    {
      key: "leadershipScore",
      label: "Leadership Signal",
      getValue: (c) =>
        c.rankingScore?.leadershipScore
          ? Math.round(c.rankingScore.leadershipScore * 100)
          : 0,
      isNumeric: true,
    },
    {
      key: "experience",
      label: "Years of Experience",
      getValue: (c) => c.experienceYears || c.profile?.yearsOfExperience || 0,
      isNumeric: true,
    },
    {
      key: "skillsCount",
      label: "Matched Skills Count",
      getValue: (c) => c.skills?.length || 0,
      isNumeric: true,
    },
    {
      key: "availability",
      label: "Availability / Notice",
      getValue: (c) => c.availability || c.redrob_signals?.noticePeriodDays + " days" || "Immediate",
      isNumeric: false,
    },
    {
      key: "workMode",
      label: "Work Mode Preference",
      getValue: (c) => c.redrob_signals?.preferredWorkMode || "Flexible",
      isNumeric: false,
    },
  ];

  return (
    <div className="w-full glass-panel rounded-2xl border-border shadow-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-heading">
          Attribute & Score Matrix
        </h2>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
          <Star size={10} fill="currentColor" /> Highlighted Lead
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="py-4 px-6 text-xs font-bold text-muted uppercase tracking-wider w-64">
                Evaluation Parameter
              </th>
              {candidates.map((c) => (
                <th
                  key={c.candidateId}
                  className="py-4 px-6 text-sm font-bold text-primary text-center font-mono border-l border-border min-w-[150px]"
                >
                  {c.name.split(" ")[0]}
                  <span className="block text-[10px] text-muted font-normal mt-0.5">
                    {c.candidateId}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              // Find max value in row to highlight if numeric
              let maxVal = -1;
              if (row.isNumeric) {
                candidates.forEach((c) => {
                  const val = row.getValue(c) as number;
                  if (val > maxVal) maxVal = val;
                });
              }

              return (
                <tr
                  key={row.key}
                  className="hover:bg-surface-hover transition-colors duration-150"
                >
                  <td className="py-4 px-6 text-sm font-semibold text-text-muted">
                    {row.label}
                  </td>
                  {candidates.map((c) => {
                    const rawVal = row.getValue(c);
                    const isNumericVal = typeof rawVal === "number";
                    const isMax = row.isNumeric && isNumericVal && rawVal === maxVal && maxVal > 0;

                    return (
                      <td
                        key={c.candidateId}
                        className={`py-4 px-6 text-center text-sm font-mono border-l border-border transition-all
                          ${
                            isMax
                              ? "bg-emerald-500/5 text-emerald-400 font-bold shadow-glow"
                              : "text-text-muted"
                          }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>
                            {isNumericVal && row.key !== "experience" && row.key !== "skillsCount"
                              ? `${rawVal}%`
                              : rawVal}
                          </span>
                          {isMax && (
                            <Star
                              size={12}
                              className="text-emerald-400 shrink-0 fill-current"
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ComparisonTable;
