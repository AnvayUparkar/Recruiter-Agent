import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Candidate } from "../../../types/candidate";

interface RecommendationPieChartProps {
  candidates: Candidate[];
}

const COLORS: Record<string, string> = {
  "Strong Hire": "#10B981",
  "Hire": "#3B82F6",
  "Interview": "#6366F1",
  "Consider": "#F59E0B",
  "Needs Review": "#EF4444",
};

export const RecommendationPieChart: React.FC<RecommendationPieChartProps> = ({
  candidates,
}) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {
      "Strong Hire": 0,
      "Hire": 0,
      "Interview": 0,
      "Consider": 0,
      "Needs Review": 0,
    };

    candidates.forEach((c) => {
      const score = c.rankingScore?.finalScore || 0;
      let verdict = "Needs Review";

      if (score >= 0.82) verdict = "Strong Hire";
      else if (score >= 0.7) verdict = "Hire";
      else if (score >= 0.55) verdict = "Interview";
      else if (score >= 0.4) verdict = "Consider";

      counts[verdict]++;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .filter((item) => item.value > 0);
  }, [candidates]);

  return (
    <div className="w-full glass-panel rounded-2xl border-white/10 shadow-xl p-5 md:p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
          Hiring Recommendation Share
        </h2>
        <p className="text-[11px] text-slate-400">
          Distribution of candidate pool verdicts issued by AI advisor models.
        </p>
      </div>

      <div className="h-72 w-full flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-xs text-slate-500">No verdict records.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name] || "#64748B"}
                  />
                ))}
              </Pie>
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
                verticalAlign="bottom"
                iconSize={10}
                iconType="circle"
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => (
                  <span className="text-slate-300 font-semibold">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
export default RecommendationPieChart;
