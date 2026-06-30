import React, { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { Link } from "react-router-dom";
import { healthService } from "../../services/healthService";
import { useLaunchStore } from "../../store/launchStore";

export const Footer: React.FC = () => {
  const [health, setHealth] = useState<{ status: string; version: string }>({
    status: "checking",
    version: "v1.0.0",
  });
  const { checklist } = useLaunchStore();
  const totalChecks = Object.values(checklist);
  const score = Math.round((totalChecks.filter(Boolean).length / totalChecks.length) * 100);

  useEffect(() => {
    let active = true;
    const fetchSystemInfo = async () => {
      try {
        const info = await healthService.fetchHealth();
        const ver = await healthService.fetchVersion();
        if (active) {
          setHealth({
            status: info.status || "healthy",
            version: ver.version || "1.0.0",
          });
        }
      } catch (err) {
        if (active) {
          setHealth({ status: "offline", version: "v1.0.0" });
        }
      }
    };

    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 60000); // refresh health every 60s
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <footer className="py-5 px-6 border-t border-slate-200/10 dark:border-slate-800/40 bg-slate-200/10 dark:bg-slate-900/10 text-slate-500 flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
      <div className="flex items-center gap-1.5">
        <span>© {new Date().getFullYear()} Nexa AI TRC. All rights reserved.</span>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/launch" className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
          <span>Readiness Score:</span>
          <span className="font-semibold text-slate-650 dark:text-slate-350">
            {score}%
          </span>
        </Link>
        <span className="text-slate-300 dark:text-slate-800">|</span>
        <div className="flex items-center gap-1.5">
          <Server size={12} className="text-slate-400 dark:text-slate-600" />
          <span>Core Gateway:</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {health.version}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${health.status === "healthy"
                ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                : health.status === "offline"
                  ? "bg-rose-500 shadow-sm shadow-rose-500/50"
                  : "bg-amber-500 animate-pulse"
              }`}
            title={`System status: ${health.status}`}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
