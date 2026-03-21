"""
Placify AI — Analysis Routes
Handles resume upload, analysis, and history retrieval.
"""

import json
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

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

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("")
async def create_analysis(
    resume: UploadFile = File(...),
    aptitude_score: float = Form(...),
    communication_score: float = Form(...),
    coding_problems_solved: int = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload resume and generate placement prediction."""

    # ── Validate file ───────────────────────────────────────────────────────
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await resume.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must be under 5MB")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # ── Validate inputs ─────────────────────────────────────────────────────
    if not (0 <= aptitude_score <= 100):
        raise HTTPException(status_code=400, detail="Aptitude score must be between 0 and 100")

    if not (1 <= communication_score <= 5):
        raise HTTPException(status_code=400, detail="Communication score must be between 1 and 5")

    if not (0 <= coding_problems_solved <= 5000):
        raise HTTPException(status_code=400, detail="Coding problems solved must be between 0 and 5000")

    # ── Parse resume ────────────────────────────────────────────────────────
    try:
        resume_features = parse_resume(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to process the resume. Please try a different file.")

    # ── Build feature dict ──────────────────────────────────────────────────
    features = {
        **resume_features,
        "aptitude_score": aptitude_score,
        "communication_score": communication_score,
        "coding_problems_solved": coding_problems_solved,
    }

    # ── Run prediction ──────────────────────────────────────────────────────
    try:
        results = predict(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # ── Evaluate Peer Percentile using Real Database ────────────────────────
    conn = get_db()
    my_readiness = results.get("industry_readiness", 0)
    
    row = conn.execute(
        """
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN CAST(json_extract(results, '$.industry_readiness') AS INTEGER) < ? THEN 1 ELSE 0 END) as below
        FROM analyses
        """,
        (my_readiness,)
    ).fetchone()
    
    total_users = row["total"] or 0
    below_users = row["below"] or 0
    
    # Calculate real percentile (+1 to include current execution)
    real_percentile = int((below_users / (total_users + 1)) * 100) if total_users > 0 else 99
    results["peer_percentile"] = real_percentile

    # ── Save to database ────────────────────────────────────────────────────
    analysis_id = str(uuid.uuid4())
    input_data = {
        "resume_filename": resume.filename,
        "aptitude_score": aptitude_score,
        "communication_score": communication_score,
        "coding_problems_solved": coding_problems_solved,
        "extracted_features": features,
    }

    conn.execute(
        "INSERT INTO analyses (id, user_id, resume_filename, input_data, results) VALUES (?, ?, ?, ?, ?)",
        (analysis_id, current_user["id"], resume.filename, json.dumps(input_data), json.dumps(results))
    )
    conn.commit()
    conn.close()

    return {
        "id": analysis_id,
        "input_data": input_data,
        "results": results,
    }


@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    """Get all past analyses for the current user."""
    conn = get_db()
    rows = conn.execute(
        "SELECT id, created_at, resume_filename, input_data, results FROM analyses WHERE user_id = ? ORDER BY created_at DESC",
        (current_user["id"],)
    ).fetchall()
    conn.close()

    analyses = []
    for row in rows:
        results = json.loads(row["results"])
        analyses.append({
            "id": row["id"],
            "created_at": row["created_at"],
            "resume_filename": row["resume_filename"],
            "predicted_role": results.get("predicted_role", "N/A"),
            "predicted_tier": results.get("predicted_tier", "N/A"),
            "salary_expected": results.get("salary_range", {}).get("expected", 0),
            "overall_confidence": results.get("overall_confidence", 0),
            "resume_strength": results.get("resume_strength", 0),
        })

    return {"analyses": analyses}


@router.get("/{analysis_id}")
def get_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single analysis by ID."""
    conn = get_db()
    row = conn.execute(
        "SELECT id, created_at, resume_filename, input_data, results FROM analyses WHERE id = ? AND user_id = ?",
        (analysis_id, current_user["id"])
    ).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "resume_filename": row["resume_filename"],
        "input_data": json.loads(row["input_data"]),
        "results": json.loads(row["results"]),
    }
