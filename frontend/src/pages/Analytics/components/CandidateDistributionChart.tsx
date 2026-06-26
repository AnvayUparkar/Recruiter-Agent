import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Candidate } from "../../../types/candidate";

interface CandidateDistributionChartProps {
  candidates: Candidate[];
}

const COLORS = ["#4F7CFF", "#A855F7", "#EC4899", "#F59E0B", "#10B981"];

export const CandidateDistributionChart: React.FC<CandidateDistributionChartProps> = ({
  candidates,
}) => {
  const [metric, setMetric] = useState<"experience" | "location" | "education" | "availability">("location");

  const data = useMemo(() => {
    const counts: Record<string, number> = {};

    candidates.forEach((c) => {
      let key = "Unknown";
      if (metric === "location") {
        key = c.location || "Flexible";
      } else if (metric === "experience") {
        const exp = c.experienceYears || c.profile?.yearsOfExperience || 0;
        if (exp <= 2) key = "Junior (0-2 Yrs)";
        else if (exp <= 5) key = "Mid (3-5 Yrs)";
        else if (exp <= 8) key = "Senior (6-8 Yrs)";
        else if (exp <= 12) key = "Lead (9-12 Yrs)";
        else key = "Principal (12+ Yrs)";
      } else if (metric === "education") {
        key = c.education?.[0]?.degree || "Degree Unspecified";
      } else if (metric === "availability") {
        key = c.availability || "Immediate / Flex";
      }

      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [candidates, metric]);

  return (
    <div className="w-full min-w-0 glass-panel rounded-2xl border-white/10 shadow-xl p-5 md:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
            Candidate Demographics Distribution
          </h2>
          <p className="text-[11px] text-slate-400">
            Candidate count categorized by different background indicators.
          </p>
        </div>

        {/* Dimension Toggles */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 flex-wrap gap-1">
          {(["location", "experience", "education", "availability"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setMetric(opt)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all duration-150
                ${
                  metric === opt
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No candidate profiles found matching current filters.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                dy={8}
              />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(9, 9, 11, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
                labelStyle={{ fontWeight: "bold" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
export default CandidateDistributionChart;
