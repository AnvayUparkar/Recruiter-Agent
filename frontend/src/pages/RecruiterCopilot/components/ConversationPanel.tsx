import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";
import { ChatMessage } from "../../../store/chatStore";
import AIResponseCard from "./AIResponseCard";
import TypingIndicator from "./TypingIndicator";

interface ConversationPanelProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

const UserBubble: React.FC<{ message: ChatMessage }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="flex gap-3 justify-end"
  >
    <div className="max-w-[75%]">
      <div className="bg-gradient-to-br from-blue-600 to-violet-700 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-lg shadow-blue-500/15">
        {message.content}
      </div>
      <p className="text-[10px] text-text-disabled mt-1 mr-1 text-right">
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
    <div className="w-7 h-7 rounded-full bg-surface-hover border border-border flex items-center justify-center shrink-0 mt-1">
      <User size={13} className="text-text-muted" />
    </div>
  </motion.div>
);

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
  isLoading,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center">
          <span className="text-2xl">🤖</span>
        </div>
        <p className="text-sm text-text-muted max-w-xs leading-relaxed">
          Select a candidate and ask anything about them. I'll provide AI-grounded hiring insights.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-5 px-4 py-5 scroll-smooth">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} message={msg} />
          ) : (
            <AIResponseCard
              key={msg.id}
              message={msg}
              isLatest={idx === messages.length - 1}
            />
          )
        )}
      </AnimatePresence>

      {/* Typing indicator when loading */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shrink-0 mt-1">
              <span className="text-white text-[10px]">🤖</span>
            </div>
            <TypingIndicator />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
};

export default ConversationPanel;
