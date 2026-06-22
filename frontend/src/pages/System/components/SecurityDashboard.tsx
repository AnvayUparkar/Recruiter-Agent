import React from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, Lock, Globe, Server, UserCheck, Key } from "lucide-react";

interface AuditItem {
  id: string;
  name: string;
  desc: string;
  status: "pass" | "warn" | "fail";
  icon: React.ReactNode;
}

export const SecurityDashboard: React.FC = () => {
  const audits: AuditItem[] = [
    { id: "s-01", name: "HTTPS Transport Enforcement", desc: "Forcing SSL encryption on static host pages", status: "pass", icon: <Lock size={15} /> },
    { id: "s-02", name: "CORS Whitelist Controls", desc: "API handles requests from defined origins only", status: "pass", icon: <Globe size={15} /> },
    { id: "s-03", name: "Throttling Rate Limiters", desc: "No threshold limit triggers active in staging", status: "warn", icon: <Server size={15} /> },
    { id: "s-04", name: "Sanitizer Input Parsers", desc: "Lexical checks filter script injections", status: "pass", icon: <ShieldCheck size={15} /> },
    { id: "s-05", name: "JWT Token Handshakes", desc: "Auth routes sign credentials securely", status: "pass", icon: <UserCheck size={15} /> },
    { id: "s-06", name: "Security Cookies (HttpOnly)", desc: "Credentials stashed with secure attributes", status: "pass", icon: <Key size={15} /> },
    { id: "s-07", name: "Audited Package Dependencies", desc: "Vulnerabilities parsed with npm audit checks", status: "warn", icon: <ShieldCheck size={15} /> }
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <ShieldCheck size={16} className="text-blue-500" />
        <span>Enterprise Security Audits</span>
      </h3>

      <div className="flex flex-col gap-2.5">
        {audits.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200/5 dark:border-slate-850 bg-slate-200/10 dark:bg-slate-950/20 gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-900 text-slate-450 border border-slate-300/10 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-855 dark:text-slate-200 truncate">
                  {item.name}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-500 truncate max-w-[280px] sm:max-w-md">
                  {item.desc}
                </span>
              </div>
            </div>

            {item.status === "pass" ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-505 dark:text-emerald-400 font-extrabold uppercase shrink-0">
                <CheckCircle2 size={13} />
                <span>Passed</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-amber-505 dark:text-amber-400 font-extrabold uppercase shrink-0">
                <AlertTriangle size={13} />
                <span>Audit Warn</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityDashboard;
