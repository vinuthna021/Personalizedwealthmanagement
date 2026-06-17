from io import BytesIO, StringIO
import csv
from decimal import Decimal
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.models.user import User
from app.repositories.investment import investment_repository
from app.repositories.goal import goal_repository
from app.repositories.recommendation import recommendation_repository
from app.services.portfolio import portfolio_service

def format_currency(val) -> str:
    try:
        return f"${float(val):,.2f}"
    except (ValueError, TypeError):
        return "$0.00"

def make_progress_bar(pct: float) -> Table:
    pct = max(0.0, min(1.0, float(pct)))
    width_filled = int(pct * 100)
    width_empty = 100 - width_filled
    
    col_widths = []
    cells = []
    cell_styles = []
    
    if width_filled > 0:
        col_widths.append(width_filled)
        cells.append('')
        cell_styles.append(('BACKGROUND', (len(cells)-1, 0), (len(cells)-1, 0), colors.HexColor('#3b82f6')))
    if width_empty > 0:
        col_widths.append(width_empty)
        cells.append('')
        cell_styles.append(('BACKGROUND', (len(cells)-1, 0), (len(cells)-1, 0), colors.HexColor('#e2e8f0')))
        
    bar_table = Table([cells], colWidths=col_widths, rowHeights=[10])
    bar_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ] + cell_styles))
    
    return bar_table

class ReportService:
    def generate_portfolio_pdf(self, db: Session, user_id: int) -> bytes:
        """
        Generates a PDF portfolio report for the user.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        investments = investment_repository.get_by_user(db, user_id)
        goals = goal_repository.get_by_user(db, user_id)
        latest_rec = recommendation_repository.get_latest_by_user(db, user_id)
        summary = portfolio_service.get_portfolio_summary(db, user_id)
        gain_info = portfolio_service.calculate_unrealized_gain(db, user_id)

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=20
        )
        h2_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=14,
            spaceAfter=8,
            keepWithNext=True
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#334155'),
            spaceAfter=6
        )
        body_bold = ParagraphStyle(
            'ReportBodyBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )
        th_style = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontSize=9,
            leading=11,
            fontName='Helvetica-Bold',
            textColor=colors.whitesmoke
        )

        story = []

        # Header
        story.append(Paragraph("Personalized Wealth Management Report", title_style))
        report_date = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
        story.append(Paragraph(f"Prepared for {user.name} ({user.email}) on {report_date}", subtitle_style))
        story.append(Spacer(1, 10))

        # 1. Summary Cards
        story.append(Paragraph("Portfolio Summary", h2_style))
        
        gain_pct = float(gain_info["unrealized_gain_percent"])
        gain_val = float(gain_info["unrealized_gain"])
        gain_str = f"{format_currency(gain_val)} ({gain_pct:+.2f}%)"

        summary_data = [
            [
                Paragraph("Net Portfolio Value", body_bold),
                Paragraph(format_currency(summary["total_value"]), body_style),
                Paragraph("Cash Balance", body_bold),
                Paragraph(format_currency(summary["cash_balance"]), body_style),
            ],
            [
                Paragraph("Stock / Asset Value", body_bold),
                Paragraph(format_currency(summary["stock_value"]), body_style),
                Paragraph("Total Unrealized Gain", body_bold),
                Paragraph(gain_str, body_style),
            ]
        ]
        
        summary_table = Table(summary_data, colWidths=[130, 140, 130, 140])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 15))

        # 2. Holdings Section
        story.append(Paragraph("Active Asset Holdings", h2_style))
        holdings_headers = [
            Paragraph("Ticker", th_style),
            Paragraph("Asset Class", th_style),
            Paragraph("Quantity", th_style),
            Paragraph("Avg Cost", th_style),
            Paragraph("Last Price", th_style),
            Paragraph("Current Value", th_style),
            Paragraph("Allocation", th_style)
        ]
        
        holdings_data = [holdings_headers]
        for inv in investments:
            holdings_data.append([
                Paragraph(inv.ticker_symbol, body_bold),
                Paragraph(str(inv.asset_class.value if hasattr(inv.asset_class, 'value') else inv.asset_class).upper(), body_style),
                Paragraph(f"{float(inv.quantity):,.4f}", body_style),
                Paragraph(format_currency(inv.average_cost), body_style),
                Paragraph(format_currency(inv.last_price), body_style),
                Paragraph(format_currency(inv.current_value), body_style),
                Paragraph(f"{float(inv.allocation_percent):.2f}%", body_style)
            ])

        if len(investments) == 0:
            holdings_data.append([Paragraph("No active holdings found.", body_style)] + [""] * 6)

        holdings_table = Table(holdings_data, colWidths=[65, 85, 75, 75, 75, 90, 75])
        holdings_table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]
        # Alternating row background
        for i in range(1, len(holdings_data)):
            bg = colors.HexColor('#ffffff') if i % 2 == 1 else colors.HexColor('#f8fafc')
            holdings_table_style.append(('BACKGROUND', (0, i), (-1, i), bg))
            
        holdings_table.setStyle(TableStyle(holdings_table_style))
        story.append(holdings_table)
        story.append(Spacer(1, 15))

        # 3. Financial Goals Section
        story.append(Paragraph("Financial Goals Progress", h2_style))
        goals_headers = [
            Paragraph("Goal Name", th_style),
            Paragraph("Goal Type", th_style),
            Paragraph("Target Date", th_style),
            Paragraph("Target Amount", th_style),
            Paragraph("Current Amount", th_style),
            Paragraph("Monthly Contrib.", th_style),
            Paragraph("Progress Bar", th_style)
        ]
        
        goals_data = [goals_headers]
        for goal in goals:
            pct = 0.0
            if goal.target_amount > 0:
                pct = float(goal.current_amount / goal.target_amount)
            
            pbar = make_progress_bar(pct)
            
            goals_data.append([
                Paragraph(goal.goal_name, body_bold),
                Paragraph(str(goal.goal_type.value if hasattr(goal.goal_type, 'value') else goal.goal_type).upper(), body_style),
                Paragraph(goal.target_date.strftime("%Y-%m-%d"), body_style),
                Paragraph(format_currency(goal.target_amount), body_style),
                Paragraph(format_currency(goal.current_amount), body_style),
                Paragraph(format_currency(goal.monthly_contribution), body_style),
                pbar
            ])

        if len(goals) == 0:
            goals_data.append([Paragraph("No financial goals created.", body_style)] + [""] * 6)

        goals_table = Table(goals_data, colWidths=[90, 75, 75, 75, 75, 85, 105])
        goals_table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]
        for i in range(1, len(goals_data)):
            bg = colors.HexColor('#ffffff') if i % 2 == 1 else colors.HexColor('#f8fafc')
            goals_table_style.append(('BACKGROUND', (0, i), (-1, i), bg))
            
        goals_table.setStyle(TableStyle(goals_table_style))
        story.append(goals_table)
        story.append(Spacer(1, 15))

        # 4. Recommendations Section
        if latest_rec:
            rec_elements = []
            rec_elements.append(Paragraph(f"Latest Advice: {latest_rec.title}", h2_style))
            
            # Split lines in recommendation text to preserve formatting
            for line in latest_rec.recommendation_text.split('\n'):
                line_str = line.strip()
                if line_str.startswith('###'):
                    header_text = line_str.replace('###', '').strip()
                    rec_elements.append(Paragraph(header_text, ParagraphStyle('RecSubH', parent=styles['Heading3'], fontSize=11, spaceBefore=8, spaceAfter=4)))
                elif line_str.startswith('-') or line_str.startswith('*'):
                    list_text = line_str[1:].strip()
                    rec_elements.append(Paragraph(f"&bull; {list_text}", ParagraphStyle('RecList', parent=body_style, leftIndent=12)))
                elif line_str:
                    # Replace markdown bolding with simple html bolding
                    formatted_line = line_str.replace('**', '<b>', 1).replace('**', '</b>', 1)
                    # Loop just in case there are multiple bold segments
                    while '**' in formatted_line:
                        formatted_line = formatted_line.replace('**', '<b>', 1).replace('**', '</b>', 1)
                    rec_elements.append(Paragraph(formatted_line, body_style))
                else:
                    rec_elements.append(Spacer(1, 4))
            
            story.append(KeepTogether(rec_elements))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    def generate_portfolio_csv(self, db: Session, user_id: int) -> str:
        """
        Generates a CSV report containing summary statistics, holdings, and goals.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        investments = investment_repository.get_by_user(db, user_id)
        goals = goal_repository.get_by_user(db, user_id)
        summary = portfolio_service.get_portfolio_summary(db, user_id)
        gain_info = portfolio_service.calculate_unrealized_gain(db, user_id)

        output = StringIO()
        writer = csv.writer(output)

        # 1. Report Metadata
        writer.writerow(["PERSONALIZED WEALTH MANAGEMENT REPORT"])
        writer.writerow(["Prepared For", user.name, user.email])
        writer.writerow(["Date Generated", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow([])

        # 2. Portfolio Summary
        writer.writerow(["PORTFOLIO SUMMARY"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Net Portfolio Value", round(float(summary["total_value"]), 2)])
        writer.writerow(["Cash Balance", round(float(summary["cash_balance"]), 2)])
        writer.writerow(["Stock/Asset Value", round(float(summary["stock_value"]), 2)])
        writer.writerow(["Total Unrealized Gain", round(float(gain_info["unrealized_gain"]), 2)])
        writer.writerow(["Total Unrealized Gain %", f"{float(gain_info['unrealized_gain_percent']):.2f}%"])
        writer.writerow([])

        # 3. Active Holdings
        writer.writerow(["ACTIVE ASSET HOLDINGS"])
        writer.writerow(["Ticker", "Asset Class", "Quantity", "Average Cost", "Last Price", "Current Value", "Allocation %"])
        for inv in investments:
            asset_class_str = str(inv.asset_class.value if hasattr(inv.asset_class, 'value') else inv.asset_class).upper()
            writer.writerow([
                inv.ticker_symbol,
                asset_class_str,
                round(float(inv.quantity), 6),
                round(float(inv.average_cost), 4),
                round(float(inv.last_price), 4),
                round(float(inv.current_value), 4),
                f"{float(inv.allocation_percent):.2f}%"
            ])
        writer.writerow([])

        # 4. Financial Goals
        writer.writerow(["FINANCIAL GOALS PROGRESS"])
        writer.writerow(["Goal Name", "Goal Type", "Target Date", "Target Amount", "Current Amount", "Monthly Contribution", "Completion %"])
        for goal in goals:
            goal_type_str = str(goal.goal_type.value if hasattr(goal.goal_type, 'value') else goal.goal_type).upper()
            pct = 0.0
            if goal.target_amount > 0:
                pct = float(goal.current_amount / goal.target_amount) * 100.0
            
            writer.writerow([
                goal.goal_name,
                goal_type_str,
                goal.target_date.strftime("%Y-%m-%d"),
                round(float(goal.target_amount), 2),
                round(float(goal.current_amount), 2),
                round(float(goal.monthly_contribution), 2),
                f"{pct:.2f}%"
            ])

        csv_str = output.getvalue()
        output.close()
        return csv_str

report_service = ReportService()
