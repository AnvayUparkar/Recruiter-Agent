import React from "react";
import { Server, Activity, Database, Shield, Zap, Sparkles, Cpu, Bot } from "lucide-react";

interface StatusItem {
  name: string;
  status: "online" | "healthy" | "degraded" | "offline";
  latency?: string;
  icon: React.ReactNode;
}

export const DeploymentStatusCard: React.FC = () => {
  const services: StatusItem[] = [
    { name: "Frontend Static Host", status: "healthy", latency: "12ms", icon: <Server size={14} /> },
    { name: "Python API Server", status: "healthy", latency: "145ms", icon: <Activity size={14} /> },
    { name: "FAISS Index Nodes", status: "healthy", latency: "38ms", icon: <Database size={14} /> },
    { name: "Sentence Transformer Embedder", status: "online", latency: "210ms", icon: <Cpu size={14} /> },
    { name: "PostgreSQL Database", status: "healthy", latency: "8ms", icon: <Database size={14} /> },
    { name: "Redis Cache System", status: "healthy", latency: "2ms", icon: <Zap size={14} /> },
    { name: "Background Sync Jobs", status: "online", latency: "Pending", icon: <Shield size={14} /> },
    { name: "OpenAI Model Gateway", status: "healthy", latency: "640ms", icon: <Bot size={14} /> }
  ];

  const getStatusBadge = (status: StatusItem["status"]) => {
    switch (status) {
      case "healthy":
      case "online":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "degraded":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "offline":
      default:
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Sparkles size={16} className="text-blue-500" />
        <span>Subsystem Heartbeat Monitoring</span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {services.map((service) => (
          <div
            key={service.name}
            className="p-3.5 rounded-xl border border-slate-200/10 dark:border-slate-850 bg-slate-200/20 dark:bg-slate-950/40 flex flex-col gap-2 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-900 text-slate-450 border border-slate-300/10">
                {service.icon}
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border animate-pulse ${getStatusBadge(service.status)}`}>
                {service.status}
              </span>
            </div>

            <div className="flex flex-col mt-1">
              <span className="text-[10px] font-bold text-slate-805 dark:text-slate-200 truncate">
                {service.name}
              </span>
              <span className="text-[9px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">
                Latency: {service.latency || "N/A"}
              </span>
            </div>
            
            {/* Small glowing dot background */}
            <div className="absolute right-1 bottom-1 w-2.5 h-2.5 rounded-full bg-emerald-500/5 blur-[2px]" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeploymentStatusCard;
