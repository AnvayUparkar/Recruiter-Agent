import React from "react";
import { ShieldCheck, Info, Check, X } from "lucide-react";

export const RolePermissionsPanel: React.FC = () => {
  const permissions = [
    { name: "Configure AI models & scoring weights", admin: true, recruiter: false, hiringManager: false, viewer: false },
    { name: "Toggle system-wide Feature Flags", admin: true, recruiter: false, hiringManager: false, viewer: false },
    { name: "Manage user accounts & edit roles", admin: true, recruiter: false, hiringManager: false, viewer: false },
    { name: "Control system maintenance mode", admin: true, recruiter: false, hiringManager: false, viewer: false },
    { name: "Inspect hardware diagnostics & audit logs", admin: true, recruiter: true, hiringManager: false, viewer: false },
    { name: "Calibrate jobs & run ranking engines", admin: true, recruiter: true, hiringManager: true, viewer: false },
    { name: "Compare candidates side-by-side", admin: true, recruiter: true, hiringManager: true, viewer: true },
    { name: "Export submission files & CSV results", admin: true, recruiter: true, hiringManager: true, viewer: true },
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <ShieldCheck className="text-blue-500" size={20} />
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Role Permissions Matrix
          </h3>
          <p className="text-xs text-slate-400">Review Role-Based Access Control (RBAC) security schemas</p>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="overflow-x-auto border border-slate-200/10 dark:border-slate-800/50 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-500/5 text-slate-400 font-extrabold uppercase border-b border-slate-200/10 dark:border-slate-800/50 select-none">
              <th className="p-4 w-1/2">Permission Rule</th>
              <th className="p-4 text-center">Admin</th>
              <th className="p-4 text-center">Recruiter</th>
              <th className="p-4 text-center">Hiring Manager</th>
              <th className="p-4 text-center">Viewer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/10 dark:divide-slate-800/50 font-bold">
            {permissions.map((p) => (
              <tr key={p.name} className="hover:bg-slate-500/5 transition-colors">
                <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{p.name}</td>
                
                {/* Admin */}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    {p.admin ? (
                      <Check className="text-emerald-500 bg-emerald-500/10 rounded p-0.5" size={18} />
                    ) : (
                      <X className="text-slate-550 bg-slate-500/10 rounded p-0.5" size={18} />
                    )}
                  </div>
                </td>

                {/* Recruiter */}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    {p.recruiter ? (
                      <Check className="text-emerald-500 bg-emerald-500/10 rounded p-0.5" size={18} />
                    ) : (
                      <X className="text-slate-550 bg-slate-500/10 rounded p-0.5" size={18} />
                    )}
                  </div>
                </td>

                {/* Hiring Manager */}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    {p.hiringManager ? (
                      <Check className="text-emerald-500 bg-emerald-500/10 rounded p-0.5" size={18} />
                    ) : (
                      <X className="text-slate-550 bg-slate-500/10 rounded p-0.5" size={18} />
                    )}
                  </div>
                </td>

                {/* Viewer */}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    {p.viewer ? (
                      <Check className="text-emerald-500 bg-emerald-500/10 rounded p-0.5" size={18} />
                    ) : (
                      <X className="text-slate-550 bg-slate-500/10 rounded p-0.5" size={18} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/5 flex items-start gap-2.5">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={14} />
        <p className="text-[10px] text-slate-400 leading-normal">
          This matrix is mock-integrated with the active routing router. Changing permission checks dynamically will require updating database RBAC schemas in production environments.
        </p>
      </div>
    </div>
  );
};

export default RolePermissionsPanel;
