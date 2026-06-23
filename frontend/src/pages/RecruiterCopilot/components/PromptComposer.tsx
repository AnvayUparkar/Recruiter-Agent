import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, X, CornerDownLeft } from "lucide-react";

interface PromptComposerProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_CHARS = 1200;

const PromptComposer: React.FC<PromptComposerProps> = ({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = "Ask about this candidate or request hiring insights…",
}) => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading && !disabled;
  const charPct = (value.length / MAX_CHARS) * 100;

  return (
    <div className="px-4 pb-4 pt-2">
      <motion.div
        animate={{
          boxShadow: focused
            ? "0 0 0 2px rgba(59,130,246,0.35), 0 4px 24px rgba(59,130,246,0.12)"
            : "0 0 0 1px var(--border)",
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl border border-border bg-surface-hover backdrop-blur-xl overflow-hidden"
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="copilot-prompt-input"
          value={value}
          onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setValue(e.target.value); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          rows={2}
          disabled={isLoading || disabled}
          aria-label="Recruiter prompt input"
          className="w-full bg-transparent px-4 pt-4 pb-12 text-sm text-text-primary placeholder-text-disabled resize-none focus:outline-none leading-relaxed disabled:opacity-50"
        />

        {/* Bottom toolbar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-3">
            {value.length > MAX_CHARS * 0.7 && (
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(charPct, 100)}%`,
                      backgroundColor: charPct > 90 ? "#ef4444" : "#3b82f6",
                    }}
                  />
                </div>
                <span className="text-[10px] text-text-muted">{MAX_CHARS - value.length}</span>
              </div>
            )}
            <span className="text-[10px] text-text-disabled hidden sm:flex items-center gap-1">
              <CornerDownLeft size={10} />
              Ctrl+Enter to send
            </span>
          </div>

          <div className="flex items-center gap-2">
            {value.length > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setValue("")}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                aria-label="Clear input"
              >
                <X size={13} />
              </motion.button>
            )}

            <motion.button
              onClick={handleSend}
              disabled={!canSend}
              whileHover={canSend ? { scale: 1.05 } : undefined}
              whileTap={canSend ? { scale: 0.96 } : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                canSend
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-surface text-text-disabled cursor-not-allowed"
              }`}
              aria-label="Send message"
            >
              <Send size={12} />
              Send
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PromptComposer;
