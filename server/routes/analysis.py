"""
Placify AI — Analysis Routes
Handles resume upload, analysis, and history retrieval.
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

logger = logging.getLogger(__name__)

try:
    from ..auth import get_current_user
    from ..database import get_db
    from ..ml.predictor import predict
    from ..utils.resume_parser import parse_resume
except ImportError:
    from auth import get_current_user
    from database import get_db
    from ml.predictor import predict
    from utils.resume_parser import parse_resume

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("")
async def create_analysis(
    resume: UploadFile = File(...),
    aptitude_score: float = Form(...),
    communication_score: float = Form(...),
    coding_problems_solved: int = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a resume PDF and generate a placement prediction."""

    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await resume.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must be under 5MB")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if not (0 <= aptitude_score <= 100):
        raise HTTPException(status_code=400, detail="Aptitude score must be between 0 and 100")
    if not (1 <= communication_score <= 5):
        raise HTTPException(status_code=400, detail="Communication score must be between 1 and 5")
    if not (0 <= coding_problems_solved <= 5000):
        raise HTTPException(status_code=400, detail="Coding problems solved must be between 0 and 5000")

    try:
        resume_features = parse_resume(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Resume parsing failed")
        raise HTTPException(status_code=500, detail=f"Failed to process the resume: {str(e)}")

    features = {
        **resume_features,
        "aptitude_score": aptitude_score,
        "communication_score": communication_score,
        "coding_problems_solved": coding_problems_solved,
    }

    try:
        results = predict(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Compute peer percentile using the real analyses in the DB
    db = get_db()
    my_readiness = results.get("industry_readiness", 0)
    total_count = db.analyses.count_documents({})
    below_count = db.analyses.count_documents(
        {"results.industry_readiness": {"$lt": my_readiness}}
    )
    real_percentile = int((below_count / (total_count + 1)) * 100) if total_count > 0 else 99
    results["peer_percentile"] = real_percentile

    analysis_id = str(uuid.uuid4())
    input_data = {
        "resume_filename": resume.filename,
        "aptitude_score": aptitude_score,
        "communication_score": communication_score,
        "coding_problems_solved": coding_problems_solved,
        "extracted_features": features,
    }

    db.analyses.insert_one({
        "_id": analysis_id,
        "user_id": current_user["id"],
        "created_at": datetime.now(timezone.utc),
        "resume_filename": resume.filename,
        "input_data": input_data,
        "results": results,
    })

    return {
        "id": analysis_id,
        "input_data": input_data,
        "results": results,
    }


@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    """Return all past analyses for the current user, newest first."""
    db = get_db()
    rows = list(
        db.analyses.find(
            {"user_id": current_user["id"]},
            {"_id": 1, "created_at": 1, "resume_filename": 1, "results": 1},
        ).sort("created_at", -1)
    )

    analyses = []
    for row in rows:
        results = row["results"]
        analyses.append({
            "id": row["_id"],
            "created_at": row["created_at"].isoformat(),
            "resume_filename": row.get("resume_filename"),
            "predicted_role": results.get("predicted_role", "N/A"),
            "predicted_tier": results.get("predicted_tier", "N/A"),
            "salary_expected": results.get("salary_range", {}).get("expected", 0),
            "overall_confidence": results.get("overall_confidence", 0),
            "resume_strength": results.get("resume_strength", 0),
        })

    return {"analyses": analyses}


@router.get("/{analysis_id}")
def get_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    """Return a single analysis by ID (must belong to the current user)."""
    db = get_db()
    row = db.analyses.find_one({"_id": analysis_id, "user_id": current_user["id"]})

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "id": row["_id"],
        "created_at": row["created_at"].isoformat(),
        "resume_filename": row.get("resume_filename"),
        "input_data": row["input_data"],
        "results": row["results"],
    }
