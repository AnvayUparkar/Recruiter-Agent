import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip,
} from "recharts";
import { Candidate } from "../../../types/candidate";
import { ParsedJD, RequirementDetail } from "../../../types/common";

interface SkillCoverageChartProps {
  candidates: Candidate[];
  parsedJD: ParsedJD | null;
}

export const SkillCoverageChart: React.FC<SkillCoverageChartProps> = ({
  candidates,
  parsedJD,
}) => {
  const data = useMemo(() => {
    if (candidates.length === 0) return [];

    const mustHave: RequirementDetail[] = parsedJD?.mustHave || parsedJD?.must_have || [];
    const niceToHave: RequirementDetail[] = parsedJD?.niceToHave || parsedJD?.good_to_have || [];
    const totalRequired = mustHave.length || 5; // fallback count
    const totalPreferred = niceToHave.length || 3;

    let avgRequiredMatched = 0;
    let avgPreferredMatched = 0;
    let avgMissing = 0;

    candidates.forEach((c) => {
      const skills = c.skills || [];

      // Calculate matches
      let reqCount = 0;
      mustHave.forEach((req) => {
        if (skills.some((s) => s.name.toLowerCase().includes(req.name.toLowerCase()) || req.name.toLowerCase().includes(s.name.toLowerCase()))) {
          reqCount++;
        }
      });

      let prefCount = 0;
      niceToHave.forEach((pref) => {
        if (skills.some((s) => s.name.toLowerCase().includes(pref.name.toLowerCase()) || pref.name.toLowerCase().includes(s.name.toLowerCase()))) {
          prefCount++;
        }
      });

      avgRequiredMatched += reqCount;
      avgPreferredMatched += prefCount;
      avgMissing += (totalRequired - reqCount);
    });

    avgRequiredMatched /= candidates.length;
    avgPreferredMatched /= candidates.length;
    avgMissing /= candidates.length;

    // Convert to percentage ratios
    const reqPct = Math.round((avgRequiredMatched / totalRequired) * 100);
    const prefPct = Math.round((avgPreferredMatched / (totalPreferred || 1)) * 100);
    const missPct = Math.round((avgMissing / totalRequired) * 100);

    return [
      {
        name: "Required Matched",
        value: Math.min(reqPct, 100),
        fill: "#10B981", // Emerald
      },
      {
        name: "Preferred Matched",
        value: Math.min(prefPct, 100),
        fill: "#3B82F6", // Blue
      },
      {
        name: "Missing Required",
        value: Math.min(missPct, 100),
        fill: "#EF4444", // Rose
      },
    ];
  }, [candidates, parsedJD]);

  return (
    <div className="w-full min-w-0 glass-panel rounded-2xl border-white/10 shadow-xl p-5 md:p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
          Cohort Skill Match Telemetry
        </h2>
        <p className="text-[11px] text-slate-400">
          Average skill gap ratios evaluated across the shortlisted candidate pool.
        </p>
      </div>

      <div className="w-full overflow-hidden flex items-center justify-center">
        {candidates.length === 0 ? (
          <div className="text-xs text-slate-500 font-sans">No skill data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="30%"
              outerRadius="90%"
              barSize={15}
              data={data}
            >
              <RadialBar
                background={{ fill: "rgba(255, 255, 255, 0.03)" }}
                label={{ position: "insideStart", fill: "#fff", fontSize: 10, fontWeight: "bold" }}
                dataKey="value"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(9, 9, 11, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconSize={10}
                iconType="circle"
                layout="horizontal"
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => (
                  <span className="text-slate-350 font-semibold">{value}</span>
                )}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
export default SkillCoverageChart;
