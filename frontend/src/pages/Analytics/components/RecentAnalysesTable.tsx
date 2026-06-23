import React, { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Eye, FileSpreadsheet } from "lucide-react";

interface AnalysisRecord {
  id: string;
  timestamp: string;
  jobTitle: string;
  candidatesCount: number;
  topScore: number;
  processingTimeMs: number;
}

const HISTORICAL_LOGS: AnalysisRecord[] = [
  {
    id: "an_1",
    timestamp: "2026-06-16T19:30:00Z",
    jobTitle: "Senior Machine Learning Engineer",
    candidatesCount: 100,
    topScore: 94,
    processingTimeMs: 115,
  },
  {
    id: "an_2",
    timestamp: "2026-06-15T14:15:00Z",
    jobTitle: "Quantitative Analyst (Risk Model)",
    candidatesCount: 85,
    topScore: 88,
    processingTimeMs: 98,
  },
  {
    id: "an_3",
    timestamp: "2026-06-14T11:00:00Z",
    jobTitle: "Full Stack Engineer (Finance Infra)",
    candidatesCount: 120,
    topScore: 92,
    processingTimeMs: 140,
  },
  {
    id: "an_4",
    timestamp: "2026-06-12T09:45:00Z",
    jobTitle: "Senior DevOps Architect (K8s/AWS)",
    candidatesCount: 75,
    topScore: 91,
    processingTimeMs: 110,
  },
];

export const RecentAnalysesTable: React.FC = () => {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof AnalysisRecord>("timestamp");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: keyof AnalysisRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const processedData = useMemo(() => {
    return HISTORICAL_LOGS.filter((log) =>
      log.jobTitle.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [search, sortField, sortAsc]);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="w-full glass-panel rounded-2xl border-border shadow-xl p-5 md:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-heading">
            Recent Analysis Log
          </h2>
          <p className="text-[11px] text-text-muted">
            Historical index matching jobs parsed and candidate pools evaluated.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job titles..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-surface/50 border border-border text-text-primary text-xs outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs font-bold uppercase bg-surface-hover/30 cursor-pointer">
              <th className="py-3 px-4" onClick={() => handleSort("timestamp")}>
                <div className="flex items-center gap-1">
                  <span>Timestamp</span>
                  {sortField === "timestamp" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th className="py-3 px-4" onClick={() => handleSort("jobTitle")}>
                <div className="flex items-center gap-1">
                  <span>Job Role parsed</span>
                  {sortField === "jobTitle" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th className="py-3 px-4 text-center" onClick={() => handleSort("candidatesCount")}>
                <div className="flex items-center justify-center gap-1">
                  <span>Evaluated</span>
                  {sortField === "candidatesCount" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th className="py-3 px-4 text-center" onClick={() => handleSort("topScore")}>
                <div className="flex items-center justify-center gap-1">
                  <span>Top Score</span>
                  {sortField === "topScore" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th className="py-3 px-4 text-center" onClick={() => handleSort("processingTimeMs")}>
                <div className="flex items-center justify-center gap-1">
                  <span>Latency</span>
                  {sortField === "processingTimeMs" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th className="py-3 px-4 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-sans">
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-disabled text-xs">
                  No matches found in analysis history.
                </td>
              </tr>
            ) : (
              processedData.map((log) => (
                <tr key={log.id} className="hover:bg-surface-hover/20 text-xs text-text-muted transition-colors">
                  <td className="py-3 px-4 font-mono">{formatDate(log.timestamp)}</td>
                  <td className="py-3 px-4 font-semibold text-text-primary">{log.jobTitle}</td>
                  <td className="py-3 px-4 text-center font-mono">{log.candidatesCount}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-500 dark:text-emerald-400">
                    {log.topScore}%
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{log.processingTimeMs}ms</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => alert(`Reviewing calibration logs for ${log.jobTitle}...`)}
                        className="p-1 rounded bg-surface-hover border border-border hover:bg-surface-hover/80 text-text-muted hover:text-text-primary transition-colors"
                        title="View calibration charts"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => alert(`Exporting metadata manifest for ${log.jobTitle}...`)}
                        className="p-1 rounded bg-surface-hover border border-border hover:bg-surface-hover/80 text-text-muted hover:text-text-primary transition-colors"
                        title="Export manifest"
                      >
                        <FileSpreadsheet size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default RecentAnalysesTable;
