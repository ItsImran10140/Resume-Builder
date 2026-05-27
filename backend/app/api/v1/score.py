from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.scoring import score_resume_text

router = APIRouter(prefix="/score", tags=["score"])


class ScoreRequest(BaseModel):
    text: str = Field(min_length=1)
    job_title: str | None = None
    target_keywords: list[str] = Field(default_factory=list)


@router.post("")
def score_resume(payload: ScoreRequest):
    return score_resume_text(
        payload.text,
        job_title=payload.job_title,
        target_keywords=payload.target_keywords,
    )
