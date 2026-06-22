import React from "react";

interface NavSectionProps {
  label: string;
  isCollapsed?: boolean;
}

export const NavSection: React.FC<NavSectionProps> = ({ label, isCollapsed = false }) => {
  if (isCollapsed) {
    return <hr className="my-4 border-slate-200/10 dark:border-slate-800/40" />;
  }

  return (
    <div className="px-4 pt-5 pb-2">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-650 uppercase tracking-widest block">
        {label}
      </span>
    </div>
  );
};

export default NavSection;
