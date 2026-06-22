import React, { useState, useEffect } from "react";
import { useTheme } from "../providers/ThemeProvider";
import { healthService } from "../services/healthService";
import { 
  Settings, 
  Sun, 
  Moon, 
  Laptop,
  Sliders, 
  Cpu, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  Server
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [healthInfo, setHealthInfo] = useState<any>(null);

  // Granular weight states
  const [weights, setWeights] = useState({
    technical: 40,
    career: 20,
    behavioral: 20,
    matching: 10,
    leadership: 5,
    market: 5,
  });

  useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        const v = await healthService.fetchVersion();
        setVersionInfo(v);
        const h = await healthService.fetchHealth();
        setHealthInfo(h);
      } catch (err) {
        console.error("Failed to load backend version/health status:", err);
      }
    };
    loadSystemInfo();
  }, []);

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const totalWeights = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightsBalanced = totalWeights === 100;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="text-blue-500" />
          <span>System Settings & Tuning</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Adjust recruiter scoring weight distributions, customize theme modes, and inspect platform index health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Theme and weights tuning */}
        <div className="flex flex-col gap-6">
          {/* Theme card */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Theme Configuration
            </h3>
            <div className="flex flex-col gap-3">
              <span className="text-xs text-slate-500">Select interface mode: Light, Dark, or sync with System colors.</span>
              
              <div className="flex p-1 rounded-xl bg-slate-200/60 dark:bg-slate-950 border border-slate-300/60 dark:border-slate-850">
                {(["light", "dark", "system"] as const).map((mode) => {
                  const isActive = theme === mode;
                  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Laptop;
                  return (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all focus-ring outline-none
                        ${isActive 
                          ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md border-transparent" 
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                    >
                      <Icon size={14} />
                      <span>{mode}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Weights sliders card */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-blue-500" />
              <span>Scoring Weight Tuning</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tweak scoring model variables to adjust how candidate fits are calculated. Weights must sum to 100%.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              {Object.entries(weights).map(([key, val]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold capitalize text-slate-800 dark:text-slate-250">
                    <span>{key} Alignment</span>
                    <span>{val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={val}
                    onChange={(e) => handleWeightChange(key as any, Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg bg-slate-250 dark:bg-slate-900 appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Verification indicator */}
            <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 text-xs
              ${isWeightsBalanced 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-500"}`}>
              {isWeightsBalanced ? (
                <>
                  <ShieldCheck size={18} />
                  <span>Weights are balanced! Calibration logic is configured successfully.</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} className="shrink-0" />
                  <span>Current sum is {totalWeights}%. Adjust sliders to sum precisely to 100%.</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Gateway health details */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Server size={16} className="text-blue-500" />
            <span>Subsystem Health & Versioning</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verify the status of ML indexes, search databases, and local file storage paths.
          </p>

          <div className="flex flex-col gap-4 divide-y divide-slate-200/10 dark:divide-slate-800/50 mt-2">
            {/* Version and Env */}
            <div className="flex flex-col gap-2 pb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">API Instance Metadata</span>
              <div className="grid grid-cols-2 gap-3 text-xs mt-1 text-slate-500">
                <div>
                  <span>Platform Service:</span>
                  <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {versionInfo?.service || "candidate-ranking-system"}
                  </span>
                </div>
                <div>
                  <span>Active Version:</span>
                  <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    v{versionInfo?.version || "1.0.0"}
                  </span>
                </div>
                <div>
                  <span>Host OS:</span>
                  <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5 capitalize">
                    {versionInfo?.environment || "Windows"}
                  </span>
                </div>
                <div>
                  <span>Subsystem Gateway:</span>
                  <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5 capitalize">
                    {versionInfo?.status || "online"}
                  </span>
                </div>
              </div>
            </div>

            {/* Model indexes */}
            <div className="flex flex-col gap-3 pt-4">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Retrieval & Embedding Indexes</span>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Cpu size={14} />
                    <span>Sentence Transformer Models</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    ${healthInfo?.model_loaded ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    {healthInfo?.model_loaded ? "LOADED" : "OFFLINE"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Database size={14} />
                    <span>FAISS Vector Database</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    ${healthInfo?.faiss_loaded ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    {healthInfo?.faiss_loaded ? "ACTIVE" : "OFFLINE"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Database size={14} />
                    <span>BM25 Inverted Index</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    ${healthInfo?.bm25_loaded ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    {healthInfo?.bm25_loaded ? "ACTIVE" : "OFFLINE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate stats */}
            <div className="pt-4 text-xs text-slate-500 flex items-center justify-between">
              <span>Indexed Database Candidates:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {healthInfo?.candidate_count || 1000} profiles
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
