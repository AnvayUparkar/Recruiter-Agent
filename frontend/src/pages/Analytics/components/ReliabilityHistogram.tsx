import React, { useMemo } from "react";
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
import { HelpCircle } from "lucide-react";

interface ReliabilityHistogramProps {
  candidates: Candidate[];
}

const COLORS: Record<string, string> = {
  "Verified High": "#10B981", // Emerald
  "Consistent Nominal": "#F59E0B", // Amber
  "Review Recommended": "#EF4444", // Rose
};

export const ReliabilityHistogram: React.FC<ReliabilityHistogramProps> = ({
  candidates,
}) => {
  const data = useMemo(() => {
    const counts = {
      "Verified High": 0,
      "Consistent Nominal": 0,
      "Review Recommended": 0,
    };

    candidates.forEach((c) => {
      const score = c.reliabilityProfile?.reliabilityScore || c.rankingScore?.trustScore || 0.8;
      const scoreVal = score * 100;

      if (scoreVal >= 80) {
        counts["Verified High"]++;
      } else if (scoreVal >= 65) {
        counts["Consistent Nominal"]++;
      } else {
        counts["Review Recommended"]++;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [candidates]);

  return (
    <div className="w-full min-w-0 glass-panel rounded-2xl border-white/10 shadow-xl p-5 md:p-6 mb-6 relative group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading flex items-center gap-1.5">
            <span>Profile Reliability Index</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Integrity check categorizations based on timeline, experience, and skill verification.
          </p>
        </div>

        {/* Info Explainer Tooltip */}
        <div className="relative group/tooltip">
          <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" aria-label="About Reliability Index">
            <HelpCircle size={16} />
          </button>
          <div className="absolute right-0 top-6 w-64 p-3 rounded-xl bg-black/95 border border-white/10 text-[10px] text-slate-300 leading-relaxed invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 transition-all duration-200 z-20 shadow-xl">
            <span className="font-bold text-white block mb-1">Index Calculations</span>
            Checks for overlap anomalies in career history, credentials stuffing, title discrepancies, and verified professional records.
            <div className="mt-2 grid grid-cols-2 gap-1 text-[9px]">
              <span className="text-emerald-400">High: &gt;= 80%</span>
              <span className="text-amber-400">Nominal: 65-80%</span>
              <span className="text-rose-400 font-bold col-span-2">Review: &lt; 65%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        {candidates.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No candidates to audit.
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
                itemStyle={{ color: "#FFFFFF" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name] || "#64748B"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
export default ReliabilityHistogram;
