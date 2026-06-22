import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useCandidateStore } from "../../store/candidateStore";
import { useAppStore } from "../../store/appStore";
import { candidateService } from "../../services/candidateService";
import { copilotService } from "../../services/copilotService";
import { rankingService } from "../../services/rankingService";
import { Candidate } from "../../types/candidate";
import {
  GitCompare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  LineChart,
  Activity,
  Heart,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Import custom components
import ComparisonToolbar from "./components/ComparisonToolbar";
import SelectedCandidatesBar from "./components/SelectedCandidatesBar";
import ComparisonGrid from "./components/ComparisonGrid";
import ComparisonTable from "./components/ComparisonTable";
import ComparisonRadarChart from "./components/ComparisonRadarChart";
import ComparisonScoreCard from "./components/ComparisonScoreCard";
import ComparisonTimeline from "./components/ComparisonTimeline";
import ComparisonSkills from "./components/ComparisonSkills";
import ComparisonStrengths from "./components/ComparisonStrengths";
import ComparisonWeaknesses from "./components/ComparisonWeaknesses";
import ComparisonReliability from "./components/ComparisonReliability";
import ComparisonBehavior from "./components/ComparisonBehavior";
import ComparisonRecommendation from "./components/ComparisonRecommendation";
import ComparisonWinnerBanner from "./components/ComparisonWinnerBanner";
import ComparisonInsights from "./components/ComparisonInsights";
import ComparisonActions from "./components/ComparisonActions";
import StickyCompareFooter from "./components/StickyCompareFooter";

export const CandidateComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const { parsedJD } = useAppStore();
  const {
    comparisonCandidateIds,
    removeComparisonCandidate,
    clearComparison,
    expandedSections,
    toggleExpandedSection,
  } = useCandidateStore();

  const jdText = parsedJD?.rawText || parsedJD?.raw_text || "";

  // 1. Fetch Candidate profiles in parallel
  const candidateQueries = useQueries({
    queries: comparisonCandidateIds.map((id) => ({
      queryKey: ["candidateDetails", id],
      queryFn: () => candidateService.getCandidate(id),
      staleTime: 10 * 60 * 1000,
      enabled: !!id,
    })),
  });

  // 2. Fetch Copilot Reports in parallel
  const reportQueries = useQueries({
    queries: comparisonCandidateIds.map((id) => ({
      queryKey: ["copilotReport", id, { jobDescription: jdText }],
      queryFn: () => copilotService.generateReport(id, jdText),
      staleTime: 5 * 60 * 1000,
      enabled: !!id && jdText.length >= 20,
    })),
  });

  // 3. Fetch Candidate explanations in parallel
  const explanationQueries = useQueries({
    queries: comparisonCandidateIds.map((id) => ({
      queryKey: ["explanation", id, { jobDescription: jdText }],
      queryFn: () => rankingService.explainCandidate(id, jdText),
      staleTime: 10 * 60 * 1000,
      enabled: !!id && jdText.length >= 20,
    })),
  });

  // Check state loading / error
  const isCandidatesLoading = candidateQueries.some((q) => q.isLoading);
  const isReportsLoading = reportQueries.some((q) => q.isLoading);
  const isExplanationsLoading = explanationQueries.some((q) => q.isLoading);
  const isAnyLoading = isCandidatesLoading || isReportsLoading || isExplanationsLoading;

  const hasErrors = candidateQueries.some((q) => q.isError);
  const candidateError = candidateQueries.find((q) => q.isError)?.error;

  // Gather loaded data
  const loadedCandidates = useMemo(() => {
    return candidateQueries
      .map((q) => q.data)
      .filter((data): data is Candidate => !!data);
  }, [candidateQueries]);

  const loadedReportsMap = useMemo(() => {
    const reportsMap: Record<string, any> = {};
    reportQueries.forEach((q, index) => {
      const candidateId = comparisonCandidateIds[index];
      if (q.data && candidateId) {
        reportsMap[candidateId] = q.data;
      }
    });
    return reportsMap;
  }, [reportQueries, comparisonCandidateIds]);

  const loadedExplanationsMap = useMemo(() => {
    const explanationsMap: Record<string, any> = {};
    explanationQueries.forEach((q, index) => {
      const candidateId = comparisonCandidateIds[index];
      if (q.data && candidateId) {
        explanationsMap[candidateId] = q.data;
      }
    });
    return explanationsMap;
  }, [explanationQueries, comparisonCandidateIds]);

  const handleAddMore = () => {
    navigate("/dashboard");
  };

  // 3. Render Loading Experience
  if (isAnyLoading) {
    const loadingSteps = [
      "Comparing candidate skills...",
      "Evaluating reliability & timeline integrity...",
      "Analyzing leadership indicators...",
      "Generating AI comparison insights...",
    ];

    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
          {/* Shimmer loaders */}
          <div className="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 overflow-hidden shadow-glow">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            <GitCompare size={30} className="animate-spin" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-white font-heading">
              Generating Finalist Comparison Workspace
            </h2>
            <div className="h-6 overflow-hidden relative w-64 mx-auto text-xs text-slate-400">
              <motion.div
                animate={{ y: [0, -24, -48, -72] }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  ease: "easeInOut",
                  times: [0, 0.33, 0.66, 1],
                }}
                className="flex flex-col gap-2 font-medium"
              >
                {loadingSteps.map((step, idx) => (
                  <span key={idx} className="h-6">
                    {step}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Skeleton columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-10">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col gap-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                <div className="w-12 h-12 rounded-xl bg-white/5" />
                <div className="w-3/4 h-4 rounded bg-white/10 mt-2" />
                <div className="w-1/2 h-3 rounded bg-white/5" />
                <div className="w-full h-24 rounded bg-white/5 mt-4" />
                <div className="w-full h-8 rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. Render Error State
  if (hasErrors) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-450 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-400 shrink-0" size={24} />
            <h2 className="text-lg font-bold font-heading">
              Failed to load comparison data
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-rose-300">
            {candidateError?.message ||
              "An error occurred while calling candidate profile endpoints. Please check network logs or configurations."}
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-all"
            >
              Retry Request
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs transition-all"
            >
              Return to Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Render Empty / Onboarding State
  if (loadedCandidates.length < 2) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border-white/10 shadow-2xl flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-glow">
            <GitCompare size={36} className="animate-pulse" />
          </div>
          <div className="flex flex-col gap-2 max-w-md">
            <h2 className="text-2xl font-bold text-white font-heading">
              Finalist Comparison Workspace
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Compare 2 to 5 candidates side-by-side using aggregate AI scorecards, technical skills completeness, timeline consistency audit logs, and behavioral signals.
            </p>
          </div>

          {loadedCandidates.length > 0 && (
            <div className="w-full flex flex-col gap-2 text-left border-t border-white/5 pt-4 max-w-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Currently Selected:
              </span>
              {loadedCandidates.map((c) => (
                <div
                  key={c.candidateId}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                  <button
                    onClick={() => removeComparisonCandidate(c.candidateId)}
                    className="text-slate-400 hover:text-rose-400 transition-colors text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 w-full justify-center pt-2">
            <button
              onClick={handleAddMore}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-glow hover:shadow-neon"
            >
              Select Candidates (from Leaderboard)
            </button>
            {loadedCandidates.length > 0 && (
              <button
                onClick={clearComparison}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-rose-400 font-bold text-xs transition-all"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. Main Dashboard Render
  return (
    <div className="max-w-6xl mx-auto py-6 px-4 pb-24 relative">
      {/* Top action row */}
      <ComparisonToolbar
        candidateCount={loadedCandidates.length}
        onClear={clearComparison}
        onAddMore={handleAddMore}
      />

      {/* Selected candidates overview cards */}
      <SelectedCandidatesBar
        candidates={loadedCandidates}
        onRemove={removeComparisonCandidate}
      />

      {/* Winner advisor banner callout */}
      <ComparisonWinnerBanner
        candidates={loadedCandidates}
        reports={loadedReportsMap}
      />

      {/* Dynamic comparison insights row */}
      <ComparisonInsights candidates={loadedCandidates} />

      {/* Radar chart overlays */}
      <ComparisonRadarChart candidates={loadedCandidates} />

      {/* Grid Comparison Table */}
      <ComparisonTable candidates={loadedCandidates} />

      {/* Expandable Accordion sections (Scores, Skills, Timeline, Reliability, Behavior) */}
      <div className="flex flex-col gap-4 mt-6">
        {/* Section 1: Scores Breakdown */}
        <SectionContainer
          id="scores"
          title="Full Score Dimension Comparison"
          description="Detailed break down of aggregated core matching scores."
          icon={<LineChart size={16} />}
          isExpanded={expandedSections.includes("scores")}
          onToggle={() => toggleExpandedSection("scores")}
        >
          <ComparisonGrid candidates={loadedCandidates}>
            {(c) => (
              <ComparisonScoreCard
                key={c.candidateId}
                candidate={c}
                allCandidates={loadedCandidates}
              />
            )}
          </ComparisonGrid>
        </SectionContainer>

        {/* Section 2: Skill Matrices */}
        <SectionContainer
          id="skills"
          title="Job Description Skill Coverage"
          description="Requirement matches, missing tools, and candidate-specific skill strengths."
          icon={<BookOpen size={16} />}
          isExpanded={expandedSections.includes("skills")}
          onToggle={() => toggleExpandedSection("skills")}
        >
          <ComparisonGrid candidates={loadedCandidates}>
            {(c) => (
              <ComparisonSkills
                key={c.candidateId}
                candidate={c}
                allCandidates={loadedCandidates}
                parsedJD={parsedJD}
              />
            )}
          </ComparisonGrid>
        </SectionContainer>

        {/* Section 3: Strengths and Gaps */}
        <SectionContainer
          id="strengths_gaps"
          title="Strengths & Growth Areas"
          description="Highlight positive traits and potential development areas."
          icon={<Award size={16} />}
          isExpanded={expandedSections.includes("strengths_gaps")}
          onToggle={() => toggleExpandedSection("strengths_gaps")}
        >
          <ComparisonGrid candidates={loadedCandidates}>
            {(c) => (
              <div key={c.candidateId} className="flex flex-col gap-4">
                <ComparisonStrengths
                  candidate={c}
                  explanation={loadedExplanationsMap[c.candidateId]}
                />
                <ComparisonWeaknesses
                  candidate={c}
                  explanation={loadedExplanationsMap[c.candidateId]}
                />
              </div>
            )}
          </ComparisonGrid>
        </SectionContainer>

        {/* Section 4: Career Timeline Progression */}
        <SectionContainer
          id="timeline"
          title="Career Progression Timelines"
          description="Promotion rates, years of exposure, and corporate progression timelines."
          icon={<TrendingUp size={16} />}
          isExpanded={expandedSections.includes("timeline")}
          onToggle={() => toggleExpandedSection("timeline")}
        >
          <ComparisonGrid candidates={loadedCandidates}>
            {(c) => <ComparisonTimeline key={c.candidateId} candidate={c} />}
          </ComparisonGrid>
        </SectionContainer>

        {/* Section 5: Reliability & Integrity Audit */}
        <SectionContainer
          id="reliability"
          title="Verification & Profile Reliability Logs"
          description="Resume authenticity check, anomaly warning flags, and documentation quality."
          icon={<Activity size={16} />}
          isExpanded={expandedSections.includes("reliability")}
          onToggle={() => toggleExpandedSection("reliability")}
        >
          <ComparisonGrid candidates={loadedCandidates}>
            {(c) => <ComparisonReliability key={c.candidateId} candidate={c} />}
          </ComparisonGrid>
        </SectionContainer>

        {/* Section 6: Behavioral Intelligence */}
        <SectionContainer
          id="behavior"
          title="Engagement & Communication Indicators"
          description="Collaboration signals, email verification, notice period, and join probabilities."
          icon={<Heart size={16} />}
          isExpanded={expandedSections.includes("behavior")}
          onToggle={() => toggleExpandedSection("behavior")}
        >
          <ComparisonGrid candidates={loadedCandidates}>
            {(c) => <ComparisonBehavior key={c.candidateId} candidate={c} />}
          </ComparisonGrid>
        </SectionContainer>

        {/* Section 7: Hiring Proposals */}
        <SectionContainer
          id="proposals"
          title="Hiring Proposals & Verdicts"
          description="AI recommended decisions, risk assessments, and justifications."
          icon={<Award size={16} />}
          isExpanded={expandedSections.includes("proposals")}
          onToggle={() => toggleExpandedSection("proposals")}
        >
          <div className="flex flex-col gap-4">
            <ComparisonGrid candidates={loadedCandidates}>
              {(c) => (
                <div key={c.candidateId} className="flex flex-col h-full justify-between">
                  <ComparisonRecommendation
                    candidate={c}
                    report={loadedReportsMap[c.candidateId]}
                    explanation={loadedExplanationsMap[c.candidateId]}
                  />
                  <ComparisonActions
                    candidateId={c.candidateId}
                    candidateName={c.name}
                  />
                </div>
              )}
            </ComparisonGrid>
          </div>
        </SectionContainer>
      </div>

      {/* Sticky decision finalize footer */}
      <StickyCompareFooter candidates={loadedCandidates} />
    </div>
  );
};

// Section Layout Helper Component
interface SectionContainerProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  description,
  icon,
  isExpanded,
  onToggle,
  children,
}) => {
  return (
    <div className="w-full glass-panel rounded-2xl border-white/10 overflow-hidden shadow-lg">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/2 transition-colors text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              {title}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>

        <div className="text-slate-400">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 border-t border-white/5 bg-white/1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateComparisonPage;
