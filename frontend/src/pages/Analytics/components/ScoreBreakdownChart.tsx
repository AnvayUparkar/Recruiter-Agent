import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Candidate } from "../../../types/candidate";

interface ScoreBreakdownChartProps {
  candidates: Candidate[];
}

export const ScoreBreakdownChart: React.FC<ScoreBreakdownChartProps> = ({
  candidates,
}) => {
  const [activeDimension, setActiveDimension] = useState<"final" | "technical" | "behavior" | "reliability" | "leadership">("final");

  const data = useMemo(() => {
    const buckets = [
      { name: "0-20%", count: 0 },
      { name: "21-40%", count: 0 },
      { name: "41-60%", count: 0 },
      { name: "61-80%", count: 0 },
      { name: "81-100%", count: 0 },
    ];

    candidates.forEach((c) => {
      let score = 0.5; // fallback middle value

      if (activeDimension === "final") {
        score = c.rankingScore?.finalScore || 0;
      } else if (activeDimension === "technical") {
        score = c.rankingScore?.technicalScore || 0;
      } else if (activeDimension === "behavior") {
        score = c.behaviorProfile?.behavioralScore || c.rankingScore?.behavioralScore || 0;
      } else if (activeDimension === "reliability") {
        score = c.reliabilityProfile?.reliabilityScore || c.rankingScore?.trustScore || 0;
      } else if (activeDimension === "leadership") {
        score = c.rankingScore?.leadershipScore || 0;
      }

      const val = score * 100;
      if (val <= 20) buckets[0].count++;
      else if (val <= 40) buckets[1].count++;
      else if (val <= 60) buckets[2].count++;
      else if (val <= 80) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [candidates, activeDimension]);

  const gradientColor = useMemo(() => {
    switch (activeDimension) {
      case "final":
        return { stroke: "#4F7CFF", stop: "#4F7CFF" };
      case "technical":
        return { stroke: "#06B6D4", stop: "#06B6D4" };
      case "behavior":
        return { stroke: "#EC4899", stop: "#EC4899" };
      case "reliability":
        return { stroke: "#8B5CF6", stop: "#8B5CF6" };
      default:
        return { stroke: "#F59E0B", stop: "#F59E0B" };
    }
  }, [activeDimension]);

  return (
    <div className="w-full glass-panel rounded-2xl border-white/10 shadow-xl p-5 md:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
            AI Score Distribution Density
          </h2>
          <p className="text-[11px] text-slate-400">
            Density of candidate pool ratings partitioned across score levels.
          </p>
        </div>

        {/* Dimension Selection */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 flex-wrap gap-1">
          {(["final", "technical", "behavior", "reliability", "leadership"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setActiveDimension(opt)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all duration-150
                ${
                  activeDimension === opt
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        {candidates.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No candidates to map.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientColor.stop} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={gradientColor.stop} stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="count"
                stroke={gradientColor.stroke}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#scoreColor)"
                name="Candidates count"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
export default ScoreBreakdownChart;
