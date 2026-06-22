import React, { useEffect, useRef } from "react";
import { FileText, Clipboard, Trash2, HelpCircle } from "lucide-react";

interface JDEditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SAMPLE_TEMPLATES: Record<string, { label: string; text: string }> = {
  ml: {
    label: "ML Engineer",
    text: `We are seeking a Senior Machine Learning Engineer with 5+ years of experience.
The candidate must have strong competence in Python, SQL, and distributed systems.
A strong background in information retrieval, search technologies, and vector databases (such as FAISS) is highly desirable.
Ideal candidates will have experience designing search engines, indexing candidate profiles, and creating rank explainers.
Immediate availability is preferred.`
  },
  pm: {
    label: "Product Manager",
    text: `We are looking for a Senior Product Manager to lead our Core AI platforms.
Requirements:
- 6+ years of product management experience shipping AI/ML SaaS applications.
- Strong technical background in Large Language Models (LLMs) and natural language parsing.
- Excellent stakeholder communication skills.
- Bachelor's or Master's degree in Computer Science, Engineering, or a related technical field.
This is a hybrid position based in San Francisco, CA.`
  },
  frontend: {
    label: "React Developer",
    text: `Join our team as a Staff Frontend Engineer and build premium visual dashboards.
Core Qualifications:
- 7+ years of experience with React, TypeScript, and TailwindCSS.
- Strong knowledge of animation libraries like Framer Motion and custom CSS systems.
- Experience building accessible, screen-reader-friendly applications (WCAG AA compliance).
- Experience setting up Vite configs and code-splitting lazy router trees.
- Degree in Design, CS, or equivalent industry tenure.`
  }
};

export const JDEditorPanel: React.FC<JDEditorPanelProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = value.length;
  const isTooShort = charCount < 50 && charCount > 0;

  // Auto-resize textarea height to fit content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(280, textarea.scrollHeight)}px`;
    }
  }, [value]);

  const handleClear = () => {
    onChange("");
  };

  const loadTemplate = (key: string) => {
    if (disabled) return;
    onChange(SAMPLE_TEMPLATES[key].text);
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200/10 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/60 shadow-xl flex flex-col gap-4.5 select-none relative">
      {/* Editor Header panel */}
      <div className="flex justify-between items-center pb-3.5 border-b border-slate-250/20 dark:border-slate-805">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          <span className="text-xs font-bold text-slate-850 dark:text-slate-250 uppercase tracking-wide">
            Job Description Text
          </span>
        </div>

        {/* Live Character Count Badge */}
        <div className="flex items-center gap-2">
          {isTooShort && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold tracking-wide animate-pulse">
              <HelpCircle size={11} />
              <span>Needs 50+ chars</span>
            </div>
          )}
          <span
            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border 
              ${
                charCount === 0
                  ? "bg-slate-200/50 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-450"
                  : isTooShort
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              }`}
          >
            {charCount.toLocaleString()} Chars
          </span>
        </div>
      </div>

      {/* Main Textarea Container */}
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste the job description criteria here or use the templates below..."
          className="w-full min-h-[280px] rounded-xl p-4 text-xs font-mono leading-relaxed bg-slate-200/30 dark:bg-slate-950/70 border border-slate-250 dark:border-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none shadow-inner-glow"
          aria-invalid={isTooShort}
          aria-label="Paste job description content editor"
        />
      </div>

      {/* Editor controls & sample templates */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-250/20 dark:border-slate-850 text-xs">
        {/* Sample Templates */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
            <Clipboard size={11} />
            <span>Templates:</span>
          </span>
          {Object.entries(SAMPLE_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => loadTemplate(key)}
              disabled={disabled}
              className="px-2.5 py-1 rounded-lg border border-slate-250 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-950/50 text-[10px] font-bold text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors focus-ring outline-none select-none"
            >
              {template.label}
            </button>
          ))}
        </div>

        {/* Clear Button */}
        {value.length > 0 && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg border border-rose-500/10 hover:bg-rose-500/10 text-rose-500 text-[10px] font-bold flex items-center gap-1.5 transition-colors focus-ring outline-none self-end sm:self-center"
            title="Clear all text"
          >
            <Trash2 size={12} />
            <span>Clear Text</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default JDEditorPanel;
