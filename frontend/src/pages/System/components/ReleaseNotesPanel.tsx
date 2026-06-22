import React from "react";
import { ClipboardList, Award, Flame } from "lucide-react";

export const ReleaseNotesPanel: React.FC = () => {
  const notes = [
    {
      version: "v1.4.0",
      title: "Final Launch Readiness & DevOps",
      date: "June 2026 (Phase 14)",
      badge: "Current Release",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      changes: [
        "DevOps Cockpit with global readiness scoring rings.",
        "System configuration backups (JSON export/restore) and presets management.",
        "Environment variables masking and active secret validation indicators.",
        "Live heartbeat status monitors for microservices, servers, and models.",
        "Judge presentation shortcuts and deliverables package checklists.",
      ],
    },
    {
      version: "v1.3.0",
      title: "Performance & PWA Offline Support",
      date: "June 2026 (Phase 13)",
      badge: "Production Polish",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      changes: [
        "PWA Service Worker integration with asset and API precaching.",
        "Bundle size optimization, tree-shaking, and lazy loading routing logic.",
        "Accessibility audit fixes (WCAG AA color contrast, dynamic keyboard traps).",
        "Offline-ready indicators, graceful connection drops, local storage failovers.",
      ],
    },
    {
      version: "v1.2.0",
      title: "AI Demo Mode & Guided Tour",
      date: "May 2026 (Phase 12)",
      badge: "Showcase Ready",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      changes: [
        "Cinematic Judge Mode with auto-pilot product tours.",
        "Interactive scenario switcher for custom candidate data loading.",
        "High-contrast highlight overlays and feature tour navigation steps.",
        "Confetti celebrations on rank matching triggers.",
      ],
    },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ClipboardList size={16} className="text-emerald-500" />
          <span>Product Release Log</span>
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <Award size={12} className="text-amber-500 animate-bounce" />
          <span>Hackathon Build</span>
        </div>
      </div>

      <div className="flex flex-col gap-5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
        {notes.map((note) => (
          <div key={note.version} className="flex flex-col gap-2.5 pb-4 last:pb-0 border-b border-slate-200/10 dark:border-slate-805 last:border-b-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300/10">
                  {note.version}
                </span>
                <span className="text-[11px] font-extrabold text-slate-850 dark:text-slate-100">
                  {note.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">
                  {note.date}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${note.badgeColor}`}>
                  {note.badge}
                </span>
              </div>
            </div>

            <ul className="flex flex-col gap-1.5 pl-2 list-none">
              {note.changes.map((change, idx) => (
                <li key={idx} className="text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-2 leading-relaxed">
                  <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-blue-500" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[9px] leading-relaxed">
        <Flame size={14} className="shrink-0" />
        <span>
          <strong>Beta Notice:</strong> All features are fully functional. AI evaluations are using local model virtualization when offline.
        </span>
      </div>
    </div>
  );
};

export default ReleaseNotesPanel;
