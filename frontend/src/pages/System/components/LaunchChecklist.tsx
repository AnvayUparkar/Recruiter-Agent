import React from "react";
import { CheckSquare, Square, Shield, Terminal, Zap, ShieldCheck } from "lucide-react";
import { useLaunchStore, LaunchChecklistState } from "../../../store/launchStore";

export const LaunchChecklist: React.FC = () => {
  const { checklist, toggleCheckItem, resetChecklist } = useLaunchStore();

  const sections: Array<{
    title: string;
    icon: React.ReactNode;
    items: Array<{ key: keyof LaunchChecklistState; label: string; desc: string }>;
  }> = [
    {
      title: "Security Auditing",
      icon: <Shield size={16} className="text-blue-500" />,
      items: [
        { key: "httpsEnabled", label: "Enforce HTTPS Protocol", desc: "Redirect HTTP requests to SSL connections" },
        { key: "secretsExternalized", label: "Externalize System Keys", desc: "No plaintext keys committed to source control" },
        { key: "corsConfigured", label: "Restrict CORS Policies", desc: "Configure server origin parameters securely" },
        { key: "rateLimitingEnabled", label: "Enable API Rate Limits", desc: "Enforce gateway throttling thresholds" },
        { key: "authSecure", label: "Secure Sessions & Tokens", desc: "Set HttpOnly flags and JWT security keys" },
      ],
    },
    {
      title: "QA & Verification",
      icon: <Terminal size={16} className="text-purple-500" />,
      items: [
        { key: "unitTestsPassed", label: "Run Automated Tests", desc: "Run type checks, accessibility, and node specs" },
        { key: "accessibilityAudited", label: "WCAG AA Compliance", desc: "Check visual contrast, focus, and headings" },
        { key: "responsiveVerified", label: "Responsive Layout Auditing", desc: "Verify mobile stack grids and screen viewports" },
        { key: "offlineReady", label: "Configure Offline Shell", desc: "Deploy Service Worker static and API caches" },
      ],
    },
    {
      title: "DevOps & Infrastructure",
      icon: <Zap size={16} className="text-amber-500" />,
      items: [
        { key: "ciCdConfigured", label: "CI/CD Deployment Pipelines", desc: "Trigger automated builds upon main pushes" },
        { key: "backupsEnabled", label: "Database Backup Routines", desc: "Schedule metadata and profile daily logs" },
        { key: "monitoringConfigured", label: "Gateway Observability Logs", desc: "Track request latency spikes and error counts" },
        { key: "healthChecksActive", label: "Active Endpoint Heartbeats", desc: "Ping microservice health gateways" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={18} className="text-blue-500 animate-pulse" />
          <span>Launch Verification Checklist</span>
        </h3>
        <button
          onClick={resetChecklist}
          className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-805 bg-slate-200/50 dark:bg-slate-950 text-[10px] font-black uppercase text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-250 dark:hover:bg-slate-900 transition-all focus-ring outline-none"
        >
          Reset Checklist
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((sec) => (
          <div key={sec.title} className="glass-panel p-5 rounded-xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-100/40 dark:bg-slate-900/30 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/10 dark:border-slate-800/50">
              {sec.icon}
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {sec.title}
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {sec.items.map((item) => {
                const checked = checklist[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleCheckItem(item.key)}
                    className="flex gap-3 cursor-pointer group select-none"
                  >
                    <div className="pt-0.5 shrink-0 transition-transform duration-200 group-hover:scale-110">
                      {checked ? (
                        <CheckSquare size={16} className="text-blue-500 fill-blue-500/10" />
                      ) : (
                        <Square size={16} className="text-slate-400 dark:text-slate-600" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-bold transition-colors duration-150 ${checked ? "text-slate-900 dark:text-slate-200" : "text-slate-500 dark:text-slate-500"}`}>
                        {item.label}
                      </span>
                      <span className="text-[9px] text-slate-450 dark:text-slate-500 leading-normal mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LaunchChecklist;
