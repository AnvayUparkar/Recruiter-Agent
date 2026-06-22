import React from "react";
import { ArrowLeft, Trash2, Share2, Download, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ComparisonToolbarProps {
  candidateCount: number;
  onClear: () => void;
  onAddMore: () => void;
}

export const ComparisonToolbar: React.FC<ComparisonToolbarProps> = ({
  candidateCount,
  onClear,
  onAddMore,
}) => {
  const navigate = useNavigate();

  const handleExport = () => {
    alert("Exporting comparison report as PDF... (Feature placeholder for Phase 10)");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Comparison link copied to clipboard! (Feature placeholder for Phase 10)");
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-panel rounded-2xl border-white/10 shadow-lg mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-all focus:ring-2 focus:ring-blue-500"
          aria-label="Back to Leaderboard"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-heading">
            Candidate Comparison Workspace
          </h1>
          <p className="text-xs text-slate-400">
            Compare fit calculations, scores, and signals of selected finalists.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25">
          {candidateCount} of 5 Candidates Selected
        </span>

        {candidateCount < 5 && (
          <button
            onClick={onAddMore}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-glow hover:shadow-neon"
          >
            <Plus size={14} />
            <span>Add Candidate</span>
          </button>
        )}

        <button
          onClick={handleExport}
          disabled={candidateCount === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 disabled:opacity-40 disabled:pointer-events-none text-xs transition-all"
        >
          <Download size={14} />
          <span>Export Report</span>
        </button>

        <button
          onClick={handleShare}
          disabled={candidateCount === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 disabled:opacity-40 disabled:pointer-events-none text-xs transition-all"
        >
          <Share2 size={14} />
          <span>Share Matchup</span>
        </button>

        {candidateCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 text-xs transition-all font-semibold"
          >
            <Trash2 size={14} />
            <span>Clear All</span>
          </button>
        )}
      </div>
    </div>
  );
};
export default ComparisonToolbar;
