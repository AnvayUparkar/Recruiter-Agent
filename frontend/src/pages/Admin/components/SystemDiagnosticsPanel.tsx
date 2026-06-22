import React, { useEffect, useState } from "react";
import { Cpu, HardDrive, Database, RefreshCw, Layers } from "lucide-react";
import { adminService, DiagnosticsReport } from "../../../services/adminService";

export const SystemDiagnosticsPanel: React.FC = () => {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      const data = await adminService.fetchDiagnostics();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDiagnostics();
  };

  if (loading || !report) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 min-h-[300px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Formatting calculations
  const memUsedPercent = (report.memoryUsageMb / report.memoryLimitMb) * 100;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <HardDrive className="text-blue-500" size={20} />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Hardware & Cache Diagnostics
            </h3>
            <p className="text-xs text-slate-400">Deep-dive checks into system indexing and heap allocations</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className={`p-1.5 rounded-lg hover:bg-slate-550/15 text-slate-400 hover:text-slate-200 transition-colors ${
            refreshing ? "animate-spin" : ""
          }`}
          title="Refresh Diagnostics"
          aria-label="Refresh hardware logs"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Memory allocation */}
        <div className="p-4 bg-slate-500/5 border border-slate-200/5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Database size={14} className="text-blue-500" />
              Node Memory Allocation
            </span>
            <span className="font-extrabold text-slate-800 dark:text-slate-100">
              {report.memoryUsageMb} MB / {report.memoryLimitMb} MB
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                memUsedPercent > 80 ? "bg-rose-500" : memUsedPercent > 50 ? "bg-amber-500" : "bg-blue-600"
              }`}
              style={{ width: `${memUsedPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">Heap memory allocated to Python/FAISS process</span>
        </div>

        {/* CPU Util */}
        <div className="p-4 bg-slate-500/5 border border-slate-200/5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Cpu size={14} className="text-purple-500" />
              CPU Load Thread
            </span>
            <span className="font-extrabold text-slate-800 dark:text-slate-100">
              {report.cpuUsagePercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${report.cpuUsagePercent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">Active compute loads of candidate-ranking API</span>
        </div>

        {/* Cache status */}
        <div className="p-4 bg-slate-500/5 border border-slate-200/5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Layers size={14} className="text-emerald-500" />
              Caching Indices
            </span>
            <span className="font-extrabold text-emerald-500">
              {report.activeCacheEntries} keys active
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span>Cache hits rate</span>
            <span className="text-slate-800 dark:text-slate-200">94.2%</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">LRU embeddings cache indices</span>
        </div>
      </div>

      {/* Index Diagnostics Status */}
      <div className="pt-4 border-t border-slate-200/10 dark:border-slate-800/50">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Indexing Health & Environments</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "FAISS Index", status: report.faissIndexStatus === "loaded" ? "Healthy" : "Failed", ok: report.faissIndexStatus === "loaded" },
            { label: "BM25 Search Index", status: report.bm25IndexStatus === "loaded" ? "Healthy" : "Failed", ok: report.bm25IndexStatus === "loaded" },
            { label: "Environment Version", status: `v${report.version}`, ok: true },
            { label: "Deployment OS", status: report.osEnvironment, ok: true },
          ].map((chip) => (
            <div key={chip.label} className="p-3 bg-slate-500/5 border border-slate-200/5 rounded-lg flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">{chip.label}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold capitalize ${
                chip.ok 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15" 
                  : "bg-rose-500/10 text-rose-500 border border-rose-500/15"
              }`}>
                {chip.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemDiagnosticsPanel;
