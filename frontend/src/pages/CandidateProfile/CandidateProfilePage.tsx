import React, { useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  LayoutGrid,
  User,
  ShieldCheck,
  Brain,
} from "lucide-react";

import { useAppStore } from "../../store/appStore";
import { useRankingStore } from "../../store/rankingStore";
import { useCandidateDetails, useCandidateExplanation } from "../../hooks/queries/useCandidate";
import PageLoader from "../../components/common/loading/PageLoader";

import CandidateHeader from "./components/CandidateHeader";
import AIExecutiveSummary from "./components/AIExecutiveSummary";
import ScoreBreakdown from "./components/ScoreBreakdown";
import SkillCoverage from "./components/SkillCoverage";
import CareerTimeline from "./components/CareerTimeline";
import EducationSection from "./components/EducationSection";
import ProjectsSection from "./components/ProjectsSection";
import BehaviorInsights from "./components/BehaviorInsights";
import ReliabilityPanel from "./components/ReliabilityPanel";
import { StrengthsCard, GapAnalysisCard } from "./components/StrengthsGapCards";
import RecommendationCard from "./components/RecommendationCard";
import InterviewPrepCard from "./components/InterviewPrepCard";
import RecruiterNotes from "./components/RecruiterNotes";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = "overview" | "experience" | "intelligence" | "interview";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "experience", label: "Experience", icon: User },
  { id: "intelligence", label: "AI Intelligence", icon: Brain },
  { id: "interview", label: "Interview Prep", icon: ShieldCheck },
];

// ─── Helper: export JSON ───────────────────────────────────────────────────────
const exportProfile = (data: object, candidateId: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candidate_${candidateId}_dossier.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Tab content panels ────────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  candidate: ReturnType<typeof useCandidateDetails>["data"];
  explanation: ReturnType<typeof useCandidateExplanation>["data"];
  rankedData: any;
  jdRequired: string[];
  jdPreferred: string[];
  isExplainLoading: boolean;
}> = ({ candidate, explanation, rankedData, jdRequired, jdPreferred, isExplainLoading }) => (
  <div className="flex flex-col gap-5">
    <RecommendationCard rankedData={rankedData} explanation={explanation} />
    <AIExecutiveSummary explanation={explanation} isLoading={isExplainLoading} />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <StrengthsCard explanation={explanation} />
      <GapAnalysisCard explanation={explanation} />
    </div>

    <ScoreBreakdown rankingScore={candidate?.rankingScore ?? rankedData?.scoreDetails} />
    <SkillCoverage
      skills={candidate?.skills}
      jdRequired={jdRequired}
      jdPreferred={jdPreferred}
    />
  </div>
);

const ExperienceTab: React.FC<{
  candidate: ReturnType<typeof useCandidateDetails>["data"];
}> = ({ candidate }) => (
  <div className="flex flex-col gap-5">
    <CareerTimeline careerHistory={candidate?.career_history} />
    <EducationSection education={candidate?.education} />
    <ProjectsSection projects={candidate?.projects} />
    <BehaviorInsights
      behaviorProfile={candidate?.behaviorProfile}
      signals={candidate?.redrob_signals}
    />
  </div>
);

const IntelligenceTab: React.FC<{
  candidate: ReturnType<typeof useCandidateDetails>["data"];
  explanation: ReturnType<typeof useCandidateExplanation>["data"];
  isExplainLoading: boolean;
}> = ({ candidate, explanation, isExplainLoading }) => (
  <div className="flex flex-col gap-5">
    <AIExecutiveSummary explanation={explanation} isLoading={isExplainLoading} />
    <ReliabilityPanel reliabilityProfile={candidate?.reliabilityProfile} />
    <BehaviorInsights
      behaviorProfile={candidate?.behaviorProfile}
      signals={candidate?.redrob_signals}
    />
  </div>
);

const InterviewTab: React.FC<{
  candidate: ReturnType<typeof useCandidateDetails>["data"];
  explanation: ReturnType<typeof useCandidateExplanation>["data"];
  isExplainLoading: boolean;
  candidateId: string;
}> = ({ candidate, explanation, isExplainLoading, candidateId }) => (
  <div className="flex flex-col gap-5">
    <InterviewPrepCard
      explanation={explanation}
      skills={candidate?.skills}
      isLoading={isExplainLoading}
    />
    <RecruiterNotes candidateId={candidateId} />
  </div>
);

// ─── Page coordinator ──────────────────────────────────────────────────────────

const CandidateProfilePage: React.FC = () => {
  const { id, candidateId } = useParams<{ id?: string; candidateId?: string }>();
  const targetId = id ?? candidateId ?? "";

  const [activeTab, setActiveTab] = React.useState<TabId>("overview");

  const { parsedJD } = useAppStore();
  const rankingStore = useRankingStore();

  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: candidate,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useCandidateDetails(targetId);

  const {
    data: explanation,
    isLoading: isExplainLoading,
  } = useCandidateExplanation(targetId, parsedJD?.raw_text ?? "", !!targetId);

  // Attempt to pull ranking data from the store's last response
  // (populated by the CandidateRankingPage before navigating here)
  const rankedData = React.useMemo(() => {
    const stored = (rankingStore as any)._lastRankingResponse;
    if (!stored) return null;
    return (
      stored?.rankedCandidates?.find(
        (c: any) => c.candidateId === targetId
      ) ?? null
    );
  }, [rankingStore, targetId]);

  // JD skill lists for SkillCoverage
  const jdRequired = (parsedJD as any)?.required_skills ?? [];
  const jdPreferred = (parsedJD as any)?.preferred_skills ?? [];

  // Export handler
  const handleExport = useCallback(() => {
    if (!candidate) return;
    exportProfile({ candidate, explanation, rankedData }, targetId);
  }, [candidate, explanation, rankedData, targetId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isDetailsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PageLoader />
      </div>
    );
  }

  // ── Error / Not Found ──────────────────────────────────────────────────────
  if (detailsError || !candidate) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 backdrop-blur-xl p-10 flex flex-col items-center gap-4 shadow-lg dark:shadow-none">
          <AlertTriangle size={40} className="text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Candidate Not Found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
            We couldn't retrieve profile data for candidate{" "}
            <span className="font-mono text-slate-800 dark:text-slate-300">{targetId}</span>. The ID may be
            invalid or the profile has not been synced yet.
          </p>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
          >
            Back to Rankings
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5 pb-12">
      {/* Sticky dossier header */}
      <CandidateHeader
        candidate={candidate}
        rankedData={rankedData}
        onExport={handleExport}
      />

      {/* Navigation tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/8 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              candidate={candidate}
              explanation={explanation}
              rankedData={rankedData}
              jdRequired={jdRequired}
              jdPreferred={jdPreferred}
              isExplainLoading={isExplainLoading}
            />
          )}
          {activeTab === "experience" && (
            <ExperienceTab candidate={candidate} />
          )}
          {activeTab === "intelligence" && (
            <IntelligenceTab
              candidate={candidate}
              explanation={explanation}
              isExplainLoading={isExplainLoading}
            />
          )}
          {activeTab === "interview" && (
            <InterviewTab
              candidate={candidate}
              explanation={explanation}
              isExplainLoading={isExplainLoading}
              candidateId={targetId}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CandidateProfilePage;
