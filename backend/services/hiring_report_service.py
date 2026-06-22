"""Hiring Report Service — Phase 15: AI Recruiter Copilot.

Formulates recruiter reports into JSON, Markdown, and beautifully-designed HTML sheets.
"""

import json
from pathlib import Path
from models.recruiter_report import RecruiterReport
from utils.logger import get_logger

logger = get_logger(__name__)


class HiringReportService:
    """Handles formatting and file exporting of candidate recruiter reports."""

    @staticmethod
    def generate_report(report: RecruiterReport, format_type: str = "json") -> str:
        """Serializes the recruiter report into JSON, Markdown, or HTML.

        Args:
            report: The RecruiterReport model.
            format_type: 'json' | 'markdown' | 'html'.

        Returns:
            str: The formatted report string content.
        """
        fmt = format_type.lower().strip()
        if fmt == "json":
            return json.dumps(report.model_dump(), indent=4, default=str)
        elif fmt == "markdown":
            return HiringReportService._generate_markdown(report)
        elif fmt == "html":
            return HiringReportService._generate_html(report)
        else:
            raise ValueError(f"Unsupported export format: {format_type}")

    @staticmethod
    def export_report(
        report: RecruiterReport,
        output_dir: Path,
        filename: str,
        format_type: str = "json",
    ) -> Path:
        """Writes the formatted report to a disk file.

        Args:
            report: The RecruiterReport model.
            output_dir: Output directory path.
            filename: Target base name of file (without extension).
            format_type: 'json' | 'markdown' | 'html'.

        Returns:
            Path: Path of the exported file.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        ext = "json" if format_type == "json" else ("md" if format_type == "markdown" else "html")
        file_path = output_dir / f"{filename}.{ext}"

        content = HiringReportService.generate_report(report, format_type)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        logger.info(f"Successfully exported candidate report to: {file_path}")
        return file_path

    @staticmethod
    def _generate_markdown(report: RecruiterReport) -> str:
        """Assembles Markdown content."""
        r = report
        h = r.hire_recommendation
        
        md = []
        md.append(f"# Recruiter Intelligence Report: Candidate {r.candidate_id}")
        md.append(f"\n**Verdict**: {h.recommendation} (Confidence: {h.confidence * 100:.0f}%)")
        md.append(f"\n## Recruiter Summary\n{r.recruiter_summary}")
        
        md.append("\n## Key Strengths")
        for s in r.strengths:
            md.append(f"- {s}")
            
        md.append("\n## Areas to Address (Weaknesses)")
        for w in r.weaknesses:
            md.append(f"- {w}")
            
        md.append("\n## Risk Analysis Summary")
        if r.risks:
            for risk in r.risks:
                md.append(f"- [!] {risk}")
        else:
            md.append("No critical risk items identified.")
            
        md.append("\n## Suggested Interview Focus Areas")
        for focus in r.interview_focus:
            md.append(f"- {focus}")

        md.append("\n## Supporting Evidence Logs")
        for ev in r.evidence:
            md.append(f"- {ev}")

        md.append(f"\n\n*Overall Assessment*: {r.overall_assessment}")
        md.append(f"\nGenerated At: {r.generated_at}")
        
        return "\n".join(md)

    @staticmethod
    def _generate_html(report: RecruiterReport) -> str:
        """Generates a premium glassmorphic styled HTML page."""
        r = report
        h = r.hire_recommendation
        
        # Color classes depending on verdict
        verdict = h.recommendation
        badge_style = "background: rgba(220, 38, 38, 0.15); color: #ef4444;"
        if verdict == "Strong Hire":
            badge_style = "background: rgba(16, 185, 129, 0.15); color: #10b981;"
        elif verdict == "Hire":
            badge_style = "background: rgba(59, 130, 246, 0.15); color: #3b82f6;"
        elif verdict == "Interview":
            badge_style = "background: rgba(245, 158, 11, 0.15); color: #f59e0b;"
        elif verdict == "Consider":
            badge_style = "background: rgba(107, 114, 128, 0.15); color: #6b7280;"

        strengths_li = "".join([f"<li>{s}</li>" for s in r.strengths])
        weaknesses_li = "".join([f"<li>{s}</li>" for s in r.weaknesses])
        risks_li = "".join([f"<li><span style='color:#ef4444;'>⚠</span> {s}</li>" for s in r.risks]) if r.risks else "<li>No critical risk signals flagged.</li>"
        focus_li = "".join([f"<li>{s}</li>" for s in r.interview_focus])
        evidence_li = "".join([f"<li>{s}</li>" for s in r.evidence])

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recruiter Copilot Report - {r.candidate_id}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-color: #0d1117;
            --card-bg: rgba(22, 27, 34, 0.7);
            --border-color: rgba(240, 246, 252, 0.1);
            --text-primary: #c9d1d9;
            --text-muted: #8b949e;
        }}
        body {{
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }}
        .report-card {{
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 40px;
            max-width: 800px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .title {{
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(90deg, #58a6ff, #bc8cff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .badge {{
            padding: 8px 16px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.5px;
            {badge_style}
        }}
        .section {{
            margin-bottom: 30px;
        }}
        .section-title {{
            font-size: 18px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 12px;
            color: #58a6ff;
        }}
        p {{
            line-height: 1.6;
            margin: 0;
        }}
        ul {{
            margin: 0;
            padding-left: 20px;
            line-height: 1.6;
        }}
        li {{
            margin-bottom: 8px;
        }}
        .grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }}
        .grid-card {{
            background: rgba(240, 246, 252, 0.03);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
        }}
        .footer {{
            border-top: 1px solid var(--border-color);
            padding-top: 20px;
            font-size: 12px;
            color: var(--text-muted);
            display: flex;
            justify-content: space-between;
        }}
    </style>
</head>
<body>
    <div class="report-card">
        <div class="header">
            <div>
                <h1 class="title">Candidate Intelligence Report</h1>
                <div style="font-size:14px; color:var(--text-muted); margin-top:4px;">ID: {r.candidate_id}</div>
            </div>
            <span class="badge">{verdict}</span>
        </div>

        <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <p>{r.recruiter_summary}</p>
        </div>

        <div class="grid">
            <div class="grid-card">
                <h3 class="section-title" style="color:#10b981;">Core Strengths</h3>
                <ul>{strengths_li}</ul>
            </div>
            <div class="grid-card">
                <h3 class="section-title" style="color:#f59e0b;">Potential Gaps</h3>
                <ul>{weaknesses_li}</ul>
            </div>
        </div>

        <div class="grid">
            <div class="grid-card">
                <h3 class="section-title" style="color:#ef4444;">Verification Risks</h3>
                <ul>{risks_li}</ul>
            </div>
            <div class="grid-card">
                <h3 class="section-title" style="color:#3b82f6;">Suggested Focus</h3>
                <ul>{focus_li}</ul>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title" style="color:#bc8cff;">Supporting Evidence Logs</h2>
            <ul>{evidence_li}</ul>
        </div>

        <div class="section" style="background:rgba(88,166,255,0.05); padding:20px; border-radius:12px; border:1px dashed rgba(88,166,255,0.2);">
            <h2 class="section-title" style="margin-bottom:8px;">Hiring Verdict Explanation</h2>
            <p><strong>Reasoning:</strong> {h.reasoning}</p>
            <p style="margin-top:8px;"><em>Overall:</em> {r.overall_assessment}</p>
        </div>

        <div class="footer">
            <span>Model confidence: {h.confidence * 100:.0f}%</span>
            <span>Generated: {r.generated_at}</span>
        </div>
    </div>
</body>
</html>
"""
        return html
