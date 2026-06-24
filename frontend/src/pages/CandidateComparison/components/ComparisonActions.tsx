import React from "react";
import { useNavigate } from "react-router-dom";
import { User, MessageSquare, FileText, Bookmark } from "lucide-react";

interface ComparisonActionsProps {
  candidateId: string;
  candidateName: string;
}

export const ComparisonActions: React.FC<ComparisonActionsProps> = ({
  candidateId,
  candidateName,
}) => {
  const navigate = useNavigate();

  const handleOpenProfile = () => {
    navigate(`/candidates/${candidateId}`);
  };

  const handleOpenCopilot = () => {
    navigate(`/copilot`, { state: { candidateId } });
  };

  const handleGenerateReport = () => {
    alert(`Generating recruiter briefing dossier for ${candidateName}...`);
  };

  const handleBookmark = () => {
    alert(`Bookmarked candidate ${candidateName} for executive interview panel.`);
  };

  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl glass-panel border-border bg-surface shadow-sm mt-4">
      <span className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">
        Candidate Actions
      </span>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleOpenProfile}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border hover:bg-surface-hover text-primary text-[11px] font-semibold transition-all"
        >
          <User size={12} />
          <span>View Profile</span>
        </button>

        <button
          onClick={handleOpenCopilot}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/15 border border-blue-500/20 hover:bg-blue-600/25 text-blue-400 text-[11px] font-semibold transition-all"
        >
          <MessageSquare size={12} />
          <span>Ask Copilot</span>
        </button>

        <button
          onClick={handleGenerateReport}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-muted text-[11px] font-semibold transition-all"
        >
          <FileText size={12} />
          <span>Dossier</span>
        </button>

        <button
          onClick={handleBookmark}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-muted text-[11px] font-semibold transition-all"
        >
          <Bookmark size={12} />
          <span>Bookmark</span>
        </button>
      </div>
    </div>
  );
};
export default ComparisonActions;
