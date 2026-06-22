import React from "react";
import { Sliders, RefreshCw, AlertTriangle, Play, Award } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";

export const RankingWeightsEditor: React.FC = () => {
  const { activeConfig, draftConfig, updateWeightsDraft, resetWeightsToDefault } = useAdminStore();

  const weights = {
    ...activeConfig.weights,
    ...draftConfig?.weights
  };

  const isChanged = (key: keyof typeof activeConfig.weights) => {
    return draftConfig?.weights?.[key] !== undefined && draftConfig.weights[key] !== activeConfig.weights[key];
  };

  // Compute sum of standard weights
  const sumOfWeights = 
    weights.techWeight +
    weights.behaviorWeight +
    weights.reliabilityWeight +
    weights.leadershipWeight +
    weights.marketWeight +
    weights.matchWeight;

  const isValid = Math.abs(sumOfWeights - 1.0) < 0.001;

  // Normalization preview helper
  const getNormalized = (val: number) => {
    if (sumOfWeights === 0) return 0;
    return (val / sumOfWeights) * 100;
  };

  // Preset Configurations
  const applyPreset = (preset: "balanced" | "tech" | "reliability") => {
    if (preset === "balanced") {
      updateWeightsDraft({
        techWeight: 0.20,
        behaviorWeight: 0.15,
        reliabilityWeight: 0.15,
        leadershipWeight: 0.15,
        marketWeight: 0.15,
        matchWeight: 0.20,
      });
    } else if (preset === "tech") {
      updateWeightsDraft({
        techWeight: 0.50,
        behaviorWeight: 0.10,
        reliabilityWeight: 0.10,
        leadershipWeight: 0.10,
        marketWeight: 0.10,
        matchWeight: 0.10,
      });
    } else if (preset === "reliability") {
      updateWeightsDraft({
        techWeight: 0.15,
        behaviorWeight: 0.15,
        reliabilityWeight: 0.40,
        leadershipWeight: 0.10,
        marketWeight: 0.10,
        matchWeight: 0.10,
      });
    }
  };

  // Mock candidates to preview weight calculations impact
  const mockCandidates = [
    { name: "Alex (Tech Prodigy)", tech: 0.95, behavior: 0.60, reliability: 0.70, leadership: 0.50, market: 0.80, match: 0.85 },
    { name: "Elena (Core Leader)", tech: 0.75, behavior: 0.85, reliability: 0.90, leadership: 0.95, market: 0.70, match: 0.80 },
    { name: "Chris (All-Rounder)", tech: 0.82, behavior: 0.80, reliability: 0.82, leadership: 0.78, market: 0.75, match: 0.82 },
  ];

  const calculateWeightedScore = (c: typeof mockCandidates[0]) => {
    const raw = 
      (c.tech * weights.techWeight) +
      (c.behavior * weights.behaviorWeight) +
      (c.reliability * weights.reliabilityWeight) +
      (c.leadership * weights.leadershipWeight) +
      (c.market * weights.marketWeight) +
      (c.match * weights.matchWeight);
    
    // Apply confidence multiplier if weights are valid
    const finalScore = isValid ? raw * weights.confidenceMultiplier : raw;
    return Math.min(100, Math.round(finalScore * 100));
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <Sliders className="text-purple-500" size={20} />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-sans">
              Ranking Heuristic Weights
            </h3>
            <p className="text-xs text-slate-400">Calibrate score distribution coefficients</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => applyPreset("balanced")}
            className="px-2.5 py-1 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-[10px] text-slate-400 font-bold transition-all"
          >
            Balanced
          </button>
          <button
            onClick={() => applyPreset("tech")}
            className="px-2.5 py-1 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-[10px] text-slate-400 font-bold transition-all"
          >
            Tech-Heavy
          </button>
          <button
            onClick={() => applyPreset("reliability")}
            className="px-2.5 py-1 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-[10px] text-slate-400 font-bold transition-all"
          >
            Reliable Focus
          </button>
          <button
            onClick={resetWeightsToDefault}
            className="p-1 rounded-lg hover:bg-slate-550/15 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset to factory defaults"
            aria-label="Reset weights to default values"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders Area */}
        <div className="lg:col-span-7 space-y-5">
          {[
            { label: "Technical Score", key: "techWeight" as const },
            { label: "Behavior & Communication", key: "behaviorWeight" as const },
            { label: "Reliability Profile", key: "reliabilityWeight" as const },
            { label: "Leadership Signals", key: "leadershipWeight" as const },
            { label: "Market Competence", key: "marketWeight" as const },
            { label: "Profile Match Score", key: "matchWeight" as const },
          ].map((item) => (
            <div key={item.key} className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-350">{item.label}</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={`text-[11px] ${isChanged(item.key) ? "text-amber-500" : "text-blue-500"}`}>
                    {(weights[item.key] * 100).toFixed(0)}%
                  </span>
                  {!isValid && (
                    <span className="text-[9px] text-slate-500 font-normal truncate">
                      (Norm: {getNormalized(weights[item.key]).toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.8"
                step="0.05"
                value={weights[item.key]}
                onChange={(e) => updateWeightsDraft({ [item.key]: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
              />
            </div>
          ))}

          {/* Confidence Multiplier */}
          <div className="pt-4 border-t border-slate-200/10 dark:border-slate-800/50 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                <Award size={14} className="text-purple-500" />
                Trust Confidence Multiplier
              </span>
              <span className={`text-[11px] font-bold ${isChanged("confidenceMultiplier") ? "text-amber-500" : "text-blue-500"}`}>
                x{weights.confidenceMultiplier.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.5"
              step="0.02"
              value={weights.confidenceMultiplier}
              onChange={(e) => updateWeightsDraft({ confidenceMultiplier: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600 outline-none"
            />
          </div>
        </div>

        {/* Live Gauges & Impact Previews */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Normalization indicator status card */}
          <div className={`p-4 rounded-xl border ${
            isValid 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
          } flex items-start gap-3`}>
            <div className="shrink-0 mt-0.5">
              <AlertTriangle size={16} />
            </div>
            <div className="text-xs">
              <span className="font-extrabold block">
                {isValid ? "Weights Normalized (100%)" : `Weights Cumulative Sum Skewed (${Math.round(sumOfWeights * 100)}%)`}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {isValid
                  ? "Standard sum matches 100%. Calculations can proceed directly."
                  : "Cumulative coefficient does not equal 1.0. Scores will adjust to their relative proportions."}
              </span>
            </div>
          </div>

          {/* Impact preview area */}
          <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/5 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Play size={10} className="text-blue-500" />
                Live Heuristics Scoring Preview
              </span>
              
              <div className="space-y-3.5">
                {mockCandidates.map((c) => {
                  const score = calculateWeightedScore(c);
                  return (
                    <div key={c.name} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full" 
                            style={{ width: `${score}%` }} 
                          />
                        </div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right w-8">{score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/10 dark:border-slate-800/50 text-[10px] text-slate-400 leading-relaxed">
              *Preview shows weighted composite score matching active multipliers. Final ranks adapt depending on weights changes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingWeightsEditor;
