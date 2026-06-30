import React, { useState, useEffect } from "react";
import { useAppStore } from "../store/appStore";
import { useCandidateStore } from "../store/candidateStore";
import { useRanking } from "../hooks/queries/useRanking";
import { reportService } from "../services/reportService";
import { 
  FileDown, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  Download,
  Terminal
} from "lucide-react";

const Reports: React.FC = () => {
  const { parsedJD, rankingResults } = useAppStore();
  const { selectedCandidateId, setSelectedCandidateId } = useCandidateStore();

  const [isCsvExporting, setIsCsvExporting] = useState(false);
  const [csvResult, setCsvResult] = useState<any>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const [isDossierExporting, setIsDossierExporting] = useState(false);
  const [dossierFormat, setDossierFormat] = useState<"json" | "markdown" | "html">("markdown");
  const [dossierResult, setDossierResult] = useState<any>(null);
  const [dossierError, setDossierError] = useState<string | null>(null);

  // Load ranked candidate list to populate candidate dropdown
  const { data: rankingData } = useRanking({
    jobDescription: parsedJD?.raw_text || "",
    enabled: !!parsedJD?.raw_text && !selectedCandidateId,
  });

  // Auto-select first candidate if none active
  useEffect(() => {
    if (!selectedCandidateId && rankingData?.rankedCandidates && rankingData.rankedCandidates.length > 0) {
      setSelectedCandidateId(rankingData.rankedCandidates[0].candidateId);
    }
  }, [rankingData, selectedCandidateId, setSelectedCandidateId]);

  const handleExportCsv = async () => {
    if (!parsedJD) return;
    setIsCsvExporting(true);
    setCsvError(null);
    setCsvResult(null);

    try {
      if (!rankingResults || rankingResults.length !== 50) {
        throw new Error(
          `Invalid candidate count: expected exactly 50 candidates to compile the submission, but found ${
            rankingResults?.length || 0
          } ranked candidates in the store. Please ensure you execute the ranking leaderboard with a limit of 50 first.`
        );
      }

      const sortedByRank = [...rankingResults].sort((a, b) => a.rank - b.rank);

      const ranks = sortedByRank.map((r) => r.rank);
      const uniqueRanks = new Set(ranks);
      if (uniqueRanks.size !== 50) {
        throw new Error("Validation Error: candidate ranks are not unique.");
      }
      for (let i = 1; i <= 50; i++) {
        if (!uniqueRanks.has(i)) {
          throw new Error(`Validation Error: missing rank ${i} in results.`);
        }
      }

      for (let i = 1; i < sortedByRank.length; i++) {
        const prevScore = sortedByRank[i - 1].score ?? sortedByRank[i - 1].finalScore;
        const currScore = sortedByRank[i].score ?? sortedByRank[i].finalScore;
        if (currScore > prevScore) {
          throw new Error(
            `Validation Error: match scores are not in non-increasing order. Rank ${sortedByRank[i].rank} (score: ${currScore}) has a higher score than Rank ${sortedByRank[i - 1].rank} (score: ${prevScore}).`
          );
        }
      }

      const csvRows = ["candidate_id,rank,score,reasoning"];
      for (const r of sortedByRank) {
        const id = r.candidate_id ?? r.candidateId;
        const rank = r.rank;
        const score = (r.score ?? r.finalScore).toFixed(4);
        const reasoning = r.reasoning ?? r.summary ?? "";
        const escapedReasoning = `"${reasoning.replace(/"/g, '""')}"`;
        csvRows.push(`${id},${rank},${score},${escapedReasoning}`);
      }
      const csvContent = csvRows.join("\n");

      const msgUint8 = new TextEncoder().encode(csvContent);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "submission.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCsvResult({
        rowCount: sortedByRank.length,
        timestamp: Date.now(),
        sha256Hash: hashHex,
        exportPath: "submission.csv (Downloaded in browser)",
      });
    } catch (err: any) {
      setCsvError(err.message || "Failed to generate and download submission CSV.");
    } finally {
      setIsCsvExporting(false);
    }
  };

  const handleExportDossier = async () => {
    if (!selectedCandidateId) {
      setDossierError("Please select a candidate profile first.");
      return;
    }
    setIsDossierExporting(true);
    setDossierError(null);
    setDossierResult(null);

    try {
      const res = await reportService.exportReport(selectedCandidateId, dossierFormat);
      setDossierResult(res);

      // Trigger browser download
      const mimeTypes: Record<string, string> = {
        json: "application/json",
        html: "text/html",
        markdown: "text/markdown",
      };
      
      const blob = new Blob([res.content], { type: mimeTypes[dossierFormat] || "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = dossierFormat === "markdown" ? "md" : dossierFormat;
      link.setAttribute("download", `candidate_report_${selectedCandidateId}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDossierError(err.message || "Failed to generate report dossier.");
    } finally {
      setIsDossierExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileDown className="text-blue-500" />
          <span>Export Reports & Submissions</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate standard recruitment leaderboard spreadsheets and download custom print-ready candidate evaluation dossiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: CSV Submission Exporter */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Leaderboard CSV Submission</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate and export the standard submissions CSV containing candidate ranks, calibrated fit scores, confidence scores, and reasoning explanations.
          </p>

          {!parsedJD ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2">
              <AlertTriangle className="shrink-0" />
              <span>Please upload a JD context in the parser wizard to enable CSV exporting.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-2">
              <button
                onClick={handleExportCsv}
                disabled={isCsvExporting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isCsvExporting ? "Compiling & Verifying..." : "Export Submission CSV"}
              </button>

              {csvError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                  {csvError}
                </div>
              )}

              {csvResult && (
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-200/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850">
                  <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold">
                    <CheckCircle2 size={14} />
                    <span>Submission Exported & Verified</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] mt-1 text-slate-500">
                    <div>
                      <span>Row Count:</span>
                      <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5">{csvResult.rowCount} candidates</span>
                    </div>
                    <div>
                      <span>Export Timestamp:</span>
                      <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {new Date(csvResult.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Terminal size={11} />
                      <span>SHA256 checksum</span>
                    </span>
                    <pre className="p-2.5 rounded bg-slate-900 text-[#a6accd] text-[10px] font-mono overflow-x-auto truncate">
                      {csvResult.sha256Hash}
                    </pre>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saved Path:</span>
                    <span className="text-[10px] font-mono text-slate-500 truncate" title={csvResult.exportPath}>
                      {csvResult.exportPath}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Dossier Exporter */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-purple-500" />
            <span>Candidate Dossier Export</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Write structured recruiter reviews, interview questions, and platform scores for a selected candidate into a local file.
          </p>

          <div className="flex flex-col gap-3 mt-2">
            {/* Candidate Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Candidate</label>
              <select
                value={selectedCandidateId || ""}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-200/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {rankingData?.rankedCandidates && rankingData.rankedCandidates.length > 0 ? (
                  rankingData.rankedCandidates.map((c: any) => (
                    <option key={c.candidateId} value={c.candidateId}>
                      {c.candidateId} (Rank {c.rank})
                    </option>
                  ))
                ) : (
                  <option value="">No Candidates Available</option>
                )}
              </select>
            </div>

            {/* Format Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">File Format</label>
              <div className="flex gap-2">
                {(["markdown", "html", "json"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setDossierFormat(fmt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition-all
                      ${dossierFormat === fmt
                        ? "bg-slate-900 dark:bg-blue-600 text-white border-transparent"
                        : "bg-slate-200/50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900/40"}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExportDossier}
              disabled={isDossierExporting || !selectedCandidateId}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 mt-2"
            >
              <Download size={15} />
              <span>{isDossierExporting ? "Generating Dossier..." : "Generate Dossier File"}</span>
            </button>

            {dossierError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {dossierError}
              </div>
            )}

            {dossierResult && (
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-200/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850">
                <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold">
                  <CheckCircle2 size={14} />
                  <span>Dossier File Written</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saved Path:</span>
                  <span className="text-[10px] font-mono text-slate-500 truncate" title={dossierResult.filePath}>
                    {dossierResult.filePath}
                  </span>
                </div>

                {/* Content preview */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">File Content Preview</span>
                  <pre className="p-3 rounded bg-slate-900 text-[#a6accd] text-[10px] font-mono overflow-y-auto max-h-40 whitespace-pre-wrap leading-normal">
                    {dossierResult.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
