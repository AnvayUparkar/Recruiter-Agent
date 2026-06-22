import React from "react";
import { motion } from "framer-motion";
import { FolderGit2, ExternalLink } from "lucide-react";
import { Project } from "../../../types/candidate";

interface ProjectsSectionProps {
  projects?: Project[];
}

const TECH_COLORS: Record<string, string> = {
  python: "#3776ab",
  typescript: "#3178c6",
  javascript: "#f7df1e",
  react: "#61dafb",
  vue: "#42b883",
  angular: "#dd0031",
  node: "#339933",
  nodejs: "#339933",
  go: "#00add8",
  rust: "#dea584",
  java: "#f89820",
  kotlin: "#7f52ff",
  swift: "#fa7343",
  docker: "#2496ed",
  kubernetes: "#326ce5",
  aws: "#ff9900",
  gcp: "#4285f4",
  azure: "#0089d6",
  postgres: "#336791",
  mysql: "#4479a1",
  mongodb: "#47a248",
  redis: "#dc382d",
  graphql: "#e10098",
  tensorflow: "#ff6f00",
  pytorch: "#ee4c2c",
};

const getTechColor = (tech: string): string =>
  TECH_COLORS[tech.toLowerCase().replace(/[^a-z]/g, "")] ?? "#64748b";

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects }) => {
  if (!projects?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.35 }}
      className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <FolderGit2 size={14} className="text-violet-400" />
          </div>
          <span className="text-sm font-bold text-slate-100 tracking-tight">Projects</span>
        </div>
        <span className="text-xs text-slate-500">{projects.length} projects</span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.06 }}
            className="flex flex-col gap-3 p-4 rounded-xl border border-white/6 bg-white/2 hover:bg-white/5 transition-colors group"
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-100 leading-snug">
                {project.name}
              </h3>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-400 transition-colors shrink-0 mt-0.5"
                  aria-label={`Open ${project.name}`}
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {project.description}
              </p>
            )}

            {/* Tech stack chips */}
            {project.technologies?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {project.technologies.map((tech) => {
                  const color = getTechColor(tech);
                  return (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        color,
                        backgroundColor: `${color}14`,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      {tech}
                    </span>
                  );
                })}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProjectsSection;
