import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Candidate } from "../../../types/candidate";

interface ExperienceDistributionProps {
  candidates: Candidate[];
}

export const ExperienceDistribution: React.FC<ExperienceDistributionProps> = ({
  candidates,
}) => {
  const data = useMemo(() => {
    const buckets = [
      { name: "0–2 Yrs", count: 0, fill: "#4F7CFF" },
      { name: "3–5 Yrs", count: 0, fill: "#06B6D4" },
      { name: "6–8 Yrs", count: 0, fill: "#10B981" },
      { name: "9–12 Yrs", count: 0, fill: "#F59E0B" },
      { name: "12+ Yrs", count: 0, fill: "#EC4899" },
    ];

    candidates.forEach((c) => {
      const exp = c.experienceYears || c.profile?.yearsOfExperience || 0;
      if (exp <= 2) buckets[0].count++;
      else if (exp <= 5) buckets[1].count++;
      else if (exp <= 8) buckets[2].count++;
      else if (exp <= 12) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [candidates]);

  return (
    <div className="w-full min-w-0 glass-panel rounded-2xl border-white/10 shadow-xl p-5 md:p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
          Candidate Tenure Ranges
        </h2>
        <p className="text-[11px] text-slate-400">
          Distribution of candidate career length grouped by experience brackets.
        </p>
      </div>

      <div className="w-full overflow-hidden">
        {candidates.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No candidates to group.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} dy={8} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(9, 9, 11, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45} data-testid="bar-exp" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
export default ExperienceDistribution;
