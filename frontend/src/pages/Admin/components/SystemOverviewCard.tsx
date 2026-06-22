import React, { useEffect, useState } from "react";
import { Activity, Clock, ShieldCheck, UserCheck } from "lucide-react";
import { adminService, SystemOverview } from "../../../services/adminService";
import { motion } from "framer-motion";

export const SystemOverviewCard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const data = await adminService.fetchOverviewMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">Syncing telemetry logs...</span>
        </div>
      </div>
    );
  }

  // Format uptime: e.g. "3d 4h 12m"
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const statusColors = {
    healthy: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    degraded: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            System Telemetry
          </h3>
          <p className="text-xs text-slate-400">Core cluster performance metrics</p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[11px] font-extrabold uppercase tracking-wider ${statusColors[metrics.status]}`}>
          {metrics.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Animated AI Status Orb Section */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-500/5 rounded-2xl border border-slate-200/5 relative overflow-hidden min-h-[200px]">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/20 pointer-events-none" />
          
          {/* pulsating Orb */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* outer rings */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-2 border-blue-500/30"
            />
            <motion.div
              animate={{ scale: [1, 1.45, 1], opacity: [0.05, 0.15, 0.05] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
              className="absolute inset-0 rounded-full border border-purple-500/20"
            />
            
            {/* core glowing sphere */}
            <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${
              metrics.status === "healthy"
                ? "from-blue-600 to-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)]"
                : "from-amber-600 to-rose-400 shadow-[0_0_30px_rgba(251,113,133,0.4)]"
            } flex items-center justify-center text-white relative z-10 font-black text-xl`}>
              {metrics.healthScore}
            </div>
          </div>
          
          <div className="mt-4 text-center z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Health Score</span>
            <span className="text-sm font-extrabold text-slate-700 dark:text-slate-250">
              {metrics.status === "healthy" ? "Optimal Coverage" : "Minor Degradation"}
            </span>
          </div>
        </div>

        {/* Live Aggregates Grid */}
        <div className="lg:col-span-8 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Uptime</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatUptime(metrics.uptimeSeconds)}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Activity size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Avg Latency</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{metrics.averageResponseTimeMs}ms</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Requests</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{metrics.totalRequestsToday} today</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
              <UserCheck size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Users</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{metrics.activeUsersCount} online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services status bar */}
      <div className="mt-8 pt-6 border-t border-slate-200/10 dark:border-slate-800/50">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Clusters Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { name: "Backend API", status: metrics.services.backend },
            { name: "Frontend CLI", status: metrics.services.frontend },
            { name: "PostgreSQL DB", status: metrics.services.database },
            { name: "AI Inference", status: metrics.services.aiServices },
            { name: "Task Queue", status: metrics.services.queueHealth },
          ].map((srv) => (
            <div key={srv.name} className="flex flex-col p-2.5 rounded-lg bg-slate-500/5 border border-slate-200/5 text-center">
              <span className="text-[10px] text-slate-400 font-semibold truncate">{srv.name}</span>
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wide">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  srv.status === "online" || srv.status === "empty"
                    ? "bg-emerald-500"
                    : srv.status === "slow" || srv.status === "processing"
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`} />
                <span className="capitalize text-slate-700 dark:text-slate-300">{srv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemOverviewCard;
