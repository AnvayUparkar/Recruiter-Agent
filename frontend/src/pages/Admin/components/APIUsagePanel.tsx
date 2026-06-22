import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Activity, ShieldAlert, Zap } from "lucide-react";
import { adminService, APIUsageStats } from "../../../services/adminService";

export const APIUsagePanel: React.FC = () => {
  const [stats, setStats] = useState<APIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.fetchAPIUsage();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 min-h-[300px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Activity className="text-blue-500" size={20} />
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            API Performance & Latency Telemetry
          </h3>
          <p className="text-xs text-slate-400">Live monitoring of endpoint throughput and processing delays</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Throughput Chart */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Zap size={14} className="text-blue-500" />
            Requests Throughput (Requests/hr)
          </span>
          <div className="h-48 w-full bg-slate-500/5 rounded-xl border border-slate-200/5 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.requestsPerHour}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "11px", color: "#f8fafc", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" name="Queries" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Chart */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Activity size={14} className="text-purple-500" />
            Average Client Latency (ms)
          </span>
          <div className="h-48 w-full bg-slate-500/5 rounded-xl border border-slate-200/5 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.latencyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "11px", color: "#f8fafc", fontWeight: "bold" }}
                />
                <Line type="monotone" dataKey="latency" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7" }} name="Latency" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200/10 dark:border-slate-800/50">
        {/* Error Codes */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-rose-500" />
            Response Status Distribution
          </span>
          <div className="space-y-3">
            {stats.errorRates.map((rate) => (
              <div key={rate.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-350">{rate.label}</span>
                  <span className="text-slate-800 dark:text-slate-100">{rate.rate}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      rate.label.includes("2xx")
                        ? "bg-emerald-500"
                        : rate.label.includes("4xx")
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${rate.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Active Endpoints */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
            Top Endpoint Query Hits
          </span>
          <div className="overflow-hidden border border-slate-200/10 dark:border-slate-800/50 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-500/5 text-slate-400 font-extrabold uppercase border-b border-slate-200/10 dark:border-slate-800/50 select-none">
                  <th className="p-3">Endpoint</th>
                  <th className="p-3">Requests</th>
                  <th className="p-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/10 dark:divide-slate-800/50 font-medium">
                {stats.topEndpoints.map((ep) => (
                  <tr key={ep.endpoint} className="hover:bg-slate-500/5 transition-colors">
                    <td className="p-3 text-slate-700 dark:text-slate-350 select-all font-mono font-bold text-[10px]">{ep.endpoint}</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200">{ep.count} hits</td>
                    <td className="p-3 text-right text-blue-500 font-extrabold">{ep.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIUsagePanel;
