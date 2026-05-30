from __future__ import annotations

import hashlib
import json
from typing import Any

from app.services.audit_prompt import build_audit_prompt, strip_markdown_fences
from app.services.llm_client import chat_completion

AUDIT_CACHE_TTL = 86400


async def get_ai_audit(
    resume: dict, role_key: str, issues: list[dict], redis_client
) -> dict[str, Any]:
    """Get AI audit once per saved resume revision with Redis caching."""
    try:
        fingerprint = hashlib.sha256(json.dumps(resume, sort_keys=True).encode("utf-8")).hexdigest()[:16]
        cache_key = f"audit:{fingerprint}"

        cached = await redis_client.get(cache_key)
        if cached:
            if isinstance(cached, bytes):
                return json.loads(cached.decode("utf-8"))
            return json.loads(cached)

        prompt = build_audit_prompt(resume, role_key, issues)
        raw = chat_completion(prompt, max_tokens=600)
        if not raw:
            return {"error": "audit_unavailable"}

        cleaned = strip_markdown_fences(raw)
        try:
            result = json.loads(cleaned)
        except Exception:
            return {"error": "audit_parse_failed", "raw": raw[:200]}

        await redis_client.set(cache_key, json.dumps(result), ex=AUDIT_CACHE_TTL)
        return result
    except Exception:
        return {"error": "audit_unavailable"}
