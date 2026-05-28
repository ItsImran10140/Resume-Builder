from __future__ import annotations

import re
from typing import Final

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_STOP: Final[set[str]] = {
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "doing",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "has",
    "have",
    "having",
    "he",
    "her",
    "here",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "itself",
    "just",
    "me",
    "more",
    "most",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "she",
    "should",
    "so",
    "some",
    "such",
    "than",
    "that",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "why",
    "will",
    "with",
    "would",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
}

_TOKEN_RE: Final[re.Pattern[str]] = re.compile(r"\b[a-zA-Z][a-zA-Z0-9\+\#\.]{1,}\b")


def _clean(text: str) -> list[str]:
    """Extract and normalize keyword tokens from arbitrary text."""
    tokens = [token.lower() for token in _TOKEN_RE.findall(text or "")]
    return [token for token in tokens if token not in _STOP and len(token) > 2]


def build_tfidf_match(resume_text: str, job_description: str) -> tuple[float, list[str], list[str]]:
    """Return hybrid TF-IDF keyword alignment score and term coverage details."""
    resume_keywords = set(_clean(resume_text))
    jd_keywords = set(_clean(job_description))

    if not jd_keywords:
        return 0.0, [], []

    matched = sorted(jd_keywords.intersection(resume_keywords))
    missing = sorted(jd_keywords.difference(resume_keywords))
    keyword_pct = len(matched) / len(jd_keywords)

    cos_sim = 0.0
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=500,
        )
        matrix = vectorizer.fit_transform([resume_text or "", job_description or ""])
        cos_sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    except Exception:
        cos_sim = keyword_pct

    score = min(100.0, round((keyword_pct * 0.6 + cos_sim * 0.4) * 100.0))
    return float(score), matched[:25], missing[:20]


def keyword_match_score(resume_text: str, target_keywords: list[str]) -> float:
    """Backward-compatible helper for scoring against an explicit keyword list."""
    if not target_keywords:
        return 0.0
    score, _, _ = build_tfidf_match(resume_text, " ".join(target_keywords))
    return score
