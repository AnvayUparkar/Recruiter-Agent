import React from "react";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  subtitle,
  icon,
  actions,
  className = "",
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 ${className}`}>
      <div className="flex items-start gap-3.5">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-500 shadow-sm shadow-blue-500/5 shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageTitle;
