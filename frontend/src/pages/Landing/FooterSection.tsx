import React from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../../components/navigation/ThemeToggle";
import { Server } from "lucide-react";

export const FooterSection: React.FC = () => {
  return (
    <footer className="w-full py-10 border-t border-slate-200/10 dark:border-slate-800/30 bg-slate-100 dark:bg-slate-950/80 z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left column: logo name and copyright */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-[10px] shadow shadow-blue-500/20 shrink-0">
              LA
            </div>
            <span className="font-extrabold text-xs tracking-wide text-slate-900 dark:text-slate-100">
              Antigravity TA
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">
            © {new Date().getFullYear()} Antigravity TA. Candidate Vetting Calibrations.
          </span>
        </div>

        {/* Middle column: secondary links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider">
          <Link to="/design-system" className="hover:text-blue-500 transition-colors">
            Documentation
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-colors"
          >
            GitHub
          </a>
          <Link to="/settings" className="hover:text-blue-500 transition-colors">
            API Health
          </Link>
          <Link to="/dashboard" className="hover:text-blue-500 transition-colors">
            Leaderboard
          </Link>
        </div>

        {/* Right column: theme toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-450">
            <Server size={11} className="shrink-0" />
            <span className="font-bold">v1.2 Dev</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
