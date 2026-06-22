import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Trash2, Clock } from "lucide-react";
import { Conversation, useChatStore } from "../../../store/chatStore";

interface ConversationHistoryProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

const formatTime = (ts: number) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString();
};

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  activeId,
  onSelect,
}) => {
  const { deleteConversation } = useChatStore();

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <MessageSquare size={20} className="text-slate-700" />
        <p className="text-[10px] text-slate-600">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {conversations.map((conv, i) => {
        const isActive = conv.id === activeId;
        const lastMsg = conv.messages.filter((m) => !m.isLoading).at(-1);

        return (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`group relative flex flex-col gap-0.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
              isActive
                ? "bg-blue-500/10 border-blue-500/25 text-blue-300"
                : "border-transparent hover:bg-white/4 text-slate-400"
            }`}
            onClick={() => onSelect(conv.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(conv.id)}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold truncate">
                {conv.candidateName}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-rose-400 shrink-0"
                aria-label="Delete conversation"
              >
                <Trash2 size={11} />
              </button>
            </div>

            {lastMsg && (
              <p className="text-[10px] text-slate-600 truncate leading-relaxed">
                {lastMsg.role === "user" ? "You: " : "AI: "}
                {lastMsg.content.slice(0, 60)}
                {lastMsg.content.length > 60 ? "…" : ""}
              </p>
            )}

            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={9} className="text-slate-700" />
              <span className="text-[9px] text-slate-700">{formatTime(conv.updatedAt)}</span>
              <span className="text-[9px] text-slate-700 ml-auto">
                {conv.messages.filter((m) => !m.isLoading).length} msgs
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ConversationHistory;
