import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, Copy, CheckCheck } from "lucide-react";

interface QuestionCategory {
  id: string;
  label: string;
  color: string;
  icon: string;
  questions: string[];
}

interface InterviewQuestionsPanelProps {
  technicalQuestions?: string[];
  behavioralQuestions?: string[];
  leadershipQuestions?: string[];
  riskQuestions?: string[];
  focusAreas?: string[];
}

const InterviewQuestionsPanel: React.FC<InterviewQuestionsPanelProps> = ({
  technicalQuestions = [],
  behavioralQuestions = [],
  leadershipQuestions = [],
  riskQuestions = [],
  focusAreas = [],
}) => {
  const [openCategory, setOpenCategory] = useState<string | null>("technical");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories: QuestionCategory[] = [
    {
      id: "technical",
      label: "Technical",
      color: "#3b82f6",
      icon: "⚡",
      questions: technicalQuestions.length
        ? technicalQuestions
        : ["Describe a complex technical system you designed end-to-end.",
           "How do you approach debugging production incidents?",
           "Walk me through your code review process."],
    },
    {
      id: "behavioral",
      label: "Behavioral",
      color: "#8b5cf6",
      icon: "🎯",
      questions: behavioralQuestions.length
        ? behavioralQuestions
        : ["Tell me about a project that didn't go as planned.",
           "How do you handle conflicting priorities?",
           "Describe a time you influenced without authority."],
    },
    {
      id: "leadership",
      label: "Leadership",
      color: "#10b981",
      icon: "👑",
      questions: leadershipQuestions.length
        ? leadershipQuestions
        : ["How have you grown engineers on your team?",
           "Describe your approach to delivering critical feedback."],
    },
    {
      id: "risk",
      label: "Risk Validation",
      color: "#f59e0b",
      icon: "🔍",
      questions: riskQuestions.length
        ? riskQuestions
        : ["Walk me through any gaps in your employment history.",
           "Describe your most challenging stakeholder situation."],
    },
  ].filter((c) => c.questions.length > 0);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <HelpCircle size={14} className="text-violet-400" />
          </div>
          <span className="text-sm font-bold text-slate-100">Interview Questions</span>
        </div>
        {focusAreas.length > 0 && (
          <span className="text-[10px] text-slate-500">{focusAreas[0]}</span>
        )}
      </div>

      <div className="divide-y divide-white/4">
        {categories.map((cat) => (
          <div key={cat.id}>
            {/* Category toggle */}
            <button
              onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors"
              aria-expanded={openCategory === cat.id}
            >
              <span className="flex items-center gap-2 text-xs font-bold">
                <span>{cat.icon}</span>
                <span style={{ color: cat.color }}>{cat.label}</span>
                <span className="text-slate-600">({cat.questions.length})</span>
              </span>
              <ChevronDown
                size={13}
                className={`text-slate-600 transition-transform ${openCategory === cat.id ? "rotate-180" : ""}`}
              />
            </button>

            {/* Questions list */}
            <AnimatePresence>
              {openCategory === cat.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 flex flex-col gap-2">
                    {cat.questions.map((q, i) => {
                      const qId = `${cat.id}-${i}`;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-white/2 border border-white/4 group hover:bg-white/5 transition-colors"
                        >
                          <span
                            className="text-xs font-black w-5 text-right shrink-0 mt-0.5"
                            style={{ color: cat.color }}
                          >
                            {i + 1}.
                          </span>
                          <p className="flex-1 text-xs text-slate-300 leading-relaxed">{q}</p>
                          <button
                            onClick={() => handleCopy(q, qId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-300 shrink-0"
                            aria-label="Copy question"
                          >
                            {copiedId === qId ? (
                              <CheckCheck size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewQuestionsPanel;
