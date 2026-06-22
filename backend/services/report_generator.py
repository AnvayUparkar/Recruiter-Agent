"""Report Generator Service — Phase 14: Production API & Recruiter Suite.

Generates PDF summaries of candidate rankings. Falls back to Markdown/HTML if ReportLab is missing.
"""

import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from models.ranked_candidate import RankedCandidate
from models.evaluation_report import EvaluationReport
from utils.logger import get_logger

logger = get_logger(__name__)

# Check if reportlab is available
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.warning("ReportLab is not installed. PDF report generator will fall back to Markdown/HTML.")


class ReportGenerator:
    """Generates print-ready recruiter evaluations and pool summaries."""

    @staticmethod
    def generate_report(
        job_title: str,
        ranked_candidates: List[RankedCandidate],
        evaluation_report: EvaluationReport,
        output_dir: Path,
    ) -> Path:
        """Builds a summary report. Uses ReportLab for PDF, falls back to MD/HTML.

        Args:
            job_title: Evaluated Job Title.
            ranked_candidates: Sorted candidate pool.
            evaluation_report: IR metrics validation stats.
            output_dir: Directory where the output files are stored.

        Returns:
            Path: Path to the generated report file.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Attempt to write ReportLab PDF if available
        if REPORTLAB_AVAILABLE:
            pdf_path = output_dir / f"recruiter_report_{timestamp}.pdf"
            try:
                ReportGenerator._write_pdf(job_title, ranked_candidates, evaluation_report, pdf_path)
                logger.info(f"Successfully generated PDF report at: {pdf_path}")
                return pdf_path
            except Exception as e:
                logger.error(f"ReportLab PDF generation failed: {e}. Falling back to Markdown.", exc_info=True)

        # Fallback to Markdown/HTML reports
        md_path = output_dir / f"recruiter_report_{timestamp}.md"
        html_path = output_dir / f"recruiter_report_{timestamp}.html"
        
        ReportGenerator._write_markdown_and_html(
            job_title, ranked_candidates, evaluation_report, md_path, html_path
        )
        logger.info(f"Generated Markdown report at {md_path} and HTML report at {html_path}")
        return md_path

    @staticmethod
    def _write_pdf(
        job_title: str,
        ranked_candidates: List[RankedCandidate],
        evaluation: EvaluationReport,
        file_path: Path,
    ) -> None:
        """ReportLab PDF writer implementation."""
        doc = SimpleDocTemplate(str(file_path), pagesize=letter)
        styles = getSampleStyleSheet()

        # Define custom styles
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=22,
            textColor=colors.HexColor("#0A2540"),
            spaceAfter=15,
        )
        section_style = ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#639FAB"),
            spaceBefore=12,
            spaceAfter=8,
        )
        normal_style = styles["Normal"]

        story = []

        # Header
        story.append(Paragraph(f"Recruiter Evaluation Report: {job_title}", title_style))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
        story.append(Spacer(1, 15))

        # Metrics section
        story.append(Paragraph("1. System Evaluation Metrics", section_style))
        ndcg_key = list(evaluation.ndcg.keys())[0] if evaluation.ndcg else "ndcg"
        ndcg_val = list(evaluation.ndcg.values())[0] if evaluation.ndcg else 0.0
        prec_key = list(evaluation.precision.keys())[0] if evaluation.precision else "precision"
        prec_val = list(evaluation.precision.values())[0] if evaluation.precision else 0.0

        metrics_data = [
            ["Metric", "Value", "Description"],
            ["NDCG Score", f"{ndcg_val:.4f}", f"Normalized gain calculation ({ndcg_key})"],
            ["MRR Score", f"{evaluation.mrr:.4f}", "Mean Reciprocal Rank"],
            ["Precision Score", f"{prec_val:.4f}", f"Relevance accuracy ({prec_key})"],
            ["Pool Coverage", f"{evaluation.coverage * 100:.1f}%", "Skill requirements coverage ratio"],
            ["Pool Diversity", f"{evaluation.diversity:.2f}", "Experience dispersion standard deviation"],
        ]

        table = Table(metrics_data, colWidths=[120, 80, 250])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0A2540")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F4F6F8")),
        ]))
        story.append(table)
        story.append(Spacer(1, 15))

        # Shortlist section
        story.append(Paragraph("2. Top Candidate Shortlist", section_style))
        shortlist_data = [["Rank", "ID", "Score", "Verdict", "Summary"]]
        for rc in ranked_candidates[:10]:
            shortlist_data.append([
                str(rc.rank),
                rc.candidate_id,
                f"{rc.final_score:.2f}",
                rc.explanation.fit_verdict if rc.explanation else "N/A",
                rc.explanation.summary[:60] + "..." if rc.explanation else "N/A"
            ])

        s_table = Table(shortlist_data, colWidths=[40, 85, 50, 95, 230])
        s_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#639FAB")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F6F8")]),
        ]))
        story.append(s_table)

        doc.build(story)

    @staticmethod
    def _write_markdown_and_html(
        job_title: str,
        ranked_candidates: List[RankedCandidate],
        evaluation: EvaluationReport,
        md_path: Path,
        html_path: Path,
    ) -> None:
        """Markdown and HTML writer fallback implementation."""
        ndcg_key = list(evaluation.ndcg.keys())[0] if evaluation.ndcg else "ndcg"
        ndcg_val = list(evaluation.ndcg.values())[0] if evaluation.ndcg else 0.0
        prec_key = list(evaluation.precision.keys())[0] if evaluation.precision else "precision"
        prec_val = list(evaluation.precision.values())[0] if evaluation.precision else 0.0

        # Build Markdown content
        md_lines = [
            f"# Recruiter Evaluation Report: {job_title}\n",
            f"**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
            "## 1. System Evaluation Metrics\n",
            "| Metric | Value | Description |",
            "| :--- | :--- | :--- |",
            f"| **NDCG Score** | `{ndcg_val:.4f}` | Normalized gain calculation ({ndcg_key}) |",
            f"| **MRR Score** | `{evaluation.mrr:.4f}` | Mean Reciprocal Rank |",
            f"| **Precision Score** | `{prec_val:.4f}` | Relevance accuracy ({prec_key}) |",
            f"| **Pool Coverage** | `{evaluation.coverage * 100:.1f}%` | Skill requirements coverage ratio |",
            f"| **Pool Diversity** | `{evaluation.diversity:.2f}` | Experience dispersion standard deviation |",
            "\n## 2. Top Candidate Shortlist\n",
            "| Rank | Candidate ID | Score | Fit Verdict | Summary |",
            "| :--- | :--- | :--- | :--- | :--- |"
        ]

        for rc in ranked_candidates[:15]:
            verdict = rc.explanation.fit_verdict if rc.explanation else "N/A"
            summary = rc.explanation.summary if rc.explanation else "N/A"
            md_lines.append(
                f"| {rc.rank} | **{rc.candidate_id}** | `{rc.final_score:.2f}` | *{verdict}* | {summary} |"
            )

        md_content = "\n".join(md_lines)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)

        # Build HTML content
        html_lines = [
            "<!DOCTYPE html>",
            "<html>",
            "<head>",
            "<title>Recruiter Evaluation Report</title>",
            "<style>",
            "  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }",
            "  h1 { color: #0A2540; }",
            "  h2 { color: #639FAB; margin-top: 30px; }",
            "  table { width: 100%; border-collapse: collapse; margin-top: 15px; }",
            "  th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }",
            "  th { background-color: #0A2540; color: white; }",
            "  tr:nth-child(even) { background-color: #f9f9f9; }",
            "</style>",
            "</head>",
            "<body>",
            f"<h1>Recruiter Evaluation Report: {job_title}</h1>",
            f"<p><strong>Generated on:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>",
            "<h2>1. System Evaluation Metrics</h2>",
            "<table>",
            "  <tr><th>Metric</th><th>Value</th><th>Description</th></tr>",
            f"  <tr><td>NDCG Score</td><td>{ndcg_val:.4f}</td><td>{ndcg_key}</td></tr>",
            f"  <tr><td>MRR Score</td><td>{evaluation.mrr:.4f}</td><td>Mean Reciprocal Rank</td></tr>",
            f"  <tr><td>Precision Score</td><td>{prec_val:.4f}</td><td>{prec_key}</td></tr>",
            f"  <tr><td>Pool Coverage</td><td>{evaluation.coverage * 100:.1f}%</td><td>Skill coverage ratio</td></tr>",
            f"  <tr><td>Pool Diversity</td><td>{evaluation.diversity:.2f}</td><td>Experience standard deviation</td></tr>",
            "</table>",
            "<h2>2. Top Candidate Shortlist</h2>",
            "<table>",
            "  <tr><th>Rank</th><th>Candidate ID</th><th>Score</th><th>Fit Verdict</th><th>Summary</th></tr>"
        ]

        for rc in ranked_candidates[:15]:
            verdict = rc.explanation.fit_verdict if rc.explanation else "N/A"
            summary = rc.explanation.summary if rc.explanation else "N/A"
            html_lines.append(
                f"  <tr><td>{rc.rank}</td><td><strong>{rc.candidate_id}</strong></td>"
                f"<td>{rc.final_score:.2f}</td><td>{verdict}</td><td>{summary}</td></tr>"
            )

        html_lines.extend(["</table>", "</body>", "</html>"])
        with open(html_path, "w", encoding="utf-8") as f:
            f.write("\n".join(html_lines))
