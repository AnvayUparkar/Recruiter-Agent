import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, GitCompare, FileText, Bookmark, Copy, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SuggestedActionsProps {
  candidateId?: string;
  onAsk?: (prompt: string) => void;
  onCopySummary?: () => void;
}

const SuggestedActions: React.FC<SuggestedActionsProps> = ({
  candidateId,
  onAsk,
  onCopySummary,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: "profile",
      icon: ExternalLink,
      label: "Open Full Profile",
      color: "#3b82f6",
      onClick: () => candidateId && navigate(`/candidates/${candidateId}`),
      disabled: !candidateId,
    },
    {
      id: "compare",
      icon: GitCompare,
      label: "Compare Candidates",
      color: "#8b5cf6",
      onClick: () => navigate("/comparison"),
      disabled: false,
    },
    {
      id: "report",
      icon: FileText,
      label: "Generate Report",
      color: "#10b981",
      onClick: () => navigate("/reports"),
      disabled: false,
    },
    {
      id: "another",
      icon: MessageSquare,
      label: "Ask Another Question",
      color: "#f59e0b",
      onClick: () => onAsk?.("What else should I know about this candidate?"),
      disabled: !onAsk,
    },
    {
      id: "copy",
      icon: Copy,
      label: "Copy Summary",
      color: "#06b6d4",
      onClick: onCopySummary,
      disabled: !onCopySummary,
    },
    {
      id: "bookmark",
      icon: Bookmark,
      label: "Bookmark",
      color: "#ec4899",
      onClick: () => {
        /* future: bookmark API */
      },
      disabled: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface backdrop-blur-xl overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Suggested Actions
        </span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileHover={!action.disabled ? { scale: 1.03, y: -1 } : undefined}
              whileTap={!action.disabled ? { scale: 0.97 } : undefined}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                action.disabled
                  ? "border-border text-text-disabled cursor-not-allowed"
                  : "border-border text-text-muted hover:text-text-primary hover:bg-surface-hover cursor-pointer"
              }`}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: action.disabled ? "rgba(255,255,255,0.04)" : `${action.color}15`,
                }}
              >
                <Icon size={12} style={{ color: action.disabled ? "#475569" : action.color } as React.CSSProperties} />
              </div>
              {action.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedActions;
