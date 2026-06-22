import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, RefreshCw, Copy, CheckCheck } from "lucide-react";
import { ExplanationResponse } from "../../../types/ranking";

interface InterviewPrepCardProps {
  candidateName?: string;
  explanation?: ExplanationResponse | null;
  skills?: { name: string; proficiency: string }[];
  isLoading?: boolean;
}

interface Question {
  type: "technical" | "behavioral" | "gap";
  question: string;
}

const generateQuestions = (
  explanation: ExplanationResponse | null | undefined,
  skills: { name: string; proficiency: string }[]
): Question[] => {
  const questions: Question[] = [];

  // Gap-probing questions
  const gaps = explanation?.gaps ?? explanation?.weaknesses ?? [];
  gaps.slice(0, 3).forEach((gap) => {
    questions.push({
      type: "gap",
      question: `Can you walk me through a project where ${gap.toLowerCase().replace(/^the candidate lacks |^no evidence of /i, "you demonstrated ")}?`,
    });
  });

  // Technical questions from top expert/advanced skills
  const expertSkills = skills
    .filter((s) => s.proficiency === "expert" || s.proficiency === "advanced")
    .slice(0, 3);
  expertSkills.forEach((skill) => {
    questions.push({
      type: "technical",
      question: `Describe your most complex project involving ${skill.name}. What were the key technical challenges and how did you overcome them?`,
    });
  });

  // Behavioral defaults
  questions.push(
    {
      type: "behavioral",
      question:
        "Tell me about a time you had to influence a decision without direct authority. How did you approach it?",
    },
    {
      type: "behavioral",
      question:
        "Describe a situation where priorities shifted unexpectedly mid-project. How did you adapt?",
    }
  );

  return questions.slice(0, 8);
};

const TYPE_META = {
  technical: { label: "Technical", color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/25" },
  behavioral: { label: "Behavioral", color: "#8b5cf6", bg: "bg-violet-500/10", border: "border-violet-500/25" },
  gap: { label: "Gap Probe", color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/25" },
};

const QuestionCard: React.FC<{ q: Question; idx: number }> = ({ q, idx }) => {
  const [copied, setCopied] = React.useState(false);
  const meta = TYPE_META[q.type];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(q.question);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * idx }}
      className="flex gap-3 p-4 rounded-xl border border-white/6 bg-white/2 hover:bg-white/4 group transition-colors"
    >
      {/* Index badge */}
      <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 mt-0.5">
        {idx + 1}
      </span>

      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.bg} ${meta.border}`}
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-300"
            aria-label="Copy question"
          >
            {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{q.question}</p>
      </div>
    </motion.div>
  );
};

const InterviewPrepCard: React.FC<InterviewPrepCardProps> = ({
  explanation,
  skills = [],
  isLoading,
}) => {
  const [seed, setSeed] = React.useState(0);

  const questions = React.useMemo(
    () => generateQuestions(explanation, skills),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [explanation, skills, seed]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
      className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <MessageSquare size={14} className="text-violet-400" />
          </div>
          <span className="text-sm font-bold text-slate-100 tracking-tight">
            Interview Prep Guide
          </span>
        </div>
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 bg-white/4 hover:bg-white/8 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      <div className="p-6 flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-slate-800/60 animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))
        ) : questions.length > 0 ? (
          questions.map((q, i) => <QuestionCard key={`${seed}-${i}`} q={q} idx={i} />)
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageSquare size={28} className="text-slate-700" />
            <p className="text-sm text-slate-500">
              Run a JD analysis to generate tailored interview questions.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InterviewPrepCard;
