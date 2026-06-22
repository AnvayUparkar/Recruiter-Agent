import React, { useState } from "react";
import { Filter, X, RefreshCw } from "lucide-react";
import { useAnalyticsStore } from "../../../store/analyticsStore";

interface DashboardFiltersProps {
  jobTitles: Array<{ id: string; title: string }>;
  locations: string[];
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  jobTitles,
  locations,
}) => {
  const { filters, setFilters, resetFilters, timeframe, setTimeframe } = useAnalyticsStore();
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer status

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ [key]: value });
  };

  return (
    <div className="w-full mb-6">
      {/* Desktop Filter Bar */}
      <div className="hidden lg:flex items-center justify-between gap-4 p-4 rounded-2xl glass-panel border-white/10 bg-white/2 shadow-md flex-wrap">
        <div className="flex items-center gap-2 text-slate-300">
          <Filter size={16} className="text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Dashboard Filters</span>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Job Selection */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active JD</span>
            <select
              value={filters.jobId}
              onChange={(e) => handleFilterChange("jobId", e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
            >
              <option value="all">All Jobs</option>
              {jobTitles.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selection */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Timeframe</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
            >
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>

          {/* Experience Selection */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Experience</span>
            <select
              value={filters.experience}
              onChange={(e) => handleFilterChange("experience", e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
            >
              <option value="all">All Levels</option>
              <option value="junior">Junior (0-2 Yrs)</option>
              <option value="mid">Mid (3-5 Yrs)</option>
              <option value="senior">Senior (6-8 Yrs)</option>
              <option value="lead">Lead/Principal (9+ Yrs)</option>
            </select>
          </div>

          {/* Recommendation Selection */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">AI Verdict</span>
            <select
              value={filters.recommendation}
              onChange={(e) => handleFilterChange("recommendation", e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
            >
              <option value="all">All Verdicts</option>
              <option value="Strong Hire">Strong Hire</option>
              <option value="Hire">Hire</option>
              <option value="Interview">Interview</option>
              <option value="Consider">Consider</option>
              <option value="Needs Review">Needs Review/Reject</option>
            </select>
          </div>

          {/* Location Selection */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Location</span>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc.toLowerCase()}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Reliability Selection */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Reliability Status</span>
            <select
              value={filters.reliability}
              onChange={(e) => handleFilterChange("reliability", e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
            >
              <option value="all">All Verification</option>
              <option value="high">High (&gt;85%)</option>
              <option value="medium">Nominal (65-85%)</option>
              <option value="review">Audit Suggested (&lt;65%)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex flex-col justify-end h-[38px] pt-1">
            <button
              onClick={resetFilters}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Reset all filters"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden w-full flex justify-end">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-glow"
        >
          <Filter size={14} />
          <span>Filter Analytics</span>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-80 h-full bg-slate-900 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="font-bold text-white uppercase tracking-wider text-xs">Filter Parameters</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Job selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Active Role</span>
                <select
                  value={filters.jobId}
                  onChange={(e) => handleFilterChange("jobId", e.target.value)}
                  className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
                >
                  <option value="all">All Jobs</option>
                  {jobTitles.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Timeframe</span>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
                >
                  <option value="24h">Past 24 Hours</option>
                  <option value="7d">Past 7 Days</option>
                  <option value="30d">Past 30 Days</option>
                </select>
              </div>

              {/* Experience */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Experience Range</span>
                <select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange("experience", e.target.value)}
                  className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="junior">Junior (0-2 Yrs)</option>
                  <option value="mid">Mid (3-5 Yrs)</option>
                  <option value="senior">Senior (6-8 Yrs)</option>
                  <option value="lead">Lead/Principal (9+ Yrs)</option>
                </select>
              </div>

              {/* Recommendation */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">AI Recommendation</span>
                <select
                  value={filters.recommendation}
                  onChange={(e) => handleFilterChange("recommendation", e.target.value)}
                  className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
                >
                  <option value="all">All Verdicts</option>
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Interview">Interview</option>
                  <option value="Consider">Consider</option>
                  <option value="Needs Review">Needs Review/Reject</option>
                </select>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Location</span>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
                >
                  <option value="all">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc.toLowerCase()}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reliability */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Reliability Index</span>
                <select
                  value={filters.reliability}
                  onChange={(e) => handleFilterChange("reliability", e.target.value)}
                  className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-blue-500 outline-none"
                >
                  <option value="all">All Verification</option>
                  <option value="high">High (&gt;85%)</option>
                  <option value="medium">Nominal (65-85%)</option>
                  <option value="review">Audit Suggested (&lt;65%)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-auto pt-6 border-t border-white/5">
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-350 hover:bg-white/10 hover:text-white transition-all text-xs font-semibold"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all text-xs font-semibold shadow-glow"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardFilters;
