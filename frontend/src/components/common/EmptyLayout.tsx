import React from "react";
import AppShell from "../../layouts/AppLayout/AppShell";
import GuidedTour from "../../pages/Demo/components/GuidedTour.tsx";

interface EmptyLayoutProps {
  children: React.ReactNode;
}

export const EmptyLayout: React.FC<EmptyLayoutProps> = ({ children }) => {
  return (
    <AppShell>
      <div className="min-h-screen w-full flex flex-col bg-[#f6f8fa] dark:bg-[#0d1117] text-slate-800 dark:text-slate-200 transition-colors duration-300">
        {children}
        <GuidedTour />
      </div>
    </AppShell>
  );
};

export default EmptyLayout;
