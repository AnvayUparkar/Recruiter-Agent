import React, { useState } from "react";
import { ListFilter, Search, Download } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";

export const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useAdminStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Filter lists
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || 
                          log.details.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    const matchesUser = userFilter === "all" || log.user === userFilter;
    return matchesSearch && matchesCategory && matchesUser;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  // Extract unique users for filter options
  const uniqueUsers = Array.from(new Set(auditLogs.map((log) => log.user)));

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleExportCSV = () => {
    // Generate simple csv file download client side
    const headers = "ID,Timestamp,User,Action,Category,Details\n";
    const rows = filteredLogs.map(l => `"${l.id}","${l.timestamp}","${l.user}","${l.action.replace(/"/g, '""')}","${l.category}","${l.details.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system_audit_logs_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const categoryColors = {
    "Security": "text-rose-500 bg-rose-500/10 border-rose-500/20",
    "Model Config": "text-blue-500 bg-blue-500/10 border-blue-500/20",
    "Ranking Weights": "text-purple-500 bg-purple-500/10 border-purple-500/20",
    "System": "text-amber-500 bg-amber-500/10 border-amber-500/20",
    "Export": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <ListFilter className="text-blue-500" size={20} />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Security & Operations Audit Log
            </h3>
            <p className="text-xs text-slate-400">Chronological history of platform calibrations and actions</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200/10 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all select-none"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search action or details..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus-ring font-sans"
          />
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-750 dark:text-slate-200 font-semibold outline-none focus-ring"
        >
          <option value="all">All Categories</option>
          <option value="Security">Security</option>
          <option value="Model Config">Model Config</option>
          <option value="Ranking Weights">Ranking Weights</option>
          <option value="System">System</option>
          <option value="Export">Export</option>
        </select>

        {/* Operator User */}
        <select
          value={userFilter}
          onChange={(e) => {
            setUserFilter(e.target.value);
            setPage(1);
          }}
          className="w-full bg-slate-900/40 dark:bg-slate-950/40 border border-slate-200/10 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-750 dark:text-slate-200 font-semibold outline-none focus-ring"
        >
          <option value="all">All Operators</option>
          {uniqueUsers.map((usr) => (
            <option key={usr} value={usr}>{usr}</option>
          ))}
        </select>
      </div>

      {/* Log list grid */}
      <div className="space-y-3.5">
        {paginatedLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs border border-slate-200/10 dark:border-slate-800/50 rounded-xl bg-slate-500/5">
            No operational audit logs match the current search filters.
          </div>
        ) : (
          paginatedLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl border border-slate-200/5 bg-slate-500/5 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs hover:border-slate-200/10 dark:hover:border-slate-800/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 border rounded-full text-[9px] font-black uppercase ${categoryColors[log.category]}`}>
                    {log.category}
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{log.action}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal max-w-2xl font-medium">
                  {log.details}
                </p>
              </div>

              <div className="shrink-0 text-right text-[10px] text-slate-400 font-semibold space-y-0.5 md:self-center">
                <div className="text-slate-350 font-bold">Operator: {log.user}</div>
                <div className="text-slate-500">{formatDate(log.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Showing Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 bg-slate-500/5 hover:bg-slate-500/10 disabled:opacity-30 text-slate-400 disabled:hover:bg-transparent rounded-lg text-xs font-bold transition-all border border-slate-200/5 select-none"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 bg-slate-500/5 hover:bg-slate-500/10 disabled:opacity-30 text-slate-400 disabled:hover:bg-transparent rounded-lg text-xs font-bold transition-all border border-slate-200/5 select-none"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
