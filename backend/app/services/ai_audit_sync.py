from __future__ import annotations

import json
from typing import Any

from app.services.audit_prompt import build_audit_prompt, strip_markdown_fences
from app.services.llm_client import chat_completion


def get_ai_audit_sync(resume: dict, role_key: str, issues: list[dict]) -> dict[str, Any] | None:
    """Run a one-shot AI audit via OpenRouter or Anthropic."""
    prompt = build_audit_prompt(resume, role_key, issues)
    raw = chat_completion(prompt, max_tokens=600)
    if not raw:
        return None

    try:
        cleaned = strip_markdown_fences(raw)
        result = json.loads(cleaned)
        if isinstance(result, dict) and "error" not in result:
            return result
    except json.JSONDecodeError:
        return None
    return None
