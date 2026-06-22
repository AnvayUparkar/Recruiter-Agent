import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";

const routeNameMap: Record<string, string> = {
  dashboard: "Leaderboard",
  "jd-analysis": "JD Parser",
  candidates: "Candidates",
  copilot: "Copilot Report",
  comparison: "Finalist Comparison",
  analytics: "Analytics Hub",
  reports: "Export & Reports",
  settings: "Settings",
  "design-system": "Design System",
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const getBreadcrumbName = (path: string, index: number) => {
    // If it's a candidate ID (usually starts with 'cand_' or is the child of 'candidates')
    if (index > 0 && pathnames[index - 1] === "candidates") {
      return `Dossier: ${path}`;
    }
    return routeNameMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Skip rendering on the root path
  if (location.pathname === "/") {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
      <ol className="flex items-center space-x-1.5 md:space-x-2">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <Home size={14} className="mr-1" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const name = getBreadcrumbName(value, index);

          return (
            <motion.li
              key={to}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              <ChevronRight size={12} className="mx-1 text-slate-400 dark:text-slate-600 shrink-0" />
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[200px]"
                >
                  {name}
                </span>
              ) : (
                <Link
                  to={to}
                  className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors truncate max-w-[120px] sm:max-w-[200px]"
                >
                  {name}
                </Link>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
