from __future__ import annotations

import os
from typing import Any

import httpx

OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_OPENROUTER_MODEL = "anthropic/claude-3.5-haiku"


def _api_key() -> str:
    """OpenRouter key from OPENROUTER_API_KEY or ANTHROPIC_API_KEY (legacy name)."""
    return (
        os.environ.get("OPENROUTER_API_KEY", "").strip()
        or os.environ.get("ANTHROPIC_API_KEY", "").strip()
    )


def _model() -> str:
    return os.environ.get("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL).strip()


def _use_openrouter(key: str) -> bool:
    return key.startswith("sk-or-") or bool(os.environ.get("OPENROUTER_API_KEY", "").strip())


def chat_completion(prompt: str, *, max_tokens: int = 600) -> str | None:
    """Call OpenRouter (OpenAI-compatible) or direct Anthropic based on the API key."""
    key = _api_key()
    if not key:
        return None

    if _use_openrouter(key):
        return _openrouter_chat(key, prompt, max_tokens=max_tokens)

    return _anthropic_chat(key, prompt, max_tokens=max_tokens)


def _openrouter_chat(api_key: str, prompt: str, *, max_tokens: int) -> str | None:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.environ.get("OPENROUTER_SITE_URL", "http://localhost:3000"),
        "X-Title": os.environ.get("OPENROUTER_APP_NAME", "Resume Builder"),
    }
    payload: dict[str, Any] = {
        "model": _model(),
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }

    try:
        with httpx.Client(timeout=90.0) as client:
            response = client.post(OPENROUTER_CHAT_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            choices = data.get("choices") or []
            if not choices:
                return None
            message = choices[0].get("message") or {}
            content = message.get("content")
            return str(content).strip() if content else None
    except Exception:
        return None


def _anthropic_chat(api_key: str, prompt: str, *, max_tokens: int) -> str | None:
    try:
        from anthropic import Anthropic
    except ImportError:
        return None

    try:
        client = Anthropic(api_key=api_key)
        message = client.messages.create(
            model=os.environ.get("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return getattr(message.content[0], "text", "") or None
    except Exception:
        return None
