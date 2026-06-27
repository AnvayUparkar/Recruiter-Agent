import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "../../store/appStore";
import { useRankingStore } from "../../store/rankingStore";
import { useCandidateStore } from "../../store/candidateStore";
import { useMutation, useQueries } from "@tanstack/react-query";
import { rankingService } from "../../services/rankingService";
import { candidateService } from "../../services/candidateService";
import { TrendingUp, Sparkles, RefreshCw, Filter, AlertCircle } from "lucide-react";
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

// Helper to extract a normalized integer representing availability in days
const getAvailabilityInDays = (item: any): number | null => {
  const days = item?.details?.redrob_signals?.noticePeriodDays;
  if (typeof days === 'number') return days;
  
  const availStr = String(item?.details?.availability || "").toLowerCase().trim();
  if (!availStr || availStr === "null" || availStr === "undefined") return null;
  
  if (availStr.includes("immediate") || availStr.includes("now") || availStr.includes("0")) return 0;
  
  // Try to parse numbers from the string e.g. "15 Days", "2 months"
  const matchNum = availStr.match(/(\d+)/);
  if (matchNum) {
     const val = parseInt(matchNum[1], 10);
     if (availStr.includes("month")) return val * 30;
     if (availStr.includes("week")) return val * 7;
     return val; // Assume days
  }
  
  return null;
};

// Simulated hash for stable deterministic sorting fallbacks
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

  // Fetch full details for all ranked candidates to enable local filtering and sorting
  const candidateQueries = useQueries({
    queries: (rankingResults || []).map((cand: any) => ({
      queryKey: ["candidateDetails", cand.candidateId],
      queryFn: () => candidateService.getCandidate(cand.candidateId),
      staleTime: 10 * 60 * 1000,
    }))
  });

  // Combine ranked scores with detailed profiles
  const candidatesWithDetails = useMemo(() => {
    if (!Array.isArray(rankingResults) || rankingResults.length === 0) return [];
    return rankingResults.map((cand: any, index: number) => {
      const query = candidateQueries[index];
      return {
        ...cand,
        details: cand.details || query.data,
        isDetailsLoading: query.isLoading,
      };
    });
  }, [rankingResults, candidateQueries]);

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

      // 4. Availability checkboxes filter (Mathematical boundary check)
      if (filters.availability.length > 0) {
        const candidateDays = getAvailabilityInDays(item);
        if (candidateDays === null) return false; // Exclude if we don't know their availability

        // Determine the maximum allowed days based on the user's selected filters
        let maxAllowedDays = -1;
        for (const a of filters.availability) {
          const lowerA = a.toLowerCase();
          if (lowerA.includes("60")) maxAllowedDays = Math.max(maxAllowedDays, 60);
          else if (lowerA.includes("30")) maxAllowedDays = Math.max(maxAllowedDays, 30);
          else if (lowerA.includes("immediate")) maxAllowedDays = Math.max(maxAllowedDays, 0);
        }

        // The candidate passes if their availability is less than or equal to the maximum allowed limit
        if (maxAllowedDays !== -1 && candidateDays > maxAllowedDays) {
          return false;
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
        valA = a.scoreDetails?.technicalScore 
          ? a.scoreDetails.technicalScore * 100
          : Math.min(100, Math.max(55, a.finalScore * 100 + (seedA % 10) - 5));
        valB = b.scoreDetails?.technicalScore 
          ? b.scoreDetails.technicalScore * 100
          : Math.min(100, Math.max(55, b.finalScore * 100 + (seedB % 10) - 5));
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
        const daysA = getAvailabilityInDays(a);
        const daysB = getAvailabilityInDays(b);
        
        // If unknown, penalize them by pushing to the bottom (treat as 999 days)
        valA = daysA !== null ? daysA : 999;
        valB = daysB !== null ? daysB : 999;
        
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

  const aiInsights = useMemo(() => {
    if (sortedCandidates.length === 0) return null;
    const topCandidates = sortedCandidates.slice(0, 5);
    const avgScore = Math.round(topCandidates.reduce((acc, c) => acc + c.finalScore, 0) / topCandidates.length * 100);
    const allSkills = topCandidates.flatMap(c => {
      const skills = c.details?.skills || c.profile?.skills || [];
      return skills.map((s: any) => typeof s === 'string' ? s : s.name);
    }).filter(Boolean);
    const skillCounts = allSkills.reduce((acc: any, skill: string) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {});
    const topSkills = Object.entries(skillCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 4)
      .map(e => e[0]);
    return { avgScore, topSkills };
  }, [sortedCandidates]);

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

  const isComparedDisabled = comparisonCandidateIds.length >= 5;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8 select-none">

      {/* Dashboard Page Header */}
      <div className="flex flex-col gap-4 border-b border-slate-250/20 dark:border-slate-850 pb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight uppercase">
              <TrendingUp size={24} className="text-blue-500 shrink-0" />
              <span>Top Ranked</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
              AI-ranked shortlist based on job requirements.
            </p>
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
            className={`self-start sm:self-auto p-3 rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-405 transition-colors outline-none focus-ring
              ${rankMutation.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
            title="Refresh candidates leaderboard"
          >
            <RefreshCw size={14} className={rankMutation.isPending ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Strategy selector — full width on mobile */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-xl p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative w-full">
            {(["balanced", "technical_first", "engagement_first"] as const).map((strat) => {
              const isActive = strategy === strat;
              return (
                <button
                  key={strat}
                  onClick={() => {
                    setStrategy(strat);
                    const jdText = activePositionJD?.raw_text || activePositionJD?.rawText || "";
                    if (jdText) {
                      rankMutation.mutate({ jdText, strat, lim: limit });
                    }
                  }}
                  className={`flex-1 relative px-2 sm:px-4 py-2 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-colors outline-none focus-ring z-10 text-center
                    ${isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="strategy-pill"
                      className="absolute inset-0 bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.1)] -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1">
                    <span className="hidden sm:inline">{strat.replace(/_/g, " ")}</span>
                    <span className="sm:hidden">
                      {strat === "balanced" ? "Balanced" : strat === "technical_first" ? "Technical" : "Engagement"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-[9px] text-slate-400 font-bold px-1 uppercase tracking-widest">
            AI Ranking Strategy
          </span>
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

      {/* Main Board Layout */}
      <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 items-start w-full">

        {/* Left Column Filters (collapsible drawer on mobile) */}
        <div className="hidden xl:block w-80 shrink-0">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            parsedJD={activePositionJD}
          />
        </div>

        {/* Right Column Content Controls + Results */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">

          {/* Search, Sort and limit selector */}
          <div className="flex flex-col gap-3">
            <SearchToolbar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />

            <div className="flex flex-wrap items-center gap-2">
              {/* Mobile Filter Toggle Drawer button */}
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="xl:hidden p-2.5 rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-400 flex items-center gap-2 transition-colors outline-none focus-ring text-xs font-bold"
              >
                <Filter size={14} />
                <span>Filters</span>
              </button>

              <div className="flex-1 min-w-fit sm:min-w-0">
                <SortSelector
                  field={sortField as SortField}
                  direction={sortDirection as SortDirection}
                  onChange={(f, d) => setSort(f, d)}
                />
              </div>

              {/* Display Limit dropdown */}
              <div className="flex items-center bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-xl px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                <span className="text-xs font-medium text-slate-400 mr-2">Top</span>
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
                  className="bg-transparent border-none text-xs font-black text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer tracking-wider"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Metric Glossary Legend */}
          <RankingLegend />

          {/* Mobile Collapsible Filter Drawer Overlay */}
          <AnimatePresence>
            {mobileFilterOpen && (
              <div className="fixed inset-0 z-[10001] xl:hidden flex justify-end bg-slate-950/60 backdrop-blur-sm">
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

          {/* AI Insights Strip */}
          {aiInsights && !rankMutation.isPending && sortedCandidates.length > 0 && (
            <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border border-blue-500/20 shadow-lg mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl shrink-0">
                  <Sparkles size={20} className="text-blue-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    AI Insights
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                    Top candidates show strong alignment in:{" "}
                    {aiInsights.topSkills.length > 0 ? (
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {aiInsights.topSkills.join(", ")}
                      </span>
                    ) : (
                      "Core Competencies"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 px-4 py-2 rounded-xl border border-white/20 dark:border-white/5 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Average Match Score</span>
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{aiInsights.avgScore}%</span>
              </div>
            </div>
          )}

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
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-4 sm:px-6 rounded-xl border border-slate-250/20 dark:border-slate-850 bg-slate-205/30 dark:bg-slate-900/10 mt-4 select-none">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center sm:text-left">
                    Page {currentPage} of {totalPages} <span className="hidden sm:inline">({sortedCandidates.length} total)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-205/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-400 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed outline-none focus-ring"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-slate-400 font-bold">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-350 dark:border-slate-800 bg-slate-205/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-405 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed outline-none focus-ring"
                    >
                      Next →
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
            <div className="py-3 px-4 rounded-xl border border-slate-250/20 dark:border-slate-850 bg-slate-205/30 dark:bg-slate-900/10 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">
              <span>Pipeline: {stats.processingTimeMs.toFixed(1)}ms</span>
              <span>{sortedCandidates.length} of {stats.totalCandidatesEvaluated} profiles</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default CandidateRankingPage;
