import React from "react";
import { LayoutDashboard, Sliders, ShieldAlert, Cpu } from "lucide-react";
import { useAdminStore } from "../../../store/adminStore";

interface SidebarItemProps {
  label: string;
  id: "overview" | "calibrations" | "access" | "monitoring";
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const AdminSidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAdminStore();

  const items: SidebarItemProps[] = [
    { label: "System Overview", id: "overview", icon: LayoutDashboard },
    { label: "AI Calibrations", id: "calibrations", icon: Sliders },
    { label: "User Access Control", id: "access", icon: ShieldAlert },
    { label: "Diagnostics & Logs", id: "monitoring", icon: Cpu },
  ];

  return (
    <nav 
      aria-label="Admin Sections"
      className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-slate-200/10 dark:border-slate-800/50 pr-0 md:pr-4 min-w-0 md:w-64 shrink-0"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 outline-none whitespace-nowrap md:whitespace-normal w-full group ${
              isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15"
                : "text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/40"
            }`}
            aria-selected={isActive}
            role="tab"
          >
            <Icon 
              className={`shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              }`} 
              size={18} 
            />
            <span>{item.label}</span>
            {isActive && (
              <span className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default AdminSidebar;
