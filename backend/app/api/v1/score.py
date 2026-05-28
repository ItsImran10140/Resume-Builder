import os
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.data.role_corpus import ROLE_CORPUS
from app.services.scoring import score_resume

INTERNAL_KEY = os.environ.get("INTERNAL_SECRET", "dev-secret")

router = APIRouter(prefix="/score", tags=["score"])


class ScoreRequest(BaseModel):
    resume: dict[str, Any]
    role_key: str = "full_stack_junior"
    job_description: str | None = None


@router.post("")
def score(payload: ScoreRequest, x_internal_key: str | None = Header(None)) -> dict[str, Any]:
    if x_internal_key != INTERNAL_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")

    if payload.role_key not in ROLE_CORPUS:
        raise HTTPException(status_code=400, detail="Invalid role_key")

    result = score_resume(payload.resume, payload.role_key, payload.job_description)
    return {
        "total": result.total,
        "grade": result.grade,
        "sections": result.sections,
        "issues": result.issues,
        "strengths": result.strengths,
        "breakdown": result.breakdown,
    }


@router.get("/health")
def score_health() -> dict[str, str]:
    return {"status": "ok"}
