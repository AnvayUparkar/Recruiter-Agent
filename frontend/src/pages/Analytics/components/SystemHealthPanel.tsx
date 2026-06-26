import React from "react";
import { RefreshCw, Server, Database } from "lucide-react";

interface SystemHealthPanelProps {
  apiStatus: string;
  latencyMs: number;
  candidateCount: number;
  environment: string;
  version: string;
  faissLoaded: boolean;
  bm25Loaded: boolean;
  onRefresh: () => void;
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  apiStatus,
  latencyMs,
  candidateCount,
  environment,
  version,
  faissLoaded,
  bm25Loaded,
  onRefresh,
}) => {
  const isHealthy = apiStatus === "healthy" || apiStatus === "online";

  return (
    <div className="w-full glass-panel rounded-2xl border-border shadow-xl p-5 md:p-6 mb-6">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-heading">
            System Telemetry & Health
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">
            Microservice status parameters and active database connection indexes.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-surface-hover border border-border hover:bg-surface-hover/80 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Refresh telemetry status"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Core Status Card */}
        <div className="p-4 rounded-xl bg-surface/50 border border-border flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Backend Server
            </span>
            <div className="flex items-center gap-1.5 text-xs text-text-primary">
              <span
                className={`w-2 h-2 rounded-full block
                  ${isHealthy ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" : "bg-rose-500 animate-ping"}`}
              />
              <span className="capitalize font-semibold">{apiStatus}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs">
            <div className="p-2 rounded-lg bg-surface-hover border border-border text-text-muted">
              <Server size={16} />
            </div>
            <div>
              <p className="text-text-muted text-[10px]">Active Node Port</p>
              <p className="font-mono text-text-primary font-bold">Flask Core :5000</p>
            </div>
          </div>
        </div>

        {/* Database Index status */}
        <div className="p-4 rounded-xl bg-surface/50 border border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Search Index Status
            </span>
            <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
              FAISS + BM25
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs">
            <div className="p-2 rounded-lg bg-surface-hover border border-border text-text-muted">
              <Database size={16} />
            </div>
            <div>
              <p className="text-text-muted text-[10px]">Indexed Profiles</p>
              <p className="font-mono text-text-primary font-bold">{candidateCount} Records Loaded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border text-[11px]">
        <div className="flex items-center justify-between text-text-muted">
          <span>FAISS Hybrid Vector:</span>
          <span className={faissLoaded ? "text-emerald-500 dark:text-emerald-400 font-bold" : "text-rose-500 dark:text-rose-450 font-bold"}>
            {faissLoaded ? "Loaded" : "Offline"}
          </span>
        </div>

        <div className="flex items-center justify-between text-text-muted">
          <span>BM25 Keyword Index:</span>
          <span className={bm25Loaded ? "text-emerald-500 dark:text-emerald-400 font-bold" : "text-rose-500 dark:text-rose-450 font-bold"}>
            {bm25Loaded ? "Loaded" : "Offline"}
          </span>
        </div>

        <div className="flex items-center justify-between text-text-muted">
          <span>Average Telemetry:</span>
          <span className="font-mono text-text-primary font-semibold">{latencyMs.toFixed(1)}ms</span>
        </div>

        <div className="flex items-center justify-between text-text-muted">
          <span>Framework Version:</span>
          <span className="font-mono text-text-primary font-semibold">v{version} ({environment})</span>
        </div>
      </div>
    </div>
  );
};
export default SystemHealthPanel;
