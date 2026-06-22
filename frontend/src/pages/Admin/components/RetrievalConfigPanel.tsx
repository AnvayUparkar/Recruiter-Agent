import React from "react";
import { Search, Info, HelpCircle } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";

export const RetrievalConfigPanel: React.FC = () => {
  const { activeConfig, draftConfig, updateRetrievalDraft } = useAdminStore();

  const config = {
    ...activeConfig.retrieval,
    ...draftConfig?.retrieval
  };

  const isChanged = (key: keyof typeof activeConfig.retrieval) => {
    return draftConfig?.retrieval?.[key] !== undefined && draftConfig.retrieval[key] !== activeConfig.retrieval[key];
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <Search className="text-emerald-500" size={20} />
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Retrieval & Index Settings
          </h3>
          <p className="text-xs text-slate-400">Calibrate database search paths and keyword index boosts</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top-K Retrieval */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-350">Top-K Candidate Candidates Pool</span>
              <span className={`font-extrabold ${isChanged("topK") ? "text-amber-500" : "text-blue-500"}`}>
                {config.topK}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={config.topK}
              onChange={(e) => updateRetrievalDraft({ topK: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
              <span>10 Candidates</span>
              <span>150 Candidates</span>
            </div>
          </div>

          {/* Hybrid search ratio */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                Hybrid Search Vector Weight
              </span>
              <span className={`font-extrabold ${isChanged("hybridRatio") ? "text-amber-500" : "text-blue-500"}`}>
                {Math.round(config.hybridRatio * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={config.hybridRatio}
              onChange={(e) => updateRetrievalDraft({ hybridRatio: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
              <span>0% (Full BM25 Text)</span>
              <span>100% (Full FAISS Vector)</span>
            </div>
          </div>

          {/* Vector Similarity Threshold */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-350">Vector Similarity Threshold</span>
              <span className={`font-extrabold ${isChanged("similarityThreshold") ? "text-amber-500" : "text-blue-500"}`}>
                {config.similarityThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="0.9"
              step="0.02"
              value={config.similarityThreshold}
              onChange={(e) => updateRetrievalDraft({ similarityThreshold: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
              <span>0.40 (Broad search)</span>
              <span>0.90 (Exact matches)</span>
            </div>
          </div>

          {/* Keyword Boost */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-350">BM25 Keyword Index Boost</span>
              <span className={`font-extrabold ${isChanged("keywordBoost") ? "text-amber-500" : "text-blue-500"}`}>
                x{config.keywordBoost.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.1"
              value={config.keywordBoost}
              onChange={(e) => updateRetrievalDraft({ keywordBoost: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 outline-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
              <span>x1.0 (Standard)</span>
              <span>x2.5 (Strong term match)</span>
            </div>
          </div>

          {/* Reranking Limit */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-350">Cross-Encoder Rerank Limit</span>
              <span className={`font-extrabold ${isChanged("rerankingLimit") ? "text-amber-500" : "text-blue-500"}`}>
                {config.rerankingLimit}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={config.rerankingLimit}
              onChange={(e) => updateRetrievalDraft({ rerankingLimit: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
              <span>5 Candidates</span>
              <span>40 Candidates</span>
            </div>
          </div>

          {/* Chunk size */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-350">Document Text Chunk size</span>
              <span className={`font-extrabold ${isChanged("chunkSize") ? "text-amber-500" : "text-blue-500"}`}>
                {config.chunkSize} words
              </span>
            </div>
            <input
              type="range"
              min="250"
              max="2000"
              step="250"
              value={config.chunkSize}
              onChange={(e) => updateRetrievalDraft({ chunkSize: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 outline-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
              <span>250 words</span>
              <span>2000 words</span>
            </div>
          </div>
        </div>

        {/* Deduplication Switch & Help */}
        <div className="pt-4 border-t border-slate-200/10 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <HelpCircle size={18} />
            </div>
            <div className="text-xs">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Filter Duplicate Profiles</span>
              <span className="text-[10px] text-slate-400 block">Automatically flags duplicate profiles by identity parameters.</span>
            </div>
          </div>
          
          <button
            onClick={() => updateRetrievalDraft({ deduplication: !config.deduplication })}
            className={`w-11 h-6 rounded-full transition-colors duration-250 p-1 flex outline-none focus-ring relative shrink-0 ml-auto md:ml-0 ${
              config.deduplication ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
            }`}
            aria-label="Toggle profile deduplication"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 shadow-sm ${
                config.deduplication ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/5 flex items-start gap-2.5">
          <div className="text-blue-500 shrink-0 mt-0.5">
            <Info size={14} />
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            <strong>Hybrid Search Tuning:</strong> High Vector weights prioritize semantic meanings (e.g. synonyms), while keyword boosts emphasize exact certification keywords or years matches. Balancing these prevents filtering anomalies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RetrievalConfigPanel;
