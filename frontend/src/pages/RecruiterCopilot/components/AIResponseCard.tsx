import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ChevronDown, Copy, CheckCheck } from "lucide-react";
import { ChatMessage, SourcePill } from "../../../store/chatStore";
import StreamingMessage from "./StreamingMessage";
import TypingIndicator from "./TypingIndicator";

interface AIResponseCardProps {
  message: ChatMessage;
  isLatest?: boolean;
}

const SOURCE_COLORS: Record<string, { color: string; bg: string }> = {
  "Ranking Engine":   { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  "Reliability Audit":{ color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  "Behavior Analysis":{ color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  "JD Analysis":      { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Profile Data":     { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
};

const SourceTag: React.FC<{ pill: SourcePill }> = ({ pill }) => {
  const meta = SOURCE_COLORS[pill.label] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ color: meta.color, backgroundColor: meta.bg, borderColor: `${meta.color}30` }}
    >
      {pill.icon} {pill.label}
    </span>
  );
};

/** Lightweight markdown renderer — supports bold, bullets, numbered lists, headings */
const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-text-primary mt-3 mb-1">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-text-primary mt-4 mb-1">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-sm text-text-muted leading-relaxed">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span>{applyInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1] ?? "";
      elements.push(
        <div key={i} className="flex items-start gap-2.5 text-sm text-text-muted leading-relaxed">
          <span className="font-bold text-blue-400 shrink-0 w-4 text-right">{num}.</span>
          <span>{applyInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-text-muted leading-relaxed">
          {applyInline(line)}
        </p>
      );
    }
  });

  return elements;
};

const applyInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-text-primary">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
};

const AIResponseCard: React.FC<AIResponseCardProps> = ({ message, isLatest }) => {
  const [copied, setCopied] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [streamed, setStreamed] = useState(!isLatest);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  if (message.isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shrink-0 mt-1">
          <Bot size={13} className="text-white" />
        </div>
        <TypingIndicator />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex gap-3 group"
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shrink-0 mt-1">
        <Bot size={13} className="text-white" />
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-sm border border-border bg-surface backdrop-blur-xl overflow-hidden shadow-sm">
          {/* Content */}
          <div className="p-4 flex flex-col gap-1.5">
            {isLatest && !streamed ? (
              <StreamingMessage content={message.content} onComplete={() => setStreamed(true)} />
            ) : (
              <div className="flex flex-col gap-1.5">{renderMarkdown(message.content)}</div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 flex items-center justify-between gap-2 flex-wrap border-t border-border">
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {message.sources.map((s, i) => <SourceTag key={i} pill={s} />)}
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary transition-colors"
                aria-label="Copy response"
              >
                {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
              {message.sources && message.sources.length > 0 && (
                <button
                  onClick={() => setReasoningOpen((v) => !v)}
                  className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary transition-colors"
                >
                  <ChevronDown size={12} className={`transition-transform ${reasoningOpen ? "rotate-180" : ""}`} />
                  {reasoningOpen ? "Hide" : "Why?"}
                </button>
              )}
            </div>
          </div>

          {/* Reasoning panel */}
          <AnimatePresence>
            {reasoningOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 border-t border-border">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2">Data Sources</p>
                  <div className="flex flex-col gap-1">
                    {message.sources?.map((s, i) => (
                      <div key={i} className="text-xs text-text-muted flex items-center gap-2">
                        <span>{s.icon}</span>
                        <span>{s.label} — contributed to this analysis</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Timestamp */}
        <p className="text-[10px] text-text-disabled mt-1 ml-2">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
};

export default AIResponseCard;
