import os
from dataclasses import asdict
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.data.role_corpus import ROLE_CORPUS
from app.services.ai_audit_sync import get_ai_audit_sync
from app.services.score_report import (
    build_categories,
    build_metrics,
    build_strength_cards,
    detect_verb_repetition,
)
from app.services.scoring import ScoreIssue, score_resume

router = APIRouter(prefix="/score", tags=["score"])


def _internal_key() -> str:
    return os.environ.get("INTERNAL_SECRET", "dev-secret")


class ScoreRequest(BaseModel):
    resume: dict[str, Any]
    role_key: str = "full_stack_junior"
    job_description: str | None = None
    include_ai: bool = True


@router.post("")
def score(payload: ScoreRequest, x_internal_key: str | None = Header(None)) -> dict[str, Any]:
    if x_internal_key != _internal_key():
        raise HTTPException(
            status_code=403,
            detail="Forbidden — x-internal-key does not match INTERNAL_SECRET in backend/.env",
        )

    if payload.role_key not in ROLE_CORPUS:
        raise HTTPException(status_code=400, detail="Invalid role_key")

    result = score_resume(payload.resume, payload.role_key, payload.job_description)

    repetition_score, repetition_issues = detect_verb_repetition(payload.resume)
    merged_sections = {**result.sections, "repetition": repetition_score}

    all_issue_dicts = list(result.issues)
    for issue in repetition_issues:
        all_issue_dicts.append(asdict(issue))

    issue_objects = [
        ScoreIssue(
            severity=str(i.get("severity", "info")),
            section=str(i.get("section", "")),
            message=str(i.get("message", "")),
            fix=str(i.get("fix", "")),
            score_impact=int(i.get("score_impact", 0)),
        )
        for i in all_issue_dicts
    ]

    categories = build_categories(merged_sections, issue_objects)
    metrics = build_metrics(payload.resume)
    strength_cards = build_strength_cards(result.strengths)

    ai_audit = None
    if payload.include_ai:
        ai_audit = get_ai_audit_sync(payload.resume, payload.role_key, all_issue_dicts[:6])

    return {
        "total": result.total,
        "grade": result.grade,
        "sections": merged_sections,
        "issues": all_issue_dicts,
        "strengths": result.strengths,
        "strength_cards": strength_cards,
        "breakdown": result.breakdown,
        "categories": categories,
        "metrics": metrics,
        "ai_audit": ai_audit,
    }


@router.get("/health")
def score_health() -> dict[str, str]:
    return {"status": "ok"}
