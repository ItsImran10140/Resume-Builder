from __future__ import annotations

from typing import Any


def _first_bullets(resume: dict[str, Any], limit: int = 12) -> list[str]:
    bullets: list[str] = []
    for exp in resume.get("experience", []) or []:
        for bullet in exp.get("bullets", []) or []:
            text = str(bullet).strip()
            if text:
                bullets.append(text)
            if len(bullets) >= limit:
                return bullets
    return bullets


def strip_markdown_fences(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```json"):
        text = text[len("```json") :].strip()
    elif text.startswith("```"):
        text = text[len("```") :].strip()
    if text.endswith("```"):
        text = text[:-3].strip()
    return text


def build_audit_prompt(resume: dict, role_key: str, issues: list[dict]) -> str:
    """Build a constrained recruiter-style audit prompt for one explicit save event."""
    name = str(resume.get("name", "")).strip() or "Unknown candidate"
    summary = str(resume.get("summary", "")).strip()[:200]
    skills = [str(skill).strip() for skill in (resume.get("skills", []) or []) if str(skill).strip()][:15]
    bullets = _first_bullets(resume, limit=12)
    issue_messages = [
        str(issue.get("message", "")).strip()
        for issue in issues[:4]
        if str(issue.get("message", "")).strip()
    ]

    skills_text = ", ".join(skills) if skills else "None provided"
    bullets_text = "\n".join(f"- {bullet}" for bullet in bullets) if bullets else "- None provided"
    issues_text = "\n".join(f"• {msg}" for msg in issue_messages) if issue_messages else "• None provided"

    return (
        "You are a senior technical recruiter.\n\n"
        f"Role target: {role_key}\n"
        f"Candidate name: {name}\n"
        f"Summary (truncated): {summary}\n"
        f"Top skills (first 15): {skills_text}\n\n"
        "Experience bullets (first 12):\n"
        f"{bullets_text}\n\n"
        "Automated ATS issues (first 4):\n"
        f"{issues_text}\n\n"
        "Provide exactly 3 specific actionable improvements.\n"
        "Limit rewrites to 2 maximum.\n"
        "Return ONLY valid JSON with no markdown and no extra keys, using exactly this schema:\n"
        "{\n"
        '  "top_fix": "single most important change (1 sentence)",\n'
        '  "rewrites": [\n'
        "    {\n"
        '      "original": "exact bullet that needs fixing",\n'
        '      "improved": "your improved version",\n'
        '      "why": "brief reason"\n'
        "    }\n"
        "  ],\n"
        '  "missing_angle": "what important aspect is not coming through at all"\n'
        "}"
    )
