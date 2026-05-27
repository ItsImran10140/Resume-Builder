from __future__ import annotations

from app.services.keywords import keyword_match_score
from app.services.nlp import extract_sections

DEFAULT_KEYWORDS = [
    "leadership",
    "communication",
    "project management",
    "analysis",
    "collaboration",
    "problem solving",
]


def section_coverage_score(sections: dict[str, str]) -> float:
    expected = {"experience", "education", "skills"}
    found = {key for key in sections if sections[key]}
    matched = len(expected.intersection(found))
    return (matched / len(expected)) * 100.0


def formatting_score(text: str) -> float:
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        return 0.0

    bullet_lines = sum(1 for line in lines if line.strip().startswith(("-", "•", "*")))
    bullet_ratio = bullet_lines / len(lines)
    score = 50.0 + min(50.0, bullet_ratio * 120.0)
    return min(100.0, score)


def length_score(text: str) -> float:
    words = len(text.split())
    if 250 <= words <= 900:
        return 100.0
    if words < 250:
        return max(20.0, (words / 250) * 100.0)
    return max(40.0, 100.0 - ((words - 900) / 600) * 60.0)


def build_suggestions(
    breakdown: dict[str, float],
    sections: dict[str, str],
    keywords: list[str],
) -> list[dict]:
    suggestions: list[dict] = []

    if breakdown["keywords"] < 70:
        suggestions.append(
            {
                "type": "keyword",
                "priority": "high",
                "message": "Add role-specific keywords from the job description to your experience bullets.",
            }
        )

    if "experience" not in sections or not sections.get("experience"):
        suggestions.append(
            {
                "type": "section",
                "priority": "high",
                "message": "Add a clear Work Experience section with measurable achievements.",
            }
        )

    if breakdown["formatting"] < 65:
        suggestions.append(
            {
                "type": "formatting",
                "priority": "medium",
                "message": "Use consistent bullet points and short action-led lines.",
            }
        )

    if breakdown["length"] < 70:
        suggestions.append(
            {
                "type": "length",
                "priority": "medium",
                "message": "Aim for about one page (250–900 words) unless you are very senior.",
            }
        )

    if keywords:
        missing_hint = ", ".join(keywords[:5])
        suggestions.append(
            {
                "type": "keyword",
                "priority": "low",
                "message": f"Target keywords to weave in: {missing_hint}",
            }
        )

    return suggestions


def score_resume_text(
    text: str,
    job_title: str | None = None,
    target_keywords: list[str] | None = None,
) -> dict:
    keywords = target_keywords or DEFAULT_KEYWORDS
    if job_title:
        keywords = [*keywords, *job_title.lower().split()]

    sections = extract_sections(text)

    breakdown = {
        "keywords": keyword_match_score(text, keywords),
        "sections": section_coverage_score(sections),
        "formatting": formatting_score(text),
        "length": length_score(text),
    }

    weights = {
        "keywords": 0.4,
        "sections": 0.25,
        "formatting": 0.2,
        "length": 0.15,
    }

    overall = sum(breakdown[key] * weights[key] for key in weights)

    return {
        "overall": round(overall, 1),
        "breakdown": {k: round(v, 1) for k, v in breakdown.items()},
        "suggestions": build_suggestions(breakdown, sections, keywords),
        "extracted_sections": sections,
    }
