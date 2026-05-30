from __future__ import annotations

import re
from collections import Counter
from typing import Any

from app.services.scoring import ScoreIssue, _get_experience_bullets, has_metric

CATEGORY_META: list[dict[str, str]] = [
    {
        "id": "quantification",
        "label": "Quantify impact",
        "description": "Use numbers and metrics in your bullet points so recruiters see measurable outcomes.",
        "section_keys": ("experience", "quantification"),
    },
    {
        "id": "keywords",
        "label": "Keywords",
        "description": "Match role-relevant skills and terms that ATS systems and recruiters scan for.",
        "section_keys": ("skills", "keywords"),
    },
    {
        "id": "verbs",
        "label": "Action verbs",
        "description": "Start bullets with strong verbs and avoid weak filler phrasing.",
        "section_keys": ("experience", "verbs"),
    },
    {
        "id": "repetition",
        "label": "Repetition",
        "description": "Avoid repeating the same action verbs — variety shows a broader skill set.",
        "section_keys": ("repetition",),
    },
    {
        "id": "completeness",
        "label": "Sections",
        "description": "Include all expected resume sections with complete, role-relevant content.",
        "section_keys": ("summary", "education", "experience", "skills", "projects", "completeness"),
    },
    {
        "id": "format_ats",
        "label": "Formatting",
        "description": "Keep layout ATS-friendly: clear structure, no problematic formatting.",
        "section_keys": ("format_ats", "format"),
    },
]


def detect_verb_repetition(resume: dict[str, Any]) -> tuple[float, list[ScoreIssue]]:
    """Flag overused first words in experience bullets."""
    bullets = _get_experience_bullets(resume)
    if not bullets:
        return 100.0, []

    first_words: list[str] = []
    for bullet in bullets:
        match = re.match(r"^\s*([A-Za-z][A-Za-z\-]*)", bullet or "")
        if match:
            first_words.append(match.group(1).lower())

    if not first_words:
        return 100.0, []

    counts = Counter(first_words)
    issues: list[ScoreIssue] = []
    repeated = [(word, count) for word, count in counts.items() if count >= 3]

    if repeated:
        parts = [f"{word} ({count}×)" for word, count in sorted(repeated, key=lambda x: -x[1])[:4]]
        issues.append(
            ScoreIssue(
                severity="warning",
                section="repetition",
                message=f"Repeated action verbs: {', '.join(parts)}.",
                fix="Replace duplicates with varied strong verbs (built, led, optimized, shipped).",
                score_impact=8,
            )
        )

    repetition_penalty = sum(max(0, count - 2) for _, count in counts.items())
    score = max(0.0, 100.0 - (repetition_penalty * 12))
    return round(score, 2), issues


def _issue_matches_category(issue: ScoreIssue, category: dict[str, str]) -> bool:
    section = issue.section.lower()
    keys = category["section_keys"]
    if section in keys:
        return True
    message = issue.message.lower()
    if category["id"] == "quantification" and ("quantif" in message or "metric" in message):
        return True
    if category["id"] == "keywords" and "keyword" in message:
        return True
    return False


def build_metrics(resume: dict[str, Any]) -> dict[str, Any]:
    bullets = _get_experience_bullets(resume)
    total = len(bullets)
    quantified = sum(1 for bullet in bullets if has_metric(bullet))
    return {
        "total_bullets": total,
        "quantified_bullets": quantified,
        "unquantified_bullets": max(0, total - quantified),
    }


def build_categories(
    section_scores: dict[str, float],
    all_issues: list[ScoreIssue],
) -> list[dict[str, Any]]:
    categories: list[dict[str, Any]] = []

    score_by_id = {
        "quantification": section_scores.get("quantification", 0),
        "keywords": section_scores.get("keywords", 0),
        "verbs": section_scores.get("verbs", 0),
        "repetition": section_scores.get("repetition", 100),
        "completeness": section_scores.get("completeness", 0),
        "format_ats": section_scores.get("format_ats", 0),
    }

    for meta in CATEGORY_META:
        cat_id = meta["id"]
        matched = [issue for issue in all_issues if _issue_matches_category(issue, meta)]
        categories.append(
            {
                "id": cat_id,
                "label": meta["label"],
                "description": meta["description"],
                "score": round(score_by_id.get(cat_id, 0), 1),
                "issue_count": len(matched),
                "issues": [
                    {
                        "severity": issue.severity,
                        "message": issue.message,
                        "fix": issue.fix,
                        "score_impact": issue.score_impact,
                    }
                    for issue in matched
                ],
            }
        )

    return categories


def build_strength_cards(strengths: list[str]) -> list[dict[str, str]]:
    return [{"title": text, "message": text} for text in strengths if text.strip()]
