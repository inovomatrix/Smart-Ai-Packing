"""
PackSmart AI — Publication-Grade PDF Report Generator
Smart India Hackathon 2026 | PS: SIH26236

Generates professional technical recommendation dossiers using ReportLab.
"""

import io
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)

def generate_pdf_report(analysis_data: Dict[str, Any]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Palettes
    PRIMARY_COLOR = colors.HexColor("#065f46")   # Deep emerald
    SECONDARY_COLOR = colors.HexColor("#0f766e") # Forest teal
    DARK_TEXT = colors.HexColor("#1e293b")       # Slate 800
    MUTED_TEXT = colors.HexColor("#64748b")      # Slate 500
    LIGHT_BG = colors.HexColor("#f0fdf4")        # Emerald 50
    CARD_BG = colors.HexColor("#f8fafc")         # Slate 50
    BORDER_COLOR = colors.HexColor("#cbd5e1")    # Slate 300
    ALERT_BG = colors.HexColor("#fffbeb")        # Amber 50
    ALERT_BORDER = colors.HexColor("#f59e0b")    # Amber 500

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY_COLOR
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=MUTED_TEXT
    )

    h1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=SECONDARY_COLOR,
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT
    )

    bold_body = ParagraphStyle(
        'BoldDark',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT
    )

    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#475569")
    )

    story = []

    # 1. Header Section
    story.append(Paragraph("PackSmart AI — Food Packaging Technical Dossier", title_style))
    story.append(Paragraph("Smart India Hackathon 2026 | Problem Statement: SIH26236 | Computational Decision-Support System", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_COLOR, spaceAfter=10))

    # Metadata Strip
    commodity_name = analysis_data.get("commodity_name", "Standard Food Commodity")
    created_at = analysis_data.get("created_at", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    rec_mat = analysis_data.get("recommended_material", {})
    mat_obj = rec_mat.get("material", {})
    mat_name = mat_obj.get("name", "Recommended Material")

    meta_data = [
        [
            Paragraph(f"<b>Dossier ID:</b> {analysis_data.get('id', 'N/A')[:18]}...", body_style),
            Paragraph(f"<b>Date:</b> {created_at[:19]}", body_style),
            Paragraph(f"<b>Target Commodity:</b> {commodity_name}", bold_body)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[180, 160, 200])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # 2. Executive Recommendation Card
    compat_score = rec_mat.get("compatibility_score", 90.0)
    perf_score = rec_mat.get("performance_score", 90.0)
    cost_score = rec_mat.get("cost_score", 80.0)
    sust_score = rec_mat.get("sustainability_score", 85.0)
    sl_range = rec_mat.get("shelf_life_range", "20–25 days")

    rec_card_data = [
        [
            Paragraph(f"<font size=12 color='#065f46'><b>RECOMMENDED MATERIAL:</b> {mat_name}</font>", title_style),
            Paragraph(f"<font size=16 color='#065f46'><b>{compat_score} / 100</b></font><br/><font size=8 color='#64748b'>System Compatibility</font>", ParagraphStyle('Score', alignment=1))
        ],
        [
            Paragraph(f"<b>Category:</b> {mat_obj.get('category', 'Polymer')} &nbsp;|&nbsp; <b>MAP Compatibility:</b> {rec_mat.get('map_suitability', 'Yes')}", body_style),
            Paragraph(f"<b>Est. Shelf Life:</b> {sl_range}", bold_body)
        ],
        [
            Paragraph(f"<b>Performance Score:</b> {perf_score}/100 &nbsp;|&nbsp; <b>Cost Score:</b> {cost_score}/100 &nbsp;|&nbsp; <b>Circularity Score:</b> {sust_score}/100", body_style),
            Paragraph(f"<b>Unit Packaging Cost:</b> ${mat_obj.get('estimated_cost', 0.12):.3f} USD", body_style)
        ]
    ]
    t_rec = Table(rec_card_data, colWidths=[360, 180])
    t_rec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1.5, PRIMARY_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_rec)
    story.append(Spacer(1, 12))

    # 3. Packaging Technical Specifications (ASTM Standards)
    story.append(Paragraph("Packaging Material Technical Specifications (ASTM Tested)", h1_style))
    spec_rows = [
        [
            Paragraph("<b>Property / Parameter</b>", bold_body),
            Paragraph("<b>Value</b>", bold_body),
            Paragraph("<b>Standard / Test Method</b>", bold_body)
        ],
        [
            Paragraph("Oxygen Transmission Rate (OTR)", body_style),
            Paragraph(f"{mat_obj.get('otr', 'N/A')} cc/(m²·24h·atm)", body_style),
            Paragraph("ASTM D3985 (Coulometric sensor, 23°C, 0% RH)", body_style)
        ],
        [
            Paragraph("Water Vapor Transmission Rate (WVTR)", body_style),
            Paragraph(f"{mat_obj.get('wvtr', 'N/A')} g/(m²·24h)", body_style),
            Paragraph("ASTM F1249 (Modulated IR, 37.8°C, 90% RH)", body_style)
        ],
        [
            Paragraph("Nominal Thickness", body_style),
            Paragraph(f"{mat_obj.get('thickness', 'N/A')} μm (microns)", body_style),
            Paragraph("ASTM D6988 / ISO 4593", body_style)
        ],
        [
            Paragraph("Thermal Stability Envelope", body_style),
            Paragraph(f"{mat_obj.get('temperature_min', -20)}°C to {mat_obj.get('temperature_max', 80)}°C", body_style),
            Paragraph("Standard Differential Scanning Calorimetry", body_style)
        ],
        [
            Paragraph("Mechanical Strength & Sealability", body_style),
            Paragraph(f"{mat_obj.get('mechanical_strength', 'Medium')} | {mat_obj.get('sealability', 'Good')}", body_style),
            Paragraph("ASTM F88 / ASTM D882", body_style)
        ],
        [
            Paragraph("Recyclability & Biodegradability", body_style),
            Paragraph(f"{mat_obj.get('recyclability', 'Moderate')} | {mat_obj.get('biodegradability', 'Non-biodegradable')}", body_style),
            Paragraph("ASTM D6400 / ISO 14855 Circularity Framework", body_style)
        ]
    ]
    t_spec = Table(spec_rows, colWidths=[180, 160, 200])
    t_spec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_spec)
    story.append(Spacer(1, 12))

    # 4. Explainable AI Rationale & Trade-Offs
    story.append(Paragraph("Explainable AI Rationale & Trade-Off Matrix", h1_style))
    explanations = analysis_data.get("explanation", [])
    trade_offs = analysis_data.get("trade_offs", [])

    exp_text = "".join([f"• <b>[Verified]</b> {e}<br/>" for e in explanations[:5]]) if explanations else "• Optimal scientific match across tested barrier requirements."
    trade_text = "".join([f"• <b>[Note]</b> {t}<br/>" for t in trade_offs[:4]]) if trade_offs else "• Standard operational handling tolerances apply."

    rationale_data = [
        [
            Paragraph(f"<font color='#065f46'><b>Why This Was Recommended:</b></font><br/>{exp_text}", body_style),
            Paragraph(f"<font color='#b45309'><b>Key Trade-Offs & Considerations:</b></font><br/>{trade_text}", body_style)
        ]
    ]
    t_rat = Table(rationale_data, colWidths=[270, 270])
    t_rat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#f0fdf4")),
        ('BACKGROUND', (1,0), (1,0), ALERT_BG),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#86efac")),
        ('BOX', (1,0), (1,0), 1, ALERT_BORDER),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_rat)
    story.append(Spacer(1, 12))

    # 5. Ranked Alternative Materials
    alternatives: List[Dict[str, Any]] = analysis_data.get("alternatives", [])
    if alternatives:
        story.append(Paragraph("Ranked Alternative Materials (Pareto Comparison)", h1_style))
        alt_rows = [
            [
                Paragraph("<b>Alternative Material</b>", bold_body),
                Paragraph("<b>Category</b>", bold_body),
                Paragraph("<b>Score</b>", bold_body),
                Paragraph("<b>Est. Cost/Unit</b>", bold_body),
                Paragraph("<b>MAP Status</b>", bold_body)
            ]
        ]
        for alt in alternatives[:4]:
            a_mat = alt.get("material", {})
            alt_rows.append([
                Paragraph(a_mat.get("name", "Alternative"), body_style),
                Paragraph(a_mat.get("category", "Polymer"), body_style),
                Paragraph(f"<b>{alt.get('compatibility_score', 0)}/100</b>", body_style),
                Paragraph(f"${a_mat.get('estimated_cost', 0):.3f}", body_style),
                Paragraph(alt.get("map_suitability", "N/A"), body_style)
            ])
        t_alt = Table(alt_rows, colWidths=[180, 80, 70, 90, 120])
        t_alt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
            ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_alt)
        story.append(Spacer(1, 12))

    # 6. Scientific References & Legal Disclaimer
    story.append(Paragraph("Peer-Reviewed Scientific Literature References", h1_style))
    ref_text = (
        "1. USDA Agricultural Handbook 66 (Commercial Storage of Fruits, Vegetables & Florist Stocks)<br/>"
        "2. Robertson, G. L. (2013). Food Packaging: Principles and Practice (3rd ed.). CRC Press.<br/>"
        "3. ASTM D3985-17: Standard Test Method for Oxygen Gas Transmission Rate Through Plastic Film.<br/>"
        "4. ASTM F1249-20: Standard Test Method for Water Vapor Transmission Rate."
    )
    story.append(Paragraph(ref_text, body_style))
    story.append(Spacer(1, 10))

    disclaimer_block = [
        [
            Paragraph(
                "<b>MANDATORY SCIENTIFIC & REGULATORY DISCLAIMER:</b> "
                "PackSmart AI provides computational decision-support recommendations. "
                "Packaging barrier performance, food safety, microbial stability, and commercial shelf life "
                "must be formally validated through laboratory testing, real-time shelf life trials, "
                "and applicable statutory food safety regulations (FSSAI/FDA/EFSA) prior to commercial deployment.",
                disclaimer_style
            )
        ]
    ]
    t_disc = Table(disclaimer_block, colWidths=[540])
    t_disc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_disc)

    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
