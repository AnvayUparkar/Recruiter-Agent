import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";
import { Candidate } from "../../../types/candidate";

interface ComparisonRadarChartProps {
  candidates: Candidate[];
}

// Harmonious Apple/Linear color palette
const CANDIDATE_COLORS = [
  "#4F7CFF", // Electric Blue
  "#A855F7", // Purple
  "#EC4899", // Rose
  "#F59E0B", // Amber
  "#10B981", // Emerald
];

export const ComparisonRadarChart: React.FC<ComparisonRadarChartProps> = ({
  candidates,
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeCandidateIds, setActiveCandidateIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    setActiveCandidateIds(candidates.map((c) => c.candidateId));
  }, [candidates]);

  // Handle toggling candidates on legend click
  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    setActiveCandidateIds((prev) =>
      prev.includes(dataKey)
        ? prev.filter((id) => id !== dataKey)
        : [...prev, dataKey]
    );
  };

  // Format Recharts data structures
  const chartData = useMemo(() => {
    const subjects = [
      { key: "technical", name: "Technical Depth" },
      { key: "reliability", name: "Profile Reliability" },
      { key: "leadership", name: "Leadership Potential" },
      { key: "behavior", name: "Behavioral Alignment" },
      { key: "matching", name: "JD Requirements" },
      { key: "confidence", name: "Match Confidence" },
    ];

    return subjects.map((subject) => {
      const item: any = { subject: subject.name };
      candidates.forEach((c) => {
        const score = c.rankingScore;
        const reliability = c.reliabilityProfile;
        const behavior = c.behaviorProfile;

        let val = 0;
        if (subject.key === "technical") {
          val = score?.technicalScore || 0;
        } else if (subject.key === "reliability") {
          val = reliability?.reliabilityScore || score?.trustScore || 0;
        } else if (subject.key === "leadership") {
          val = score?.leadershipScore || 0;
        } else if (subject.key === "behavior") {
          val = behavior?.behavioralScore || score?.behavioralScore || 0;
        } else if (subject.key === "matching") {
          val = score?.matchingScore || 0;
        } else if (subject.key === "confidence") {
          val = score?.confidence || reliability?.confidence || 0.8;
        }
        item[c.candidateId] = Math.round(val * 100);
      });
      return item;
    });
  }, [candidates]);

  if (!mounted) {
    return (
      <div className="h-[360px] flex items-center justify-center text-slate-400 text-xs">
        Loading interactive Radar Chart...
      </div>
    );
  }

  return (
    <div className="w-full glass-panel rounded-2xl border-white/10 shadow-xl p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
          AI Candidate Fit Radar
        </h2>
        <p className="text-[11px] text-slate-400">
          Click legend names below to toggle individual candidate radars.
        </p>
      </div>

      <div className="h-[360px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#475569", fontSize: 9 }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(9, 9, 11, 0.95)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "#FFFFFF",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#E2E8F0" }}
            />

            {candidates.map((c, i) => {
              const color = CANDIDATE_COLORS[i % CANDIDATE_COLORS.length];
              const isVisible = activeCandidateIds.includes(c.candidateId);

              return (
                <Radar
                  key={c.candidateId}
                  name={c.name}
                  dataKey={c.candidateId}
                  stroke={color}
                  fill={color}
                  fillOpacity={isVisible ? 0.15 : 0}
                  strokeOpacity={isVisible ? 1 : 0.1}
                  dot={isVisible ? { r: 3, strokeWidth: 1 } : false}
                />
              );
            })}

            <Legend
              onClick={handleLegendClick}
              wrapperStyle={{
                paddingTop: 10,
                fontSize: 12,
                cursor: "pointer",
              }}
              formatter={(value) => {
                const index = candidates.findIndex((c) => c.name === value);
                const isVisible = activeCandidateIds.some(
                  (id) => id === candidates[index]?.candidateId
                );
                return (
                  <span
                    className={`font-semibold transition-all ${
                      isVisible
                        ? "text-slate-200"
                        : "text-slate-600 line-through opacity-45"
                    }`}
                  >
                    {value}
                  </span>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default ComparisonRadarChart;
