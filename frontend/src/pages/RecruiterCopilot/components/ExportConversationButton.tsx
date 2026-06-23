import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Check, FileText, Type } from "lucide-react";
import { ChatMessage } from "../../../store/chatStore";

interface ExportConversationButtonProps {
  messages: ChatMessage[];
  candidateName?: string;
}

const formatAsMarkdown = (messages: ChatMessage[], name?: string) => {
  const lines = [
    `# AI Recruiter Copilot — ${name ?? "Candidate"} Analysis`,
    `*Exported: ${new Date().toLocaleString()}*`,
    "",
  ];
  messages.forEach((msg) => {
    if (msg.isLoading) return;
    const who = msg.role === "user" ? "**Recruiter**" : "**AI Copilot**";
    lines.push(`## ${who}`);
    lines.push(msg.content);
    lines.push("");
  });
  return lines.join("\n");
};

const formatAsText = (messages: ChatMessage[], name?: string) => {
  const lines = [
    `AI Recruiter Copilot — ${name ?? "Candidate"} Analysis`,
    `Exported: ${new Date().toLocaleString()}`,
    "=".repeat(60),
    "",
  ];
  messages.forEach((msg) => {
    if (msg.isLoading) return;
    const who = msg.role === "user" ? "RECRUITER" : "AI COPILOT";
    lines.push(`[${who}]`);
    lines.push(msg.content);
    lines.push("");
  });
  return lines.join("\n");
};

const download = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const ExportConversationButton: React.FC<ExportConversationButtonProps> = ({
  messages,
  candidateName,
}) => {
  const [exported, setExported] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleExport = (format: "markdown" | "text") => {
    if (!messages.length) return;
    const slug = candidateName?.toLowerCase().replace(/\s+/g, "_") ?? "candidate";
    if (format === "markdown") {
      download(formatAsMarkdown(messages, candidateName), `copilot_${slug}.md`, "text/markdown");
    } else {
      download(formatAsText(messages, candidateName), `copilot_${slug}.txt`, "text/plain");
    }
    setExported(true);
    setMenuOpen(false);
    setTimeout(() => setExported(false), 2500);
  };

  if (!messages.filter((m) => !m.isLoading).length) return null;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setMenuOpen((v) => !v)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text-muted hover:text-text-primary transition-all"
      >
        <AnimatePresence mode="wait">
          {exported ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check size={12} className="text-emerald-400" />
            </motion.span>
          ) : (
            <motion.span key="dl" initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Download size={12} />
            </motion.span>
          )}
        </AnimatePresence>
        {exported ? "Exported!" : "Export"}
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 z-50 rounded-xl border border-border bg-surface shadow-lg overflow-hidden w-36"
          >
            <button
              onClick={() => handleExport("markdown")}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-text-muted hover:bg-surface-hover transition-colors"
            >
              <FileText size={12} className="text-blue-400" />
              Markdown
            </button>
            <button
              onClick={() => handleExport("text")}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-text-muted hover:bg-surface-hover transition-colors"
            >
              <Type size={12} className="text-slate-400" />
              Plain Text
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportConversationButton;
