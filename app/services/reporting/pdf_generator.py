"""PDF and HTML Executive Report Generator for MEDDPICC Deal Diagnostics."""
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.logging import get_logger

logger = get_logger(__name__)


class PDFReportGenerator:
    """Renders MEDDPICC scorecards into styled executive HTML / PDF documents."""

    @staticmethod
    def generate_html_report(
        deal_name: str,
        company_name: str,
        overall_score: int,
        deal_category: str,
        next_best_action: str,
        follow_up_email: Dict[str, str],
        closure_likelihood: Dict[str, Any],
        seller_summary: Dict[str, Any],
        boxes: List[Dict[str, Any]],
        model_used: str,
    ) -> str:
        """Generates a responsive, executive HTML report."""
        category_colors = {
            "Advance": "#10b981",  # emerald
            "Rescue": "#f59e0b",   # amber
            "Nurture": "#6366f1",  # indigo
            "Disqualify": "#ef4444", # rose
        }
        category_color = category_colors.get(deal_category, "#3b82f6")

        boxes_html = ""
        for b in boxes:
            box_name = b.get("box", "Unknown")
            score = b.get("score", 0)
            max_score = b.get("max_score", 15)
            pct = int((score / max_score) * 100) if max_score > 0 else 0
            rating = b.get("rating", "Moderate")
            notes = b.get("notes", "No notes recorded.")
            quotes = b.get("evidence_quotes", [])

            quotes_html = ""
            if quotes:
                quotes_html = "<div class='quotes-section'><strong>Verbatim Buyer Evidence:</strong><ul>"
                for q in quotes:
                    quote_text = q.get("quote", "") if isinstance(q, dict) else q.quote
                    person = q.get("person_name", "Customer") if isinstance(q, dict) else (q.person_name or "Customer")
                    quotes_html += f"<li><em>\"{quote_text}\"</em> — <span class='quote-person'>{person}</span></li>"
                quotes_html += "</ul></div>"

            coaching_html = ""
            coaching_qs = b.get("coaching_questions", [])
            if coaching_qs:
                coaching_html = "<div class='coaching-section'><strong>Discovery Coaching Questions:</strong><ul>"
                for q in coaching_qs:
                    coaching_html += f"<li>{q}</li>"
                coaching_html += "</ul></div>"

            boxes_html += f"""
            <div class="box-card">
                <div class="box-header">
                    <span class="box-title">{box_name}</span>
                    <span class="box-score">{score} / {max_score} ({rating})</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: {pct}%;"></div>
                </div>
                <p class="box-notes">{notes}</p>
                {quotes_html}
                {coaching_html}
            </div>
            """

        html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MEDDPICC Diagnostic — {deal_name}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            margin: 0;
            padding: 40px 20px;
            line-height: 1.5;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: #1e293b;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            border: 1px solid #334155;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #334155;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }}
        .badge {{
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .score-circle {{
            font-size: 38px;
            font-weight: 800;
            color: #38bdf8;
        }}
        .grid-2 {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
        }}
        .stat-card {{
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 16px;
        }}
        .box-card {{
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 18px;
            margin-bottom: 16px;
        }}
        .box-header {{
            display: flex;
            justify-content: space-between;
            font-weight: 600;
            margin-bottom: 8px;
        }}
        .box-title {{
            color: #f1f5f9;
            font-size: 16px;
        }}
        .box-score {{
            color: #38bdf8;
        }}
        .progress-bar-bg {{
            background: #334155;
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 12px;
        }}
        .progress-bar-fill {{
            background: #38bdf8;
            height: 100%;
        }}
        .box-notes {{
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 8px;
        }}
        .quotes-section {{
            background: #1e293b;
            border-left: 3px solid #10b981;
            padding: 10px 14px;
            border-radius: 4px;
            margin-top: 10px;
            font-size: 13px;
        }}
        .quotes-section ul, .coaching-section ul {{
            margin: 6px 0 0 0;
            padding-left: 18px;
        }}
        .quote-person {{
            color: #10b981;
            font-weight: 600;
        }}
        .coaching-section {{
            background: #1e293b;
            border-left: 3px solid #f59e0b;
            padding: 10px 14px;
            border-radius: 4px;
            margin-top: 10px;
            font-size: 13px;
        }}
        .email-box {{
            background: #0f172a;
            border: 1px solid #38bdf8;
            border-radius: 8px;
            padding: 18px;
            margin-top: 24px;
        }}
        .email-body {{
            white-space: pre-wrap;
            font-family: monospace;
            background: #1e293b;
            padding: 14px;
            border-radius: 6px;
            margin-top: 8px;
            font-size: 13px;
            color: #cbd5e1;
        }}
        .footer {{
            margin-top: 32px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1 style="margin: 0 0 6px 0; font-size: 24px;">MEDDPICC Deal Diagnostic</h1>
                <div style="font-size: 14px; color: #94a3b8;">{deal_name} &bull; {company_name}</div>
            </div>
            <div style="text-align: right;">
                <span class="badge" style="background: {category_color}; color: #000;">{deal_category}</span>
                <div class="score-circle">{overall_score}<span style="font-size: 18px; color: #64748b;">/100</span></div>
            </div>
        </div>

        <div class="grid-2">
            <div class="stat-card">
                <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Win Probability If Addressed</div>
                <div style="font-size: 20px; font-weight: 700; color: #10b981; margin-top: 4px;">{closure_likelihood.get('if_addressed', {}).get('likelihood_range', '65-80%')}</div>
                <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">{closure_likelihood.get('if_addressed', {}).get('rationale', '')}</div>
            </div>
            <div class="stat-card">
                <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Win Probability If Ignored</div>
                <div style="font-size: 20px; font-weight: 700; color: #ef4444; margin-top: 4px;">{closure_likelihood.get('if_ignored', {}).get('likelihood_range', '15-25%')}</div>
                <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">{closure_likelihood.get('if_ignored', {}).get('rationale', '')}</div>
            </div>
        </div>

        <div class="stat-card" style="margin-bottom: 24px; border-left: 4px solid #38bdf8;">
            <div style="font-size: 12px; color: #38bdf8; font-weight: 700; text-transform: uppercase;">Executive Next Best Action</div>
            <div style="font-size: 15px; font-weight: 600; color: #f8fafc; margin-top: 6px;">{next_best_action}</div>
        </div>

        <h3 style="margin: 24px 0 16px 0; font-size: 18px;">MEDDPICC 8-Box Evaluation</h3>
        {boxes_html}

        <div class="email-box">
            <div style="font-weight: 700; color: #38bdf8; font-size: 14px; text-transform: uppercase;">Auto-Drafted Follow-Up Email</div>
            <div style="font-size: 13px; font-weight: 600; margin-top: 8px;">Subject: {follow_up_email.get('subject', 'Follow-up on our discussion')}</div>
            <div class="email-body">{follow_up_email.get('body_content', '')}</div>
        </div>

        <div class="footer">
            Generated by Whipstitch Deal Engine &bull; Model: {model_used} &bull; {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}
        </div>
    </div>
</body>
</html>
"""
        return html_template

    @classmethod
    def render_pdf_or_html(
        cls,
        output_dir: str,
        deal_id: str,
        report_data: Dict[str, Any],
    ) -> str:
        """Saves HTML report and converts to PDF if WeasyPrint is installed."""
        os.makedirs(output_dir, exist_ok=True)
        html_content = cls.generate_html_report(
            deal_name=report_data.get("deal_name", "Deal"),
            company_name=report_data.get("company_name", "Company"),
            overall_score=report_data.get("overall_score", 0),
            deal_category=report_data.get("deal_category", "Rescue"),
            next_best_action=report_data.get("next_best_action", ""),
            follow_up_email=report_data.get("follow_up_email", {}),
            closure_likelihood=report_data.get("closure_likelihood", {}),
            seller_summary=report_data.get("seller_summary", {}),
            boxes=report_data.get("boxes", []),
            model_used=report_data.get("model_used", "gemini-2.0-flash"),
        )

        html_path = os.path.join(output_dir, f"diagnostic_{deal_id}.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        pdf_path = os.path.join(output_dir, f"diagnostic_{deal_id}.pdf")
        try:
            from weasyprint import HTML
            HTML(string=html_content).write_pdf(pdf_path)
            logger.info("medpicc_pdf_rendered_successfully", pdf_path=pdf_path)
            return pdf_path
        except Exception as e:
            logger.info("weasyprint_rendering_fallback_to_html", error=str(e))
            return html_path


pdf_generator = PDFReportGenerator()
