from __future__ import annotations

import re

SECTION_HEADERS = {
    "experience",
    "work experience",
    "employment",
    "education",
    "skills",
    "summary",
    "profile",
    "projects",
    "certifications",
    "contact",
}


def extract_sections(text: str) -> dict[str, str]:
    """Split resume plain text into coarse sections using header heuristics."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sections: dict[str, list[str]] = {}
    current = "header"

    for line in lines:
        normalized = re.sub(r"[^a-z\s]", "", line.lower()).strip()
        if normalized in SECTION_HEADERS:
            current = normalized.replace(" ", "_")
            sections.setdefault(current, [])
            continue

        sections.setdefault(current, []).append(line)

    return {key: "\n".join(value).strip() for key, value in sections.items() if value}
