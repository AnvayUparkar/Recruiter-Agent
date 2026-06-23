import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Plus, RefreshCw, AlertTriangle } from "lucide-react";

import { useAppStore } from "../../store/appStore";
import { useCandidateStore } from "../../store/candidateStore";
import { useChatStore, SourcePill } from "../../store/chatStore";
import { useCopilotReport, useHiringDecision } from "../../hooks/queries/useCopilot";
import { useRanking } from "../../hooks/queries/useRanking";
import { useCandidateDetails } from "../../hooks/queries/useCandidate";
import { RecruiterReport } from "../../types/copilot";
import { interviewQuestionService, GeneratedQuestionsResponse } from "../../services/interviewQuestionService";

import CopilotChatLayout from "./components/CopilotChatLayout";
import CandidateContextCard from "./components/CandidateContextCard";
import ConversationPanel from "./components/ConversationPanel";
import ConversationHistory from "./components/ConversationHistory";
import PromptComposer from "./components/PromptComposer";
import QuickPromptBar from "./components/QuickPromptBar";
import PromptSuggestions from "./components/PromptSuggestions";
import HiringDecisionPanel from "./components/HiringDecisionPanel";
import StrengthWeaknessPanel from "./components/StrengthWeaknessPanel";
import InterviewQuestionsPanel from "./components/InterviewQuestionsPanel";
import SuggestedActions from "./components/SuggestedActions";
import ExportConversationButton from "./components/ExportConversationButton";

// ─── Intent → response builder ────────────────────────────────────────────────

const REPORT_SOURCES: SourcePill[] = [
  { label: "Ranking Engine", icon: "📊" },
  { label: "Reliability Audit", icon: "🛡" },
  { label: "Behavior Analysis", icon: "📈" },
];

const JD_SOURCES: SourcePill[] = [
  { label: "JD Analysis", icon: "📋" },
  { label: "Profile Data", icon: "👤" },
];

/**
 * Maps a free-form prompt to a formatted AI response using cached report data.
 * Returns null if no data is available for the intent.
 */
const buildResponse = (
  prompt: string,
  report: RecruiterReport | undefined
): { content: string; sources: SourcePill[] } | null => {
  if (!report) return null;

  const p = prompt.toLowerCase();
  const rec = report.hire_recommendation ?? (report as any).hireRecommendation;

  // INTENT: ranking explanation
  if (p.includes("ranked") || p.includes("why") || p.includes("recommend") || p.includes("reason")) {
    const summary = report.recruiter_summary ?? (report as any).recruiterSummary ?? "";
    return {
      content: `## Why This Candidate Was Recommended\n\n${summary}\n\n**Recommendation:** ${rec?.recommendation ?? "See report"}\n\n**Confidence:** ${Math.round((rec?.confidence ?? 0) * 100)}%`,
      sources: REPORT_SOURCES,
    };
  }

  // INTENT: summarize
  if (p.includes("summar") || p.includes("profile") || p.includes("overview") || p.includes("brief")) {
    const summary = report.recruiter_summary ?? (report as any).recruiterSummary ?? "No summary available.";
    const assessment = (report as any).overallAssessment ?? "";
    return {
      content: `## Executive Profile Summary\n\n${summary}${assessment ? `\n\n${assessment}` : ""}`,
      sources: JD_SOURCES,
    };
  }

  // INTENT: risks
  if (p.includes("risk") || p.includes("concern") || p.includes("flag") || p.includes("worry")) {
    const risks = report.risks ?? [];
    const weaknesses = report.weaknesses ?? [];
    const allRisks = [...risks, ...weaknesses].filter(Boolean);
    if (!allRisks.length) {
      return {
        content: "## Risk Assessment\n\nNo significant risks identified for this candidate based on available data.",
        sources: REPORT_SOURCES,
      };
    }
    const lines = allRisks.map((r) => `- ${r}`).join("\n");
    return {
      content: `## Key Hiring Risks\n\nThe following areas warrant closer examination during the interview process:\n\n${lines}`,
      sources: REPORT_SOURCES,
    };
  }

  // INTENT: strengths
  if (p.includes("strength") || p.includes("strong") || p.includes("excel") || p.includes("good")) {
    const strengths = report.strengths ?? [];
    if (!strengths.length) {
      return {
        content: "## Candidate Strengths\n\nStrengths data is being compiled. Please run a full ranking evaluation to generate this report.",
        sources: REPORT_SOURCES,
      };
    }
    const lines = strengths.map((s) => `- ${s}`).join("\n");
    return {
      content: `## Core Strengths\n\nThis candidate demonstrates the following key strengths:\n\n${lines}`,
      sources: REPORT_SOURCES,
    };
  }

  // INTENT: technical interview questions
  if (p.includes("technical") && (p.includes("question") || p.includes("interview"))) {
    const focus = report.interviewFocus ?? (report as any).interview_focus ?? [];
    const techFocus = focus.slice(0, 3);
    const questions = [
      "Describe a large-scale system you architected from scratch. What trade-offs did you make?",
      techFocus[0] ? `Walk me through a project involving ${techFocus[0]}.` : "Explain a complex debugging scenario you resolved in production.",
      techFocus[1] ? `How do you approach ${techFocus[1]} at scale?` : "How do you ensure code quality and maintainability in fast-moving teams?",
      "What does your ideal technical review process look like?",
    ];
    return {
      content: `## Technical Interview Questions\n\nBased on this candidate's profile and the job requirements:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
      sources: JD_SOURCES,
    };
  }

  // INTENT: behavioral interview questions
  if (p.includes("behavioral") && (p.includes("question") || p.includes("interview"))) {
    const questions = [
      "Tell me about a time a project failed. What was your role and what did you learn?",
      "Describe a situation where you had to influence a decision without authority.",
      "How do you prioritize when everything is urgent? Give a recent example.",
      "Tell me about the most difficult stakeholder relationship you managed.",
    ];
    return {
      content: `## Behavioral Interview Questions\n\nTailored for this candidate's profile:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
      sources: JD_SOURCES,
    };
  }

  // INTENT: hire decision / should I hire
  if (p.includes("hire") || p.includes("advance") || p.includes("should i") || p.includes("next round")) {
    const recommendation = rec?.recommendation ?? "Interview";
    const reasoning = rec?.reasoning ?? "Evaluate based on the overall profile and interview performance.";
    const confidence = Math.round((rec?.confidence ?? 0) * 100);
    return {
      content: `## Hiring Recommendation\n\n**Verdict: ${recommendation}**\n\nConfidence: **${confidence}%**\n\n${reasoning}`,
      sources: REPORT_SOURCES,
    };
  }

  // INTENT: JD comparison
  if (p.includes("jd") || p.includes("job description") || p.includes("compare") || p.includes("requirement") || p.includes("match")) {
    const strengths = (report.strengths ?? []).slice(0, 3);
    const gaps = (report.weaknesses ?? []).slice(0, 3);
    const matchText = strengths.length
      ? `**JD Alignment Highlights:**\n${strengths.map((s) => `- ✓ ${s}`).join("\n")}`
      : "";
    const gapText = gaps.length
      ? `\n\n**Areas of Misalignment:**\n${gaps.map((g) => `- △ ${g}`).join("\n")}`
      : "";
    return {
      content: `## JD vs Candidate Analysis\n\n${matchText}${gapText}`,
      sources: [...REPORT_SOURCES, ...JD_SOURCES],
    };
  }

  // INTENT: reliability
  if (p.includes("reliab") || p.includes("trust") || p.includes("consistent") || p.includes("fraud")) {
    return {
      content: `## Reliability Analysis\n\nThis candidate's reliability score reflects profile completeness, career consistency, and behavioral engagement patterns on the platform.\n\n**Key factors evaluated:**\n- Profile quality and completeness\n- Career timeline consistency\n- Behavioral responsiveness scores\n- Identity and experience verification signals\n\nFor detailed breakdowns, visit the candidate's full profile page.`,
      sources: [{ label: "Reliability Audit", icon: "🛡" }, { label: "Behavior Analysis", icon: "📈" }],
    };
  }

  // Default: echo the executive summary
  const fallback = report.recruiter_summary ?? (report as any).recruiterSummary;
  if (fallback) {
    return {
      content: `## AI Recruiter Analysis\n\n${fallback}`,
      sources: REPORT_SOURCES,
    };
  }

  return null;
};

// ─── No-JD gate ───────────────────────────────────────────────────────────────

const NoJDGate: React.FC = () => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="max-w-md text-center rounded-2xl border border-border bg-surface backdrop-blur-xl p-10 flex flex-col items-center gap-5 shadow-lg">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center">
        <Bot size={28} className="text-blue-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-text-primary">JD Context Required</h2>
        <p className="text-sm text-text-muted mt-2 leading-relaxed">
          The AI Recruiter Copilot needs an active parsed Job Description to cross-reference candidates and generate grounded insights.
        </p>
      </div>
      <Link
        to="/jd-analysis"
        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
      >
        Analyse Job Description →
      </Link>
    </div>
  </div>
);

// ─── Main page component ───────────────────────────────────────────────────────

const RecruiterCopilotPage: React.FC = () => {
  const { parsedJD } = useAppStore();
  const { selectedCandidateId, setSelectedCandidateId } = useCandidateStore();

  const {
    conversations,
    activeConversationId,
    activeConversation,
    createConversation,
    selectConversation,
    addMessage,
    updateMessage,
  } = useChatStore();

  const [isSending, setIsSending] = useState(false);
  const [contextCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"context" | "history">("context");

  // ── Queries ────────────────────────────────────────────────────────────────
  const jdText = parsedJD?.raw_text ?? parsedJD?.rawText ?? "";

  const { data: rankingData } = useRanking({
    jobDescription: jdText,
    enabled: !!jdText && !selectedCandidateId,
  });

  const { data: candidate, isLoading: isCandidateLoading } = useCandidateDetails(
    selectedCandidateId ?? "",
    !!selectedCandidateId
  );

  const { data: report, isLoading: isReportLoading } = useCopilotReport(
    selectedCandidateId ?? "",
    jdText,
    !!selectedCandidateId && jdText.length >= 20
  );

  const { data: hiringDecision, isLoading: isDecisionLoading } = useHiringDecision(
    selectedCandidateId ?? "",
    jdText,
    !!selectedCandidateId && jdText.length >= 20
  );

  // Ranked data for context card
  const rankedData = useMemo(
    () =>
      rankingData?.rankedCandidates?.find((c) => c.candidateId === selectedCandidateId) ?? null,
    [rankingData, selectedCandidateId]
  );

  // States for dynamic questions generation
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionsResponse | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [hasGeneratedQuestions, setHasGeneratedQuestions] = useState(false);

  // Reset generated questions status when selected candidate changes
  useEffect(() => {
    setGeneratedQuestions(null);
    setHasGeneratedQuestions(false);
    setQuestionsError(null);
  }, [selectedCandidateId]);

  const handleGenerateQuestions = useCallback(async () => {
    if (!candidate || !parsedJD) return;
    setIsGeneratingQuestions(true);
    setQuestionsError(null);
    try {
      const response = await interviewQuestionService.generateInterviewQuestions({
        candidate,
        job_description: parsedJD,
        ranking: rankedData,
        behavior: candidate?.behaviorProfile || hiringDecision,
        reliability: candidate?.reliabilityProfile,
      });
      setGeneratedQuestions(response);
      setHasGeneratedQuestions(true);
    } catch (err: any) {
      console.error("Error generating dynamic questions:", err);
      setQuestionsError(err?.response?.data?.message || err?.message || "Failed to generate dynamic questions");
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [candidate, parsedJD, rankedData, hiringDecision]);

  // Active messages
  const conv = activeConversation();
  const messages = conv?.messages ?? [];

  // ── Auto-select first candidate ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedCandidateId && rankingData?.rankedCandidates?.length) {
      setSelectedCandidateId(rankingData.rankedCandidates[0].candidateId);
    }
  }, [rankingData, selectedCandidateId, setSelectedCandidateId]);

  // ── Auto-create conversation when candidate changes ───────────────────────
  useEffect(() => {
    if (!selectedCandidateId) return;
    const existing = conversations.find(
      (c) => c.candidateId === selectedCandidateId
    );
    if (existing) {
      selectConversation(existing.id);
    } else {
      const candidateName =
        candidate?.profile?.anonymizedName ||
        candidate?.name ||
        selectedCandidateId;
      createConversation(selectedCandidateId, candidateName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCandidateId]);

  // ── Auto-seed greeting when report loads and conversation is empty ────────
  useEffect(() => {
    if (!conv || messages.length > 0 || !report || !selectedCandidateId) return;
    const summary = report.recruiter_summary ?? (report as any).recruiterSummary ?? "";
    if (!summary) return;
    addMessage(conv.id, {
      role: "assistant",
      content: `## Welcome to AI Recruiter Copilot\n\nI've loaded the intelligence report for **${candidate?.profile?.anonymizedName ?? selectedCandidateId}**.\n\n${summary}\n\nWhat would you like to explore?`,
      sources: REPORT_SOURCES,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.recruiter_summary, conv?.id]);

  // ── Prompt dispatch ───────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (promptText: string) => {
      if (!conv || isSending) return;

      setIsSending(true);

      // 1. Add user message
      addMessage(conv.id, { role: "user", content: promptText });

      // 2. Add loading placeholder
      const loadingId = addMessage(conv.id, {
        role: "assistant",
        content: "",
        isLoading: true,
      });

      // 3. Simulate processing delay (avoids UI flicker for cached results)
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

      // 4. Build response from cached report
      const response = buildResponse(promptText, report);

      // 5. Update placeholder with real content
      updateMessage(conv.id, loadingId, {
        isLoading: false,
        content: response?.content ?? "I don't have enough context to answer that yet. Please ensure a Job Description is loaded and the candidate has been evaluated by the ranking engine.",
        sources: response?.sources ?? [],
      });

      setIsSending(false);
    },
    [conv, isSending, report, addMessage, updateMessage]
  );

  const handleCopySummary = useCallback(() => {
    const summary = report?.recruiter_summary ?? (report as any)?.recruiterSummary ?? "";
    if (summary) navigator.clipboard.writeText(summary).catch(() => { });
  }, [report]);

  // ── No JD ─────────────────────────────────────────────────────────────────
  if (!parsedJD) {
    return (
      <div className="flex flex-col min-h-[70vh]">
        <NoJDGate />
      </div>
    );
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const sidebar = (
    <>
      {/* Tab toggle */}
      <div className="flex rounded-xl border border-border bg-surface p-1 gap-1">
        {(["context", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSidebarTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${sidebarTab === tab
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-text-muted hover:text-text-primary"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {sidebarTab === "context" ? (
          <motion.div
            key="context"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Candidate selector */}
            {rankingData?.rankedCandidates && rankingData.rankedCandidates.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface backdrop-blur-xl overflow-hidden">
                <div className="px-4 pt-4 pb-2 border-b border-border">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Candidate Pool
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {rankingData.rankedCandidates.slice(0, 10).map((c) => (
                    <button
                      key={c.candidateId}
                      onClick={() => setSelectedCandidateId(c.candidateId)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-all border ${selectedCandidateId === c.candidateId
                          ? "bg-blue-500/10 border-blue-500/25 text-blue-500"
                          : "border-transparent text-text-muted hover:bg-surface-hover hover:text-text-primary"
                        }`}
                    >
                      <span className="font-semibold truncate max-w-[70%]">
                        #{c.rank} {c.candidateId}
                      </span>
                      <span className="font-black text-[10px]" style={{ color: selectedCandidateId === c.candidateId ? "#60a5fa" : "var(--text-muted)" }}>
                        {Math.round(c.finalScore * 100)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Context card */}
            <CandidateContextCard
              candidate={candidate}
              rankedData={rankedData}
              isLoading={isCandidateLoading}
              collapsed={contextCollapsed}
              onToggleCollapse={undefined}
            />

            {/* Hiring decision */}
            <HiringDecisionPanel
              decision={hiringDecision}
              isLoading={isDecisionLoading && !!selectedCandidateId}
            />

            {/* Suggested actions */}
            <SuggestedActions
              candidateId={selectedCandidateId ?? undefined}
              onAsk={handleSend}
              onCopySummary={report ? handleCopySummary : undefined}
            />
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-surface backdrop-blur-xl p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Chat History
              </span>
              {selectedCandidateId && (
                <button
                  onClick={() => {
                    const name = candidate?.profile?.anonymizedName ?? selectedCandidateId ?? "New Chat";
                    createConversation(selectedCandidateId, name);
                  }}
                  className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  <Plus size={10} />
                  New
                </button>
              )}
            </div>
            <ConversationHistory
              conversations={conversations.filter((c) => c.candidateId === selectedCandidateId)}
              activeId={activeConversationId}
              onSelect={selectConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // ── Chat area ─────────────────────────────────────────────────────────────
  const chat = (
    <div
      className="flex flex-col rounded-2xl border border-border bg-surface backdrop-blur-xl overflow-hidden shadow-sm"
      style={{ minHeight: "600px" }}
    >
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center">
            <Bot size={13} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-text-primary">AI Recruiter Copilot</span>
            {selectedCandidateId && (
              <span className="text-[10px] text-text-muted ml-2">
                {candidate?.profile?.anonymizedName ?? selectedCandidateId}
              </span>
            )}
          </div>
          {(isReportLoading) && (
            <div className="flex items-center gap-1 text-[10px] text-blue-400">
              <RefreshCw size={10} className="animate-spin" />
              Loading report…
            </div>
          )}
        </div>
        <ExportConversationButton
          messages={messages}
          candidateName={candidate?.profile?.anonymizedName ?? selectedCandidateId ?? undefined}
        />
      </div>

      {/* No candidate selected state */}
      {!selectedCandidateId ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
          <AlertTriangle size={28} className="text-text-disabled" />
          <p className="text-sm text-text-muted">
            Select a candidate from the pool to begin the AI analysis.
          </p>
        </div>
      ) : messages.length === 0 && !isSending ? (
        <PromptSuggestions
          onSelect={handleSend}
          candidateName={candidate?.profile?.anonymizedName ?? selectedCandidateId}
        />
      ) : (
        <ConversationPanel messages={messages} isLoading={isSending} />
      )}

      {/* Strengths/Weakness inline (after first response) */}
      {messages.length > 1 && report && (
        <div className="px-4 pb-2">
          <StrengthWeaknessPanel
            strengths={report.strengths?.slice(0, 3)}
            weaknesses={report.weaknesses?.slice(0, 3)}
          />
        </div>
      )}

      {/* Interview questions (shown after report loads) */}
      {messages.length > 0 && report && (
        <div className="px-4 pb-3">
          <InterviewQuestionsPanel
            questions={generatedQuestions}
            isGenerating={isGeneratingQuestions}
            error={questionsError}
            onGenerate={handleGenerateQuestions}
            hasGenerated={hasGeneratedQuestions}
          />
        </div>
      )}

      {/* Quick prompt chips */}
      <QuickPromptBar onSelect={handleSend} disabled={isSending || !selectedCandidateId} />

      {/* Composer */}
      <PromptComposer
        onSend={handleSend}
        isLoading={isSending}
        disabled={!selectedCandidateId}
        placeholder={
          selectedCandidateId
            ? `Ask about ${candidate?.profile?.anonymizedName ?? selectedCandidateId}…`
            : "Select a candidate to begin…"
        }
      />
    </div>
  );

  return (
    <div className="pb-8">
      <CopilotChatLayout sidebar={sidebar} chat={chat} />
    </div>
  );
};

export default RecruiterCopilotPage;
