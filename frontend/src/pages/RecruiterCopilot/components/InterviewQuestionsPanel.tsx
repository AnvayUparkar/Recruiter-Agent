import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  Copy,
  CheckCheck,
  Download,
  FileText,
  RefreshCw,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { GeneratedQuestionsResponse, InterviewQuestion } from "../../../services/interviewQuestionService";

// Fallback questions to display if Gemini fails or is not yet run
const STATIC_FALLBACK_QUESTIONS: GeneratedQuestionsResponse = {
  technical: [
    {
      question: "Describe a complex technical system you designed end-to-end.",
      reason: "Assess candidate's software engineering design depth and architectural capabilities.",
      difficulty: "Hard",
      category: "System Design",
      follow_up: "What bottlenecks did you encounter, and how did you scale around them?"
    },
    {
      question: "How do you approach debugging production incidents?",
      reason: "Evaluate problem solving skills under stress and incident handling experience.",
      difficulty: "Medium",
      category: "Incident Response",
      follow_up: "What tools and metrics do you rely on during live post-mortems?"
    },
    {
      question: "Walk me through your code review process.",
      reason: "Understand collaboration patterns and commitment to maintaining code quality.",
      difficulty: "Easy",
      category: "Quality Assurance",
      follow_up: "How do you handle disagreements about design decisions during reviews?"
    },
    {
      question: "What is your strategy for optimizing performance bottlenecks in a web application?",
      reason: "Understand developer profile in troubleshooting and micro-optimization.",
      difficulty: "Medium",
      category: "Performance Optimization",
      follow_up: "How do you measure rendering speed vs network latencies?"
    },
    {
      question: "How do you approach writing clean, maintainable unit and integration tests?",
      reason: "Assess reliability and code coverage focus.",
      difficulty: "Easy",
      category: "Testing",
      follow_up: "How do you mock external API dependencies?"
    }
  ],
  behavioral: [
    {
      question: "Tell me about a project that didn't go as planned.",
      reason: "Examine accountability, post-mortem attitude, and adaptability.",
      difficulty: "Medium",
      category: "Adaptability",
      follow_up: "What would you do differently if you had to start over today?"
    },
    {
      question: "How do you handle conflicting priorities or sudden requirement changes?",
      reason: "Check resilience, organization, and stakeholder communication.",
      difficulty: "Easy",
      category: "Time Management",
      follow_up: "Can you share a specific scenario where you had to push back on a deadline?"
    },
    {
      question: "Describe a time you influenced without authority to steer a project.",
      reason: "Evaluate communication, leadership influence, and peer respect.",
      difficulty: "Hard",
      category: "Influence",
      follow_up: "How did you handle stakeholders who were initially skeptical?"
    },
    {
      question: "Describe a conflict you had with a team member and how you resolved it.",
      reason: "Evaluate interpersonal conflict resolution skills.",
      difficulty: "Medium",
      category: "Conflict Resolution",
      follow_up: "How did you maintain a professional working relationship afterwards?"
    },
    {
      question: "Tell me about a time you had to learn a new tool or technology quickly.",
      reason: "Assess continuous learning and agility.",
      difficulty: "Easy",
      category: "Continuous Learning",
      follow_up: "How did you validate your understanding of this new technology?"
    }
  ],
  leadership: [
    {
      question: "How have you grown or mentored other engineers on your team?",
      reason: "Evaluate contribution to culture, knowledge sharing, and peer growth.",
      difficulty: "Medium",
      category: "Mentorship",
      follow_up: "What specific methodologies do you use to measure their growth?"
    },
    {
      question: "Describe your approach to delivering critical feedback to team members.",
      reason: "Check radical candor, empathy, and managerial readiness.",
      difficulty: "Hard",
      category: "Feedback Delivery",
      follow_up: "How did you follow up to ensure they acted on the feedback?"
    },
    {
      question: "How do you align a team around a technical roadmap or vision?",
      reason: "Assess strategic planning and alignment capabilities.",
      difficulty: "Hard",
      category: "Technical Vision",
      follow_up: "How do you handle team members who disagree with the roadmap?"
    }
  ],
  risk_validation: [
    {
      question: "Walk me through any gaps in your employment history or career transitions.",
      reason: "Verify CV consistency and reliability profile flags in a friendly manner.",
      difficulty: "Easy",
      category: "Career Gaps",
      follow_up: "How did you keep your skills updated during this transitional period?"
    },
    {
      question: "Describe your most challenging stakeholder situation and how you navigated it.",
      reason: "Understand candidate's approach to alignment and stress management.",
      difficulty: "Medium",
      category: "Stakeholder Alignment",
      follow_up: "What was the long-term impact on your partnership with that stakeholder?"
    },
    {
      question: "Tell me about a time you had to work with incomplete specifications or ambiguous requirements.",
      reason: "Assess tolerance for ambiguity and proactive design capabilities.",
      difficulty: "Medium",
      category: "Ambiguity Handling",
      follow_up: "How did you align with the product owners to validate assumptions?"
    }
  ]
};

const LOADING_MESSAGES = [
  "Analyzing candidate profile...",
  "Reviewing candidate declared skills...",
  "Evaluating leadership competency index...",
  "Running reliability risk audit...",
  "Synthesizing customized interview questions via Gemini...",
  "Formatting structured follow-ups and rationales...",
  "Almost ready..."
];

interface InterviewQuestionsPanelProps {
  questions: GeneratedQuestionsResponse | null;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  hasGenerated: boolean;
}

const InterviewQuestionsPanel: React.FC<InterviewQuestionsPanelProps> = ({
  questions,
  isGenerating,
  error,
  onGenerate,
  hasGenerated
}) => {
  const [openCategory, setOpenCategory] = useState<string | null>("technical");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [pdfAlert, setPdfAlert] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Rotate loading text
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setLoadingMsgIdx(0);
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Determine active questions set
  const activeQuestions = questions || (error ? STATIC_FALLBACK_QUESTIONS : null);

  const categories = [
    { id: "technical", label: "Technical Questions", color: "#4F7CFF", textClass: "text-brandBlue", badgeBg: "bg-brandBlue/10 text-brandBlue border-brandBlue/20", icon: "⚡", list: activeQuestions?.technical || [] },
    { id: "behavioral", label: "Behavioral Questions", color: "#A855F7", textClass: "text-brandPurple", badgeBg: "bg-brandPurple/10 text-brandPurple border-brandPurple/20", icon: "🎯", list: activeQuestions?.behavioral || [] },
    { id: "leadership", label: "Leadership Questions", color: "#10B981", textClass: "text-success", badgeBg: "bg-success/10 text-success border-success/20", icon: "👑", list: activeQuestions?.leadership || [] },
    { id: "risk_validation", label: "Risk Validation Questions", color: "#F59E0B", textClass: "text-warning", badgeBg: "bg-warning/10 text-warning border-warning/20", icon: "🛡️", list: activeQuestions?.risk_validation || [] },
  ];

  const handleCopyQuestion = async (q: InterviewQuestion, id: string) => {
    const text = `Question: ${q.question}\nCategory: ${q.category} (${q.difficulty})\nRationale: ${q.reason}\nFollow-up: ${q.follow_up}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateMarkdownString = (filterCatId?: string): string => {
    if (!activeQuestions) return "";
    let md = `# Interview Questions Report\n\n`;
    if (questions) {
      md += `*Generated by Gemini AI on ${questions.generated_at || new Date().toLocaleString()}*\n\n`;
    } else {
      md += `*Static fallback templates loaded*\n\n`;
    }

    const categoriesToExport = filterCatId 
      ? categories.filter(c => c.id === filterCatId)
      : categories;

    categoriesToExport.forEach((cat) => {
      md += `## ${cat.label} (${cat.list.length} Questions)\n\n`;
      cat.list.forEach((q, idx) => {
        md += `### ${idx + 1}. ${q.question}\n`;
        md += `- **Difficulty:** ${q.difficulty}\n`;
        md += `- **Topic/Category:** ${q.category}\n`;
        md += `- **Why Ask This:** ${q.reason}\n`;
        md += `- **Follow-up:** ${q.follow_up}\n\n`;
      });
    });

    return md;
  };

  const handleCopySection = async (catId: string) => {
    const text = generateMarkdownString(catId);
    await navigator.clipboard.writeText(text);
    setCopiedSection(catId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyAll = async () => {
    const text = generateMarkdownString();
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownString();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `interview_questions_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdfTrigger = () => {
    setPdfAlert(true);
    setTimeout(() => setPdfAlert(false), 5000);
  };

  const getDifficultyBadgeColor = (diff: string) => {
    switch ((diff || "").toLowerCase()) {
      case "easy":
        return "bg-success/10 text-success border-success/20";
      case "hard":
        return "bg-danger/10 text-danger border-danger/20";
      default:
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Export Notification */}
      <AnimatePresence>
        {pdfAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs leading-relaxed shadow-lg"
          >
            <AlertCircle size={15} className="shrink-0 text-warning" />
            <div>
              <span className="font-bold">PDF Export Optimization:</span> PDF downloads are currently disabled. Please use the **"Export Markdown"** option, or print the page directly using your browser's Print dialog.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="rounded-2xl border border-border bg-surface backdrop-blur-xl overflow-hidden shadow-md">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
              <HelpCircle size={15} className="text-accent" />
            </div>
            <div>
              <span className="text-sm font-bold text-text-primary block">Personalized Interview Copilot</span>
              <span className="text-[10px] text-text-muted">Generate structural interview questions dynamically</span>
            </div>
          </div>

          {activeQuestions && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all text-xs font-semibold"
              >
                {copiedAll ? (
                  <>
                    <CheckCheck size={12} className="text-success" />
                    <span>Copied All!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy All</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all text-xs font-semibold"
              >
                <Download size={12} />
                <span>Export MD</span>
              </button>
              <button
                onClick={handlePdfTrigger}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all text-xs font-semibold"
              >
                <FileText size={12} />
                <span>Export PDF</span>
              </button>
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-all text-xs font-semibold disabled:opacity-50"
              >
                <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                <span>Regenerate</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic States */}
        <div className="p-4">
          {!hasGenerated && !isGenerating && !error && (
            <div className="flex flex-col items-center justify-center p-10 text-center gap-4 border border-dashed border-border rounded-xl bg-surface/30">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                <Sparkles size={20} className="text-accent animate-pulse" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-text-primary mb-1">Generate Interview Questions</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Analyze the candidate's resume, skills, experience, and risk flags to synthesize 16 unique interview questions tailored precisely to this candidate profile.
                </p>
              </div>
              <button
                onClick={onGenerate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-all text-xs font-bold shadow-lg shadow-accent/25 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Generate Questions</span>
              </button>
            </div>
          )}

          {/* Loading state with Rotating text and Skeletons */}
          {isGenerating && (
            <div className="flex flex-col gap-6 py-6">
              {/* Rotating Message */}
              <div className="flex flex-col items-center text-center gap-2">
                <RefreshCw className="animate-spin text-accent mb-1" size={24} />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMsgIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs font-semibold text-text-primary tracking-wide"
                  >
                    {LOADING_MESSAGES[loadingMsgIdx]}
                  </motion.p>
                </AnimatePresence>
                <span className="text-[10px] text-text-muted">Calling Gemini API...</span>
              </div>

              {/* Skeleton loading elements */}
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="border border-border bg-surface-hover/20 rounded-xl p-4 flex flex-col gap-2.5 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-1/4 bg-border rounded" />
                      <div className="h-4 w-12 bg-border rounded-full" />
                    </div>
                    <div className="h-3 w-5/6 bg-border rounded" />
                    <div className="h-3 w-4/6 bg-border rounded" />
                    <div className="h-3 w-1/2 bg-border rounded mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner when Gemini fails */}
          {error && !isGenerating && (
            <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs shadow-md">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Gemini API Error</span>
                  <p className="leading-relaxed">
                    {error}. Fallback static interview question templates have been loaded for your convenience.
                  </p>
                </div>
              </div>
              <button
                onClick={onGenerate}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-all font-bold font-mono border border-danger/30 cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Retry Connection</span>
              </button>
            </div>
          )}

          {/* Questions display */}
          {activeQuestions && !isGenerating && (
            <div className="flex flex-col gap-2.5 divide-y divide-border">
              {categories.map((cat) => (
                <div key={cat.id} className="pt-2.5 first:pt-0">
                  {/* Category Toggle button */}
                  <button
                    onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
                    className="w-full flex items-center justify-between py-2 hover:bg-surface-hover/30 px-3 rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold">
                      <span>{cat.icon}</span>
                      <span className={cat.textClass}>{cat.label}</span>
                      <span className="text-text-muted">({cat.list.length})</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {cat.list.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySection(cat.id);
                          }}
                          className="px-2 py-1 rounded hover:bg-surface border border-border text-[10px] text-text-muted hover:text-text-primary transition-all font-semibold flex items-center gap-1"
                        >
                          {copiedSection === cat.id ? (
                            <>
                              <CheckCheck size={10} className="text-success" />
                              <span>Copied Section</span>
                            </>
                          ) : (
                            <>
                              <Copy size={10} />
                              <span>Copy Section</span>
                            </>
                          )}
                        </button>
                      )}
                      <ChevronDown
                        size={14}
                        className={`text-text-muted transition-transform ${openCategory === cat.id ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {/* Expandable list of questions */}
                  <AnimatePresence initial={false}>
                    {openCategory === cat.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 flex flex-col gap-3">
                          {cat.list.length === 0 ? (
                            <p className="text-xs text-text-disabled py-2 italic pl-4">No questions available in this category.</p>
                          ) : (
                            cat.list.map((q, idx) => {
                              const qId = `${cat.id}-${idx}`;
                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="p-4 rounded-xl border border-border bg-surface/30 hover:bg-surface/60 transition-colors flex flex-col gap-2.5 relative group"
                                >
                                  {/* Top line: index, category and difficulty badge */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-text-muted">#{idx + 1}</span>
                                      {q.category && (
                                        <span className="text-[10px] font-bold text-text-muted px-2 py-0.5 rounded-md bg-surface border border-border uppercase tracking-wide">
                                          {q.category}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyBadgeColor(q.difficulty)}`}>
                                        {q.difficulty}
                                      </span>
                                      <button
                                        onClick={() => handleCopyQuestion(q, qId)}
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-surface border border-transparent hover:border-border text-text-muted hover:text-text-primary"
                                        title="Copy question details"
                                      >
                                        {copiedId === qId ? (
                                          <CheckCheck size={11} className="text-success" />
                                        ) : (
                                          <Copy size={11} />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Question Text */}
                                  <p className="text-xs font-bold text-text-primary leading-relaxed pl-1 pr-6">
                                    {q.question}
                                  </p>

                                  {/* Rationale and Follow up */}
                                  <div className="pl-1 pt-1 border-t border-border/40 flex flex-col gap-1.5 text-xs">
                                    {q.reason && (
                                      <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-0.5">Recruiter Rationale:</span>
                                        <p className="text-text-muted leading-relaxed">{q.reason}</p>
                                      </div>
                                    )}
                                    {q.follow_up && (
                                      <div className="mt-1 bg-surface-hover/20 p-2.5 rounded-lg border border-border/30">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-0.5">Deep-Dive Follow-up:</span>
                                        <p className="text-text-primary font-medium leading-relaxed italic">"{q.follow_up}"</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewQuestionsPanel;
