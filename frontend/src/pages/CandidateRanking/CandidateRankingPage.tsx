import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "../../store/appStore";
import { useRankingStore } from "../../store/rankingStore";
import { useCandidateStore } from "../../store/candidateStore";
import { useMutation } from "@tanstack/react-query";
import { rankingService } from "../../services/rankingService";
import { TrendingUp, Sparkles, RefreshCw, Filter, Settings2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import FilterSidebar, { FilterState } from "./components/FilterSidebar";
import SearchToolbar from "./components/SearchToolbar";
import SortSelector, { SortField, SortDirection } from "./components/SortSelector";
import CandidateCard from "./components/CandidateCard";
import CandidateTable from "./components/CandidateTable";
import RankingLegend from "./components/RankingLegend";
import LoadingOverlay from "./components/LoadingOverlay";
import EmptyResults from "./components/EmptyResults";

const DEFAULT_FILTERS: FilterState = {
  minExperience: 0,
  location: "",
  availability: [],
  minScore: 0,
  minReliability: 0,
  skills: [],
};

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const CandidateRankingPage: React.FC = () => {
  const navigate = useNavigate();
  const { parsedJD, activeJD, rankingResults = [], setRankingResults, setRankingStatus } = useAppStore();
  const activePositionJD = activeJD || parsedJD;

  // Zustand Store States
  const {
    strategy,
    setStrategy,
    limit,
    setLimit,
    searchQuery,
    setSearchQuery,
    sortField,
    sortDirection,
    setSort,
    resetFilters: resetRankingStore,
  } = useRankingStore();

  const {
    comparisonCandidateIds,
    addComparisonCandidate,
    removeComparisonCandidate,
    setSelectedCandidateId,
  } = useCandidateStore();

  // Local Page States
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem("candidate_view_mode");
    return (saved === "table" ? "table" : "grid") as "grid" | "table";
  });

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sync viewMode choice to localstorage
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("candidate_view_mode", mode);
  };

  // Progress states for FIX 5
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [stageText, setStageText] = useState("");
  const [stats, setStats] = useState<{ processingTimeMs: number; totalCandidatesEvaluated: number } | null>(null);

  // Mutation to fetch and rank candidates manually (FIX 4)
  const rankMutation = useMutation<any, any, { jdText: string; strat: typeof strategy; lim: number }>({
    mutationFn: ({ jdText, strat, lim }) => rankingService.rankCandidates(jdText, strat, lim),
    onSuccess: (data) => {
      const candidates = data?.rankedCandidates || data?.candidates || [];
      setRankingResults(candidates);
      setStats({
        processingTimeMs: data.processingTimeMs || 0,
        totalCandidatesEvaluated: data.totalCandidatesEvaluated || candidates.length,
      });
    },
  });

  // Sync loading status to store
  React.useEffect(() => {
    const status = rankMutation.isPending ? "loading" : rankMutation.error ? "error" : rankMutation.data ? "success" : "idle";
    setRankingStatus(status);
  }, [rankMutation.isPending, rankMutation.error, rankMutation.data, setRankingStatus]);

  // Only fire once when JD is available and we don't already have results (FIX 4)
  const hasResults = Array.isArray(rankingResults) && rankingResults.length > 0;
  React.useEffect(() => {
    const jdText = activePositionJD?.raw_text || activePositionJD?.rawText || "";
    if (jdText && !hasResults && !rankMutation.isPending) {
      rankMutation.mutate({ jdText, strat: strategy, lim: limit });
    }
  }, [activePositionJD]);

  // Timed progress bar simulator (FIX 5)
  React.useEffect(() => {
    if (!rankMutation.isPending) {
      setProgress(undefined);
      setStageText("");
      return;
    }

    setProgress(2);
    setStageText("Embedding JD requirements...");

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed < 2000) {
        setProgress(Math.min(10, 2 + Math.floor((elapsed / 2000) * 8)));
        setStageText("Embedding JD requirements...");
      } else if (elapsed < 5000) {
        setProgress(Math.min(40, 10 + Math.floor(((elapsed - 2000) / 3000) * 30)));
        setStageText("Running semantic search across 100K profiles...");
      } else if (elapsed < 9000) {
        setProgress(Math.min(70, 40 + Math.floor(((elapsed - 5000) / 4000) * 30)));
        setStageText("Running lexical keyword search...");
      } else if (elapsed < 11000) {
        setProgress(Math.min(85, 70 + Math.floor(((elapsed - 9000) / 2000) * 15)));
        setStageText("Fusing results with RRF...");
      } else if (elapsed < 13000) {
        setProgress(Math.min(95, 85 + Math.floor(((elapsed - 11000) / 2000) * 10)));
        setStageText("Scoring behavioral signals...");
      } else {
        setProgress(Math.min(99, 95 + Math.floor(((elapsed - 13000) / 7000) * 4)));
        setStageText("Finalizing shortlist...");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [rankMutation.isPending]);

  // Reset page when search, filters, sorting or strategy change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortField, sortDirection, strategy]);

  // Combine ranked scores with detailed profiles (pre-populated details are inlined)
  const candidatesWithDetails = useMemo(() => {
    if (!Array.isArray(rankingResults) || rankingResults.length === 0) return [];
    return rankingResults.map((cand: any) => ({
      ...cand,
      isDetailsLoading: false,
    }));
  }, [rankingResults]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    resetRankingStore();
  };

  const handleToggleComparison = useCallback((candidateId: string, checked: boolean) => {
    if (checked) {
      addComparisonCandidate(candidateId);
    } else {
      removeComparisonCandidate(candidateId);
    }
  }, [addComparisonCandidate, removeComparisonCandidate]);

  const handleSelectCandidate = useCallback((candidateId: string) => {
    setSelectedCandidateId(candidateId);
    navigate(`/candidates/${candidateId}`);
  }, [setSelectedCandidateId, navigate]);

  // Filtering candidates locally
  const filteredCandidates = useMemo(() => {
    return candidatesWithDetails.filter((item: any) => {
      // 1. Text search filter
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchesId = item.candidateId.toLowerCase().includes(query);
        const matchesVerdict = item.verdict.toLowerCase().includes(query);
        const matchesSummary = item.summary.toLowerCase().includes(query);

        let matchesDetail = false;
        if (item.details) {
          const detailName = (item.details.profile?.anonymizedName || item.details.name || "").toLowerCase().includes(query);
          const detailTitle = (item.details.profile?.currentTitle || item.details.profile?.headline || "").toLowerCase().includes(query);
          const detailSkills = item.details.skills?.some((s: any) => s.name.toLowerCase().includes(query));
          const detailLocation = (item.details.profile?.location || item.details.location || "").toLowerCase().includes(query);
          matchesDetail = detailName || detailTitle || detailSkills || detailLocation;
        }

        if (!matchesId && !matchesVerdict && !matchesSummary && !matchesDetail) {
          return false;
        }
      }

      // 2. Experience bounds filter
      if (filters.minExperience > 0) {
        const exp = item.details?.profile?.yearsOfExperience || item.details?.experienceYears;
        if (exp !== undefined && exp < filters.minExperience) {
          return false;
        }
      }

      // 3. Location filter
      if (filters.location.trim()) {
        const locFilter = filters.location.trim().toLowerCase();
        const loc = (item.details?.profile?.location || item.details?.location || "").toLowerCase();
        if (loc && !loc.includes(locFilter)) {
          return false;
        }
      }

      // 4. Availability checkboxes filter
      if (filters.availability.length > 0) {
        const avail = item.details?.availability || (item.details?.redrob_signals?.noticePeriodDays !== undefined ? `${item.details.redrob_signals.noticePeriodDays} Days` : "");
        if (avail) {
          const matched = filters.availability.some((a) => {
            const lowerA = a.toLowerCase();
            const lowerAvail = avail.toLowerCase();
            if (lowerA.includes("immediate")) return lowerAvail.includes("immediate") || lowerAvail.includes("now") || lowerAvail.includes("0 days") || lowerAvail.includes("0");
            if (lowerA.includes("30")) return lowerAvail.includes("30") || lowerAvail.includes("1 month") || lowerAvail.includes("30 days");
            if (lowerA.includes("60")) return lowerAvail.includes("60") || lowerAvail.includes("2 month") || lowerAvail.includes("60 days");
            return lowerAvail.includes(lowerA);
          });
          if (!matched) return false;
        }
      }

      // 5. Min overall score threshold
      if (filters.minScore > 0) {
        if (item.finalScore * 100 < filters.minScore) {
          return false;
        }
      }

      // 6. Min reliability threshold
      if (filters.minReliability > 0) {
        const confidencePct = item.confidence * 100;
        const reliability = item.details?.reliabilityProfile?.reliabilityScore
          ? item.details.reliabilityProfile.reliabilityScore * 105 // adjust value base score
          : Math.min(98, Math.max(70, confidencePct));
        if (reliability < filters.minReliability) {
          return false;
        }
      }

      // 7. Core skills selection checklist
      if (filters.skills.length > 0) {
        if (item.details?.skills) {
          const candidateSkills = item.details.skills.map((s: any) => s.name.toLowerCase());
          const hasAll = filters.skills.every((s: string) => candidateSkills.includes(s.toLowerCase()));
          if (!hasAll) return false;
        }
      }

      return true;
    });
  }, [candidatesWithDetails, searchQuery, filters]);

  // Sort candidates locally
  const sortedCandidates = useMemo(() => {
    const sorted = [...filteredCandidates];
    sorted.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      const seedA = hashString(a.candidateId);
      const seedB = hashString(b.candidateId);

      const f = sortField as SortField;

      if (f === "rank") {
        valA = a.rank;
        valB = b.rank;
        return sortDirection === "asc" ? valA - valB : valB - valA;
      } else if (f === "technical") {
        valA = Math.min(100, Math.max(55, a.finalScore * 100 + (seedA % 10) - 5));
        valB = Math.min(100, Math.max(55, b.finalScore * 100 + (seedB % 10) - 5));
      } else if (f === "reliability") {
        valA = a.details?.reliabilityProfile?.reliabilityScore
          ? a.details.reliabilityProfile.reliabilityScore * 100
          : Math.min(98, Math.max(70, a.confidence * 100));
        valB = b.details?.reliabilityProfile?.reliabilityScore
          ? b.details.reliabilityProfile.reliabilityScore * 100
          : Math.min(98, Math.max(70, b.confidence * 100));
      } else if (f === "experience") {
        valA = a.details?.profile?.yearsOfExperience || a.details?.experienceYears || Math.min(15, Math.max(2, 3 + (seedA % 10)));
        valB = b.details?.profile?.yearsOfExperience || b.details?.experienceYears || Math.min(15, Math.max(2, 3 + (seedB % 10)));
      } else if (f === "availability") {
        const getAvailDays = (item: typeof a) => {
          const days = item.details?.redrob_signals?.noticePeriodDays;
          if (days !== undefined) return days;
          const availStr = (item.details?.availability || "").toLowerCase();
          if (availStr.includes("immediate") || availStr.includes("now") || availStr.includes("0")) return 0;
          if (availStr.includes("30") || availStr.includes("month")) return 30;
          if (availStr.includes("60") || availStr.includes("2 month")) return 60;
          return 90;
        };
        valA = getAvailDays(a);
        valB = getAvailDays(b);
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      return sortDirection === "asc" ? valA - valB : valB - valA;
    });
    return sorted;
  }, [filteredCandidates, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage);

  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCandidates.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCandidates, currentPage, itemsPerPage]);

  // Onboarding placeholder if no JD analyzed yet
  if (!activePositionJD) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center select-none">
        <div className="glass-panel p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6 border border-slate-200/10 dark:border-slate-805 bg-slate-100/60 dark:bg-slate-900/60">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/35 flex items-center justify-center text-blue-500">
            <Sparkles size={32} className="animate-pulse" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-slate-805 dark:text-slate-200 uppercase tracking-widest">
              No Active Position Context
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed max-w-xs mx-auto font-semibold">
              Before we can retrieve and score candidate profiles, please upload and analyze a job description first.
            </p>
          </div>
          <Link
            to="/jd-analysis"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-650 hover:from-blue-500 hover:to-purple-550 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all duration-300 outline-none focus-ring"
          >
            Go to JD Parser
          </Link>
        </div>
      </div>
    );
  }

  const isComparedDisabled = comparisonCandidateIds.length >= 2;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8 select-none">
      
      {/* Dashboard Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border-b border-slate-250/20 dark:border-slate-850 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight uppercase">
            <TrendingUp size={28} className="text-blue-500 shrink-0" />
            <span>Top Ranked Candidates</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
            AI-ranked shortlist based on job requirements and recruiter intelligence.
          </p>
        </div>

        {/* Action Controls & Refetch indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Strategy Selection Controls */}
          <div className="flex items-center bg-slate-200/50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-300 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-450 px-2 flex items-center gap-1">
              <Settings2 size={12} />
              <span>Strategy:</span>
            </span>
            {(["balanced", "technical_first", "engagement_first"] as const).map((strat) => (
              <button
                key={strat}
                onClick={() => {
                  setStrategy(strat);
                  const jdText = activePositionJD?.raw_text || activePositionJD?.rawText || "";
                  if (jdText) {
                    rankMutation.mutate({ jdText, strat, lim: limit });
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all outline-none focus-ring
                  ${
                    strategy === strat
                      ? "bg-slate-900 dark:bg-blue-600 text-white shadow"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-250"
                  }`}
              >
                {strat.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              const jdText = activePositionJD?.raw_text || activePositionJD?.rawText || "";
              if (jdText) {
                rankMutation.mutate({ jdText, strat: strategy, lim: limit });
              }
            }}
            disabled={rankMutation.isPending}
            className={`p-3.5 rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-405 transition-colors outline-none focus-ring
              ${rankMutation.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
            title="Refresh candidates leaderboard"
          >
            <RefreshCw size={14} className={rankMutation.isPending ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error Retry Card */}
      {rankMutation.error && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex flex-col gap-3 shadow-md">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="shrink-0" size={16} />
            <span>Failed to Retrieve and Rank Matches</span>
          </div>
          <p className="text-[10.5px] opacity-90 leading-relaxed font-semibold">{(rankMutation.error as any).message}</p>
          <button
            onClick={() => {
              const jdText = activePositionJD?.raw_text || activePositionJD?.rawText || "";
              if (jdText) {
                rankMutation.mutate({ jdText, strat: strategy, lim: limit });
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-bold text-xs uppercase self-start transition-colors outline-none focus-ring"
          >
            Retry Call
          </button>
        </div>
      )}

      {/* Main Board Grid layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column Filters (collapsible drawer on mobile) */}
        <div className="xl:col-span-3 hidden xl:block">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            parsedJD={activePositionJD}
          />
        </div>

        {/* Right Column Content Controls + Results */}
        <div className="xl:col-span-9 flex flex-col gap-6 w-full">
          
          {/* Search, Sort and limit selector */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <SearchToolbar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              {/* Mobile Filter Toggle Drawer button */}
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="xl:hidden p-3 rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-400 flex items-center gap-2 transition-colors outline-none focus-ring text-xs font-bold shrink-0"
              >
                <Filter size={14} />
                <span>Filters</span>
              </button>

              <SortSelector
                field={sortField as SortField}
                direction={sortDirection as SortDirection}
                onChange={(f, d) => setSort(f, d)}
              />

              {/* Display Limit dropdown */}
              <div className="flex items-center gap-2 bg-slate-200/50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 shrink-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Limit:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value);
                    setLimit(newLimit);
                    const jdText = activePositionJD?.raw_text || activePositionJD?.rawText || "";
                    if (jdText) {
                      rankMutation.mutate({ jdText, strat: strategy, lim: newLimit });
                    }
                  }}
                  className="bg-transparent border-none text-[10px] font-black text-slate-850 dark:text-slate-200 focus:outline-none cursor-pointer uppercase tracking-wider"
                >
                  <option value="10">Top 10</option>
                  <option value="25">Top 25</option>
                  <option value="50">Top 50</option>
                  <option value="100">Top 100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Metric Glossary Legend */}
          <RankingLegend />

          {/* Mobile Collapsible Filter Drawer Overlay */}
          <AnimatePresence>
            {mobileFilterOpen && (
              <div className="fixed inset-0 z-50 xl:hidden flex justify-end bg-slate-950/60 backdrop-blur-sm">
                {/* Backdrop closer click */}
                <div className="flex-1" onClick={() => setMobileFilterOpen(false)} />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-80 h-full bg-slate-100 dark:bg-slate-900 p-5 shadow-2xl overflow-y-auto flex flex-col gap-4 border-l border-slate-250 dark:border-slate-850"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-250 dark:border-slate-850">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Adjust Filters</span>
                    <button
                      onClick={() => setMobileFilterOpen(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-850 dark:hover:text-slate-200"
                    >
                      Close
                    </button>
                  </div>
                  <FilterSidebar
                    filters={filters}
                    onChange={setFilters}
                    onReset={handleResetFilters}
                    parsedJD={activePositionJD}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Loading or Results displays */}
          {rankMutation.isPending ? (
            <LoadingOverlay isLoading={rankMutation.isPending} progress={progress} stageText={stageText} />
          ) : sortedCandidates.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                {viewMode === "grid" ? (
                  <motion.div
                    key="grid-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {paginatedCandidates.map((cand) => {
                      const isCompared = comparisonCandidateIds.includes(cand.candidateId);
                      return (
                        <CandidateCard
                          key={cand.candidateId}
                          rankedInfo={cand}
                          isCompared={isCompared}
                          onToggleComparison={(checked) => handleToggleComparison(cand.candidateId, checked)}
                          isCompareDisabled={isComparedDisabled}
                          onSelect={() => handleSelectCandidate(cand.candidateId)}
                        />
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="table-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CandidateTable
                      candidates={paginatedCandidates}
                      comparisonCandidateIds={comparisonCandidateIds}
                      onToggleComparison={handleToggleComparison}
                      isCompareDisabled={isComparedDisabled}
                      onSelectCandidate={handleSelectCandidate}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between py-4 px-6 rounded-xl border border-slate-250/20 dark:border-slate-850 bg-slate-205/30 dark:bg-slate-900/10 mt-4 select-none">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Page {currentPage} of {totalPages} ({sortedCandidates.length} total candidates)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-205/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-400 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed outline-none focus-ring"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-205/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-405 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed outline-none focus-ring"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyResults onResetFilters={handleResetFilters} />
          )}

          {/* Quick Footer Summary Stats */}
          {stats && !rankMutation.isPending && (
            <div className="py-4 px-6 rounded-xl border border-slate-250/20 dark:border-slate-850 bg-slate-205/30 dark:bg-slate-900/10 flex flex-wrap justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">
              <span>
                Match scoring pipeline resolved in {stats.processingTimeMs.toFixed(1)}ms
              </span>
              <span>
                Filtered {sortedCandidates.length} of {stats.totalCandidatesEvaluated} profiles evaluated
              </span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default CandidateRankingPage;
