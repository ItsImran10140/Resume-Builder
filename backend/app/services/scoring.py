from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Any

from app.data.role_corpus import ALL_STRONG_VERBS, FILLER_PHRASES, ROLE_CORPUS
from app.services.keywords import keyword_match_score

try:
    from app.services.keywords import build_tfidf_match
except ImportError:  # pragma: no cover - compatibility fallback
    build_tfidf_match = None  # type: ignore[assignment]


METRIC_PATTERN = re.compile(
    r"""
    (?:\b\d+(?:\.\d+)?%)|                                           # 40%, 300%
    (?:\$\d+(?:\.\d+)?(?:[kKmMbB])?)|                               # $1.2M, $50K
    (?:\$\d{1,3}(?:,\d{3})+(?:\.\d+)?)|                             # $200,000
    (?:\b\d+(?:\.\d+)?\s?(?:[kKmM])\s+(?:users|requests|hits)\b)|   # 10K users
    (?:\b(?:increased|improved|reduced|decreased|grew)\b
        [^.!?\n]{0,40}?\bby\s+\d+(?:\.\d+)?\b)|                     # increased ... by 40
    (?:\b\d+(?:\.\d+)?x\s+(?:faster|slower|quicker)\b)|             # 3x faster
    (?:\bteam of\s+\d+\b)|                                          # team of 8
    (?:\b\d+\s+engineers\b)                                         # 12 engineers
    """,
    flags=re.IGNORECASE | re.VERBOSE,
)

WEIGHTS = {
    "keywords": 0.28,
    "quantification": 0.22,
    "verbs": 0.16,
    "completeness": 0.16,
    "format_ats": 0.10,
    "impact": 0.08,
}

GRADE_MAP = [
    (85, "Excellent"),
    (70, "Good"),
    (50, "Needs Work"),
    (0, "Poor"),
]


@dataclass(slots=True)
class ScoreIssue:
    """Represents one actionable scoring issue."""

    severity: str
    section: str
    message: str
    fix: str
    score_impact: int


@dataclass(slots=True)
class SectionScores:
    """Container for section-level scores."""

    keywords: float = 0.0
    quantification: float = 0.0
    verbs: float = 0.0
    completeness: float = 0.0
    format_ats: float = 0.0
    impact: float = 0.0


@dataclass(slots=True)
class ScoreResult:
    """Final ATS score payload."""

    total: int
    grade: str
    sections: dict[str, float]
    issues: list[dict[str, Any]]
    strengths: list[str]
    breakdown: dict[str, Any] = field(default_factory=dict)


def _get_experience_bullets(resume: dict[str, Any]) -> list[str]:
    """Extract all non-empty experience bullets from the resume payload."""
    bullets: list[str] = []
    for exp in resume.get("experience", []) or []:
        for bullet in exp.get("bullets", []) or []:
            bullet_text = str(bullet).strip()
            if bullet_text:
                bullets.append(bullet_text)
    return bullets


def _severity_rank(severity: str) -> int:
    """Map issue severity to deterministic sorting rank."""
    return {"critical": 0, "warning": 1, "info": 2}.get(severity, 3)


def _score_to_grade(total: int) -> str:
    """Map numeric score to grade label."""
    for threshold, grade in GRADE_MAP:
        if total >= threshold:
            return grade
    return "Poor"


def _resume_text(resume: dict[str, Any]) -> str:
    """Build a deterministic text representation of a structured resume."""
    parts: list[str] = []
    for key in ("name", "summary", "email", "linkedin"):
        value = resume.get(key)
        if value:
            parts.append(str(value))
    skills = resume.get("skills", []) or []
    parts.extend(str(skill) for skill in skills if str(skill).strip())
    for exp in resume.get("experience", []) or []:
        parts.append(str(exp.get("role", "")))
        parts.append(str(exp.get("company", "")))
        parts.extend(_get_experience_bullets({"experience": [exp]}))
    for edu in resume.get("education", []) or []:
        parts.append(str(edu))
    return " ".join(part for part in parts if part.strip()).lower()


def has_metric(bullet: str) -> bool:
    """Return True when the bullet includes quantifiable outcome signals."""
    return bool(METRIC_PATTERN.search(bullet or ""))


def has_strong_verb(bullet: str) -> tuple[bool, str]:
    """Check whether the first word is a strong action verb."""
    first_word_match = re.match(r"^\s*([a-zA-Z][a-zA-Z\-]*)", bullet or "")
    first_word = first_word_match.group(1).lower() if first_word_match else ""
    return (first_word in ALL_STRONG_VERBS, first_word)


def has_filler(bullet: str) -> str | None:
    """Return the first matched filler phrase, or None if no match."""
    lowered = (bullet or "").lower()
    for phrase in FILLER_PHRASES:
        if phrase in lowered:
            return phrase
    return None


def score_completeness(
    resume: dict[str, Any], corpus_config: dict[str, Any]
) -> tuple[float, list[ScoreIssue]]:
    """Score profile completeness against expected sections and role constraints."""
    issues: list[ScoreIssue] = []

    expected_sections = corpus_config.get("expected_sections", []) or []
    present_expected = 0
    for section in expected_sections:
        value = resume.get(section)
        if isinstance(value, list):
            if len(value) > 0:
                present_expected += 1
        elif value:
            present_expected += 1

    denominator = max(1, len(expected_sections))
    score = (present_expected / denominator) * 100.0

    critical_sections = ("name", "email", "summary", "experience", "education", "skills")
    for section in critical_sections:
        value = resume.get(section)
        missing = (isinstance(value, list) and len(value) == 0) or (
            not isinstance(value, list) and not value
        )
        if missing:
            issues.append(
                ScoreIssue(
                    severity="critical",
                    section=section,
                    message=f"Missing required section: {section}.",
                    fix=f"Add a complete {section} section with role-relevant details.",
                    score_impact=10,
                )
            )

    if not resume.get("linkedin"):
        issues.append(
            ScoreIssue(
                severity="info",
                section="linkedin",
                message="LinkedIn profile is missing.",
                fix="Add a LinkedIn URL to improve recruiter trust and discoverability.",
                score_impact=2,
            )
        )

    skills = resume.get("skills", []) or []
    min_skills = int(corpus_config.get("min_skills", 0))
    if len(skills) < min_skills:
        issues.append(
            ScoreIssue(
                severity="warning",
                section="skills",
                message=f"Skills list is short for this role ({len(skills)}/{min_skills}).",
                fix="Add more concrete tools, languages, and frameworks used in projects.",
                score_impact=6,
            )
        )

    return round(score, 2), issues


def score_quantification(
    resume: dict[str, Any], corpus_config: dict[str, Any]
) -> tuple[float, list[ScoreIssue]]:
    """Score how many bullets demonstrate measurable outcomes."""
    issues: list[ScoreIssue] = []
    bullets = _get_experience_bullets(resume)
    total = len(bullets)
    if total == 0:
        issues.append(
            ScoreIssue(
                severity="critical",
                section="experience",
                message="No experience bullets found.",
                fix="Add bullet points with measurable outcomes for each role.",
                score_impact=15,
            )
        )
        return 0.0, issues

    quantified = sum(1 for bullet in bullets if has_metric(bullet))
    pct_quantified = quantified / total
    target = float(corpus_config.get("min_quantified_bullets_pct", 0.4))
    safe_target = max(target, 0.01)
    score = min(100.0, (pct_quantified / safe_target) * 100.0)

    if pct_quantified < target:
        issues.append(
            ScoreIssue(
                severity="warning",
                section="experience",
                message=(
                    f"Only {pct_quantified:.0%} of bullets are quantified; "
                    f"target is {target:.0%}."
                ),
                fix="Add metrics such as %, $, scale, latency, users, or team size.",
                score_impact=10,
            )
        )

    return round(score, 2), issues


def score_verbs(resume: dict[str, Any]) -> tuple[float, list[ScoreIssue]]:
    """Score action-led writing quality and penalize filler language."""
    issues: list[ScoreIssue] = []
    bullets = _get_experience_bullets(resume)
    total = len(bullets)
    if total == 0:
        return 0.0, [
            ScoreIssue(
                severity="critical",
                section="experience",
                message="No bullets available to evaluate action verbs.",
                fix="Add achievement-focused bullets that start with action verbs.",
                score_impact=12,
            )
        ]

    strong_count = 0
    filler_hits: dict[str, int] = {}
    for bullet in bullets:
        has_action, _ = has_strong_verb(bullet)
        if has_action:
            strong_count += 1
        filler = has_filler(bullet)
        if filler:
            filler_hits[filler] = filler_hits.get(filler, 0) + 1

    score = (strong_count / total) * 100.0

    if filler_hits:
        top_fillers = ", ".join(
            phrase for phrase, _ in sorted(filler_hits.items(), key=lambda item: item[1], reverse=True)[:3]
        )
        issues.append(
            ScoreIssue(
                severity="warning",
                section="experience",
                message=f"Filler phrasing detected: {top_fillers}.",
                fix="Replace filler phrases with strong action-led, outcome-based language.",
                score_impact=8,
            )
        )

    if score < 60.0:
        issues.append(
            ScoreIssue(
                severity="warning",
                section="experience",
                message=f"Only {score:.0f}% of bullets start with strong action verbs.",
                fix="Start each bullet with a strong verb like built, led, improved, or optimized.",
                score_impact=9,
            )
        )

    return round(score, 2), issues


def score_keywords(
    resume: dict[str, Any], corpus_config: dict[str, Any], job_description: str | None = None
) -> tuple[float, list[ScoreIssue], dict[str, Any]]:
    """Score keyword alignment using JD TF-IDF or role corpus fallback."""
    issues: list[ScoreIssue] = []
    resume_text = _resume_text(resume)

    required = [str(k).lower() for k in corpus_config.get("required", []) or []]
    preferred = [str(k).lower() for k in corpus_config.get("preferred", []) or []]

    matched_required = [kw for kw in required if kw in resume_text]
    matched_preferred = [kw for kw in preferred if kw in resume_text]
    missing_required = [kw for kw in required if kw not in resume_text]

    required_cov = (len(matched_required) / len(required) * 100.0) if required else 100.0
    preferred_cov = (len(matched_preferred) / len(preferred) * 100.0) if preferred else 100.0

    if job_description:
        mode = "jd_tfidf" if build_tfidf_match else "jd_keyword_fallback"
        if build_tfidf_match:
            raw_score = build_tfidf_match(resume_text, job_description)
            if isinstance(raw_score, tuple):
                jd_score = float(raw_score[0])
            elif isinstance(raw_score, dict):
                jd_score = float(raw_score.get("score", 0.0))
            else:
                jd_score = float(raw_score)
            score = max(0.0, min(100.0, jd_score))
        else:
            jd_terms = [token for token in re.findall(r"[a-zA-Z][a-zA-Z0-9.+#/-]*", job_description.lower())]
            score = keyword_match_score(resume_text, jd_terms)
    else:
        mode = "role_corpus"
        score = (required_cov * 0.7) + (preferred_cov * 0.3)

    if required_cov < 60.0:
        issues.append(
            ScoreIssue(
                severity="critical",
                section="skills",
                message=f"Low required keyword coverage ({required_cov:.0f}%).",
                fix="Integrate missing required terms into skills and experience bullets.",
                score_impact=14,
            )
        )
    elif required_cov < 80.0:
        issues.append(
            ScoreIssue(
                severity="warning",
                section="skills",
                message=f"Required keyword coverage is moderate ({required_cov:.0f}%).",
                fix="Increase exact-match role keywords in impact-oriented bullets.",
                score_impact=8,
            )
        )

    extra = {
        "matched": sorted(set(matched_required + matched_preferred)),
        "missing": missing_required,
        "mode": mode,
    }
    return round(score, 2), issues, extra


def score_format_ats(resume: dict[str, Any]) -> tuple[float, list[ScoreIssue]]:
    """Score ATS-friendliness of structure and bullet readability."""
    score = 100.0
    issues: list[ScoreIssue] = []

    bullets = _get_experience_bullets(resume)
    long_bullets = [b for b in bullets if len(b.split()) > 30]
    if long_bullets:
        penalty = min(20.0, len(long_bullets) * 3.0)
        score -= penalty
        issues.append(
            ScoreIssue(
                severity="warning",
                section="experience",
                message=f"{len(long_bullets)} bullets exceed 30 words.",
                fix="Keep bullets concise (ideally 12-24 words) with one clear outcome each.",
                score_impact=int(round(penalty)),
            )
        )

    experience = resume.get("experience", []) or []
    for idx, exp in enumerate(experience, start=1):
        missing_fields: list[str] = []
        if not exp.get("company"):
            missing_fields.append("company")
        if not exp.get("role"):
            missing_fields.append("role")
        if missing_fields:
            score -= 10.0
            joined = ", ".join(missing_fields)
            issues.append(
                ScoreIssue(
                    severity="critical",
                    section="experience",
                    message=f"Experience entry #{idx} is missing: {joined}.",
                    fix="Ensure every experience entry has both role title and company name.",
                    score_impact=10,
                )
            )

    return round(max(0.0, score), 2), issues


def score_impact_quality(resume: dict[str, Any]) -> tuple[float, list[str]]:
    """Estimate STAR-style bullet quality and return positive strengths."""
    strengths: list[str] = []
    bullets = _get_experience_bullets(resume)
    total = len(bullets)
    if total == 0:
        return 0.0, strengths

    star_like = 0
    for bullet in bullets:
        action, _ = has_strong_verb(bullet)
        metric = has_metric(bullet)
        enough_context = len(bullet.split()) >= 10
        if action and metric and enough_context:
            star_like += 1

    pct_star = star_like / total
    score = 50.0 + (pct_star * 50.0)

    if pct_star >= 0.5:
        strengths.append("Strong STAR-style writing across experience bullets.")
    if len(resume.get("skills", []) or []) >= 8:
        strengths.append("Solid breadth of skills listed for ATS parsing.")
    if str(resume.get("summary", "")).strip():
        strengths.append("Professional summary is present and improves profile framing.")

    return round(score, 2), strengths


def score_resume(
    resume: dict[str, Any], role_key: str = "full_stack_junior", job_description: str | None = None
) -> ScoreResult:
    """Run deterministic multi-factor ATS scoring and return normalized output."""
    corpus_config = ROLE_CORPUS.get(role_key, ROLE_CORPUS["full_stack_junior"])

    section_scores = SectionScores()
    issues: list[ScoreIssue] = []

    section_scores.completeness, completeness_issues = score_completeness(resume, corpus_config)
    section_scores.quantification, quantification_issues = score_quantification(resume, corpus_config)
    section_scores.verbs, verb_issues = score_verbs(resume)
    section_scores.keywords, keyword_issues, keyword_detail = score_keywords(
        resume, corpus_config, job_description=job_description
    )
    section_scores.format_ats, format_issues = score_format_ats(resume)
    section_scores.impact, strengths = score_impact_quality(resume)

    issues.extend(completeness_issues)
    issues.extend(quantification_issues)
    issues.extend(verb_issues)
    issues.extend(keyword_issues)
    issues.extend(format_issues)

    weighted_total = (
        section_scores.keywords * WEIGHTS["keywords"]
        + section_scores.quantification * WEIGHTS["quantification"]
        + section_scores.verbs * WEIGHTS["verbs"]
        + section_scores.completeness * WEIGHTS["completeness"]
        + section_scores.format_ats * WEIGHTS["format_ats"]
        + section_scores.impact * WEIGHTS["impact"]
    )
    total = int(round(weighted_total))
    grade = _score_to_grade(total)

    sorted_issues = sorted(issues, key=lambda i: (_severity_rank(i.severity), -i.score_impact))
    top_issues = [asdict(issue) for issue in sorted_issues[:8]]

    total_bullets = len(_get_experience_bullets(resume))
    breakdown = {
        "keyword_detail": keyword_detail,
        "total_bullets": total_bullets,
        "role_key": role_key,
        "has_jd_match": bool(job_description),
        "weights": WEIGHTS,
    }

    return ScoreResult(
        total=total,
        grade=grade,
        sections={
            "keywords": round(section_scores.keywords, 2),
            "quantification": round(section_scores.quantification, 2),
            "verbs": round(section_scores.verbs, 2),
            "completeness": round(section_scores.completeness, 2),
            "format_ats": round(section_scores.format_ats, 2),
            "impact": round(section_scores.impact, 2),
        },
        issues=top_issues,
        strengths=strengths,
        breakdown=breakdown,
    )
