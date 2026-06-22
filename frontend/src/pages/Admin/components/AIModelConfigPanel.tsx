import React from "react";
import { Cpu, Sliders, Settings2, Info } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";

export const AIModelConfigPanel: React.FC = () => {
  const { activeConfig, draftConfig, updateAIDraft } = useAdminStore();

  // Get current active values or unsaved draft values
  const aiConfig = {
    ...activeConfig.ai,
    ...draftConfig?.ai
  };

  const isChanged = (key: keyof typeof activeConfig.ai) => {
    return draftConfig?.ai?.[key] !== undefined && draftConfig.ai[key] !== activeConfig.ai[key];
  };

  const llmOptions = ["gpt-4o", "gpt-4-turbo", "claude-3-5-sonnet", "gemini-1.5-pro"];
  const embeddingOptions = ["text-embedding-3-large", "text-embedding-3-small", "cohere-embed-v3"];
  const rankingOptions = ["cross-encoder-ms-marco", "cohere-rerank-v3", "bge-reranker-large"];
  const copilotOptions = ["gpt-4o-mini", "claude-3-haiku", "gemini-1.5-flash"];
  const fallbackOptions = ["gpt-3.5-turbo", "gpt-4o-mini", "claude-3-haiku"];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl">
      <div className="flex items-center gap-2.5 mb-6">
        <Cpu className="text-blue-500" size={20} />
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">AI Model Settings</h3>
          <p className="text-xs text-slate-400">Configure language models, embedding pathways, and inference rules</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Model Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Active LLM */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
              <span>Primary LLM</span>
              {isChanged("activeLLM") && <span className="text-[10px] text-amber-500 font-extrabold normal-case">Unsaved Draft</span>}
            </label>
            <select
              value={aiConfig.activeLLM}
              onChange={(e) => updateAIDraft({ activeLLM: e.target.value })}
              className={`w-full bg-slate-900/50 dark:bg-slate-950/60 border ${
                isChanged("activeLLM") ? "border-amber-500/50" : "border-slate-200/10 dark:border-slate-800/80"
              } rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-semibold focus-ring outline-none`}
            >
              {llmOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Embedding Model */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
              <span>Embedding Indexer</span>
              {isChanged("embeddingModel") && <span className="text-[10px] text-amber-500 font-extrabold normal-case">Unsaved Draft</span>}
            </label>
            <select
              value={aiConfig.embeddingModel}
              onChange={(e) => updateAIDraft({ embeddingModel: e.target.value })}
              className={`w-full bg-slate-900/50 dark:bg-slate-950/60 border ${
                isChanged("embeddingModel") ? "border-amber-500/50" : "border-slate-200/10 dark:border-slate-800/80"
              } rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-semibold focus-ring outline-none`}
            >
              {embeddingOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Reranker Model */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
              <span>Reranking Engine</span>
              {isChanged("rankingModel") && <span className="text-[10px] text-amber-500 font-extrabold normal-case">Unsaved Draft</span>}
            </label>
            <select
              value={aiConfig.rankingModel}
              onChange={(e) => updateAIDraft({ rankingModel: e.target.value })}
              className={`w-full bg-slate-900/50 dark:bg-slate-950/60 border ${
                isChanged("rankingModel") ? "border-amber-500/50" : "border-slate-200/10 dark:border-slate-800/80"
              } rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-semibold focus-ring outline-none`}
            >
              {rankingOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Copilot Agent Model */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
              <span>Copilot Agent</span>
              {isChanged("copilotModel") && <span className="text-[10px] text-amber-500 font-extrabold normal-case">Unsaved Draft</span>}
            </label>
            <select
              value={aiConfig.copilotModel}
              onChange={(e) => updateAIDraft({ copilotModel: e.target.value })}
              className={`w-full bg-slate-900/50 dark:bg-slate-950/60 border ${
                isChanged("copilotModel") ? "border-amber-500/50" : "border-slate-200/10 dark:border-slate-800/80"
              } rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-semibold focus-ring outline-none`}
            >
              {copilotOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Fallback Core */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
              <span>Fallback Backup Core</span>
              {isChanged("fallbackModel") && <span className="text-[10px] text-amber-500 font-extrabold normal-case">Unsaved Draft</span>}
            </label>
            <select
              value={aiConfig.fallbackModel}
              onChange={(e) => updateAIDraft({ fallbackModel: e.target.value })}
              className={`w-full bg-slate-900/50 dark:bg-slate-950/60 border ${
                isChanged("fallbackModel") ? "border-amber-500/50" : "border-slate-200/10 dark:border-slate-800/80"
              } rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-semibold focus-ring outline-none`}
            >
              {fallbackOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hyperparameters Controls */}
        <div className="pt-4 border-t border-slate-200/10 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sliders size={14} className="text-slate-400" />
                Temperature (Creativity)
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded bg-slate-500/10 ${
                isChanged("temperature") ? "text-amber-500 bg-amber-500/5" : "text-blue-500"
              }`}>
                {aiConfig.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={aiConfig.temperature}
              onChange={(e) => updateAIDraft({ temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none focus-ring"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
              <span>0.0 (Strict / Deterministic)</span>
              <span>1.0 (Creative / Loose)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Settings2 size={14} className="text-slate-400" />
                Max Tokens Response Limit
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded bg-slate-500/10 ${
                isChanged("maxTokens") ? "text-amber-500 bg-amber-500/5" : "text-blue-500"
              }`}>
                {aiConfig.maxTokens}
              </span>
            </div>
            <input
              type="range"
              min="512"
              max="8192"
              step="256"
              value={aiConfig.maxTokens}
              onChange={(e) => updateAIDraft({ maxTokens: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none focus-ring"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
              <span>512 tokens</span>
              <span>8192 tokens</span>
            </div>
          </div>
        </div>

        {/* Streaming Switch toggle */}
        <div className="pt-4 border-t border-slate-200/10 dark:border-slate-800/50 flex items-center justify-between p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/5">
          <div className="flex gap-3 pr-4">
            <div className="text-blue-500 shrink-0">
              <Info size={16} />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Enable Inference Streaming</span>
              <span className="text-[10px] text-slate-400 block">Streams token answers incrementally to reduce perceived latency times.</span>
            </div>
          </div>
          
          <button
            onClick={() => updateAIDraft({ streaming: !aiConfig.streaming })}
            className={`w-11 h-6 rounded-full transition-colors duration-250 p-1 flex outline-none focus-ring relative shrink-0 ${
              aiConfig.streaming ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
            }`}
            aria-label="Toggle inference streaming"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 shadow-sm ${
                aiConfig.streaming ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIModelConfigPanel;
