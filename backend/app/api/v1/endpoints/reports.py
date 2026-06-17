from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.report_service import report_service

router = APIRouter()

@router.get("/pdf")
def get_pdf_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download a styled PDF report of the user's portfolio.
    """
    try:
        pdf_bytes = report_service.generate_portfolio_pdf(db, current_user.id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=portfolio_report_{current_user.id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")

@router.get("/csv")
def get_csv_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download a structured CSV export of the user's portfolio.
    """
    try:
        csv_str = report_service.generate_portfolio_csv(db, current_user.id)
        return Response(
            content=csv_str,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=portfolio_report_{current_user.id}.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV report: {str(e)}")
