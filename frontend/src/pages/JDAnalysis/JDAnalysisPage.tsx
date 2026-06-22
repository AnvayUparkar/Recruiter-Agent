import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/appStore";
import { useJDAnalysis } from "../../hooks/queries/useJDAnalysis";
import { BrainCircuit, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { JDUploadCard } from "./JDUploadCard";
import { JDEditorPanel } from "./JDEditorPanel";
import { AnalyzeButton } from "./AnalyzeButton";
import { AnalysisProgress } from "./AnalysisProgress";
import { AISummaryCard } from "./AISummaryCard";
import { SkillsSection } from "./SkillsSection";
import { RequirementsSection } from "./RequirementsSection";
import { ResponsibilitiesSection } from "./ResponsibilitiesSection";
import { PreferredSection } from "./PreferredSection";
import { EducationSection } from "./EducationSection";
import { ExperienceSection } from "./ExperienceSection";
import { ConfidencePanel } from "./ConfidencePanel";
import { ExtractedMetadata } from "./ExtractedMetadata";
import { AnalysisTimeline } from "./AnalysisTimeline";
import { ContinueCTA } from "./ContinueCTA";
import { ParsedJD } from "../../types/common";

const DEFAULT_TEXT = `We are seeking a Senior Machine Learning Engineer with 5+ years of experience.
The candidate must have strong competence in Python, SQL, and distributed systems.
A strong background in information retrieval, search technologies, and vector databases (such as FAISS) is highly desirable.
Ideal candidates will have experience designing search engines, indexing candidate profiles, and creating rank explainers.
Immediate availability is preferred.`;

export const JDAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { parsedJD, setParsedJD, setActiveJDText, setActiveJD } = useAppStore();

  const [jdText, setJdText] = useState(parsedJD?.raw_text || parsedJD?.rawText || DEFAULT_TEXT);
  const [lastAnalyzedText, setLastAnalyzedText] = useState(parsedJD?.raw_text || parsedJD?.rawText || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingParsedJD, setPendingParsedJD] = useState<ParsedJD | null>(null);

  const jdAnalysisMutation = useJDAnalysis();

  const isTooShort = jdText.trim().length < 50;
  const hasChanges = parsedJD !== null && jdText !== lastAnalyzedText;

  // Load existing data from global store on mount
  useEffect(() => {
    if (parsedJD) {
      const text = parsedJD.raw_text || parsedJD.rawText || "";
      setJdText(text);
      setLastAnalyzedText(text);
    }
  }, [parsedJD]);

  const handleEditorChange = (val: string) => {
    setJdText(val);
    setErrorMsg(null);
  };

  const handleTextLoaded = (text: string) => {
    setJdText(text);
    setErrorMsg(null);
  };

  const handleAnalyze = () => {
    if (isTooShort) {
      setErrorMsg("Please enter a job description of at least 50 characters to ensure accurate parsing.");
      return;
    }

    setErrorMsg(null);
    jdAnalysisMutation.mutate(jdText, {
      onSuccess: (data) => {
        // Hold parsed data and trigger the step checklist simulation progress
        setPendingParsedJD(data);
        setIsAnalyzing(true);
      },
      onError: (err) => {
        setErrorMsg(err.message || "An error occurred while analyzing the job description.");
      },
    });
  };

  const handleLoadingComplete = () => {
    if (pendingParsedJD) {
      // Complete state updates
      setParsedJD(pendingParsedJD);
      if (setActiveJD) {
        setActiveJD(pendingParsedJD);
      }
      setActiveJDText(jdText);
      setLastAnalyzedText(jdText);
      setIsAnalyzing(false);
      setPendingParsedJD(null);
    }
  };

  const handleReset = () => {
    setParsedJD(null);
    if (setActiveJD) {
      setActiveJD(null);
    }
    setActiveJDText("");
    setJdText(DEFAULT_TEXT);
    setLastAnalyzedText("");
    setPendingParsedJD(null);
    setIsAnalyzing(false);
    setErrorMsg(null);
  };

  const handleProceed = () => {
    navigate("/dashboard");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/10 dark:border-slate-800/50 pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
            <BrainCircuit className="text-blue-500 shrink-0" size={28} />
            <span>Job Intelligence Parser</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Extract vector profiles, certifications, experience guidelines, and weights to index matching candidates.
          </p>
        </div>
        {parsedJD && (
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-slate-350 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-950/50 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-405 font-bold text-xs flex items-center gap-2 transition-colors outline-none focus-ring"
            title="Reset and clear all analysis data"
          >
            <RefreshCw size={13} />
            <span>Reset Parser</span>
          </button>
        )}
      </div>

      {/* Error alert banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-3 shadow-md">
          <AlertCircle className="shrink-0 text-rose-500" size={16} />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Panels Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Input Section */}
        <div className="xl:col-span-5 flex flex-col gap-6 w-full">
          <JDEditorPanel
            value={jdText}
            onChange={handleEditorChange}
            disabled={isAnalyzing || jdAnalysisMutation.isPending || isUploading}
          />

          {!parsedJD && !isAnalyzing && (
            <JDUploadCard
              onTextLoaded={handleTextLoaded}
              onUploadingStateChange={setIsUploading}
              disabled={isUploading || jdAnalysisMutation.isPending}
            />
          )}

          {(!parsedJD || hasChanges) && (
            <AnalyzeButton
              onClick={handleAnalyze}
              isLoading={isAnalyzing || jdAnalysisMutation.isPending}
              disabled={isTooShort || isUploading}
            />
          )}
        </div>

        {/* Right Output / Dashboard Section */}
        <div className="xl:col-span-7 w-full">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="loading-timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <AnalysisProgress
                  isPending={isAnalyzing}
                  onComplete={handleLoadingComplete}
                />
              </motion.div>
            ) : parsedJD ? (
              <motion.div
                key="dossier-results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
                className="flex flex-col gap-6"
              >
                {/* Executive Dossier Badge Header */}
                <AISummaryCard
                  title={parsedJD.job_title}
                  company={parsedJD.company_name}
                  summary={parsedJD.summary}
                  seniority={parsedJD.leadership}
                  confidence={parsedJD.confidence}
                />

                {/* Score meters & extraction timeline checklists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ConfidencePanel
                    confidence={parsedJD.confidence}
                    extractedCount={parsedJD.must_have.length + parsedJD.good_to_have.length}
                    totalEstimatedCount={14}
                  />
                  <AnalysisTimeline
                    titleDetected={!!parsedJD.job_title}
                    requiredSkillsCount={parsedJD.must_have.length}
                    preferredSkillsCount={parsedJD.good_to_have.length}
                    experienceRange={parsedJD.experience_range}
                    educationCount={parsedJD.degrees.length + parsedJD.certifications.length}
                    responsibilitiesCount={parsedJD.responsibilities.length}
                    metadataCount={4}
                  />
                </div>

                {/* Requirements details */}
                <RequirementsSection
                  experienceRange={parsedJD.experience_range}
                  leadership={parsedJD.leadership}
                  domain={parsedJD.domain}
                  workMode={parsedJD.work_mode}
                />

                {/* Experience visual tenure track */}
                <ExperienceSection
                  experienceRange={parsedJD.experience_range}
                  highlights={[parsedJD.job_title, parsedJD.domain]}
                />

                {/* Skills section */}
                <SkillsSection
                  mustHave={parsedJD.must_have}
                  niceToHave={parsedJD.good_to_have}
                />

                {/* Responsibilities list */}
                <ResponsibilitiesSection items={parsedJD.responsibilities} />

                {/* Academic credentials and preferred certificates side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EducationSection
                    degrees={parsedJD.degrees}
                    certifications={parsedJD.certifications}
                  />
                  <PreferredSection items={parsedJD.preferred_qualifications} />
                </div>

                {/* Extracted administration parameters */}
                <ExtractedMetadata
                  location={parsedJD.location_preferences && parsedJD.location_preferences.length > 0 ? parsedJD.location_preferences.join(", ") : "Not Specified"}
                  salaryRange={parsedJD.salary_range}
                  noticePeriod={parsedJD.notice_period}
                  employmentType={parsedJD.employmentType || "Full-Time"}
                />

                {/* Funnel conversion proceed CTA */}
                <div className="pt-2">
                  <ContinueCTA onClick={handleProceed} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-standby"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel p-10 md:p-16 rounded-2xl border border-dashed border-slate-350 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/10 flex flex-col items-center justify-center text-center gap-5"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 dark:border-blue-400/20 flex items-center justify-center text-blue-500">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    Parser Dossier Standby
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                    Paste or load a raw job description in the editor pane. Trigger the model parse sweep to review semantic vectors here.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default JDAnalysisPage;
