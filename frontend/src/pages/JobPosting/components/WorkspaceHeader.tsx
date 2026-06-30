import React from "react";
import { ArrowLeft, Search, KanbanSquare, List as ListIcon, BarChart2, Briefcase } from "lucide-react";
import { ViewMode } from "../JobWorkspace";

interface WorkspaceHeaderProps {
  job: any;
  onBack: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleAnalytics: () => void;
  isAnalyticsOpen: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  job,
  onBack,
  viewMode,
  setViewMode,
  toggleAnalytics,
  isAnalyticsOpen,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase size={20} className="text-blue-500" />
            {job.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
            <span className="font-medium text-slate-700 dark:text-slate-300">{job.company || "Your Company"}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${job.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {job.status || "Draft"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search applicants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm transition-all outline-none text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "kanban" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700"}`}
          >
            <KanbanSquare size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700"}`}
          >
            <ListIcon size={18} />
          </button>
        </div>

        <button
          onClick={toggleAnalytics}
          className={`p-2 rounded-xl border transition-colors flex items-center gap-2 text-sm font-semibold ${isAnalyticsOpen ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
        >
          <BarChart2 size={18} />
          <span className="hidden sm:inline">Analytics</span>
        </button>
      </div>
    </div>
  );
};
