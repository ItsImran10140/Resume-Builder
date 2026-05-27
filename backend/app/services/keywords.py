from __future__ import annotations

from sklearn.feature_extraction.text import TfidfVectorizer


def keyword_match_score(resume_text: str, target_keywords: list[str]) -> float:
    if not target_keywords:
        return 70.0

    corpus = [resume_text.lower(), " ".join(k.lower() for k in target_keywords)]
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    matrix = vectorizer.fit_transform(corpus)

    resume_vec = matrix[0].toarray()[0]
    keyword_vec = matrix[1].toarray()[0]

    if resume_vec.sum() == 0 or keyword_vec.sum() == 0:
        return 0.0

    overlap = (resume_vec * keyword_vec).sum()
    denom = keyword_vec.sum()
    ratio = overlap / denom if denom else 0.0
    return min(100.0, ratio * 100.0)
