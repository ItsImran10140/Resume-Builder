import { plainTextToResume } from "@/lib/plain-text-to-resume";
import type {
  AiAudit,
  ScoreBreakdown,
  ScoreCategory,
  ScoreMetrics,
  ScoreReport,
  ScoreStrength,
  ScoreSuggestion,
} from "@/lib/score-types";

export type {
  AiAudit,
  AiRewrite,
  ScoreBreakdown,
  ScoreCategory,
  ScoreMetrics,
  ScoreReport,
  ScoreStrength,
  ScoreSuggestion,
} from "@/lib/score-types";

type BackendScoreResponse = {
  total: number;
  grade: string;
  sections: Record<string, number>;
  issues: {
    severity: string;
    section: string;
    message: string;
    fix: string;
    score_impact: number;
  }[];
  strengths: string[];
  strength_cards?: ScoreStrength[];
  categories: ScoreCategory[];
  metrics: ScoreMetrics;
  ai_audit: AiAudit | null;
};

const DEFAULT_ROLE_KEY = "full_stack_junior";

function issueType(section: string): ScoreSuggestion["type"] {
  const key = section.toLowerCase();
  if (key === "repetition") return "repetition";
  if (key.includes("keyword") || key === "skills") return "keyword";
  if (key.includes("format")) return "formatting";
  if (key.includes("quant") || key.includes("verb") || key === "experience") {
    return key.includes("verb") ? "verbs" : "length";
  }
  return "section";
}

function issuePriority(severity: string): ScoreSuggestion["priority"] {
  if (severity === "critical") return "high";
  if (severity === "warning") return "medium";
  return "low";
}

function mapBackendResponse(data: BackendScoreResponse): ScoreReport {
  const sections = data.sections;

  const breakdown: ScoreBreakdown = {
    keywords: sections.keywords ?? 0,
    sections: sections.completeness ?? 0,
    formatting: sections.format_ats ?? 0,
    length: sections.quantification ?? 0,
  };

  const suggestions: ScoreSuggestion[] = data.issues.map((issue) => ({
    type: issueType(issue.section),
    message: issue.message,
    fix: issue.fix,
    priority: issuePriority(issue.severity),
  }));

  const strengths: ScoreStrength[] =
    data.strength_cards?.length
      ? data.strength_cards
      : data.strengths.map((text) => ({ title: text, message: text }));

  return {
    overall: data.total,
    grade: data.grade,
    breakdown,
    suggestions,
    categories: data.categories ?? [],
    strengths,
    metrics: data.metrics ?? {
      total_bullets: 0,
      quantified_bullets: 0,
      unquantified_bullets: 0,
    },
    aiAudit: data.ai_audit ?? null,
  };
}

export async function scoreResume(
  plainText: string,
  jobTitle?: string,
  roleKey: string = DEFAULT_ROLE_KEY,
): Promise<ScoreReport> {
  const baseUrl = process.env.SCORER_API_URL ?? "http://localhost:8000";
  const internalKey = process.env.INTERNAL_SECRET ?? "dev-secret";
  const resume = plainTextToResume(plainText);

  const res = await fetch(`${baseUrl}/api/v1/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": internalKey,
    },
    body: JSON.stringify({
      resume,
      role_key: roleKey,
      job_description: jobTitle?.trim() || null,
      include_ai: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Scorer API error (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as BackendScoreResponse;
  return mapBackendResponse(data);
}

/** Persisted shape stored in Prisma `breakdown` JSON column. */
export function scoreReportToStoredBreakdown(report: ScoreReport) {
  return {
    ...report.breakdown,
    grade: report.grade,
    categories: report.categories,
    strengths: report.strengths,
    metrics: report.metrics,
    aiAudit: report.aiAudit,
  };
}

export function storedBreakdownToReport(
  overall: number,
  stored: unknown,
  suggestions: ScoreSuggestion[],
): ScoreReport | null {
  if (!stored || typeof stored !== "object") return null;
  const row = stored as Record<string, unknown>;
  const breakdown: ScoreBreakdown = {
    keywords: Number(row.keywords) || 0,
    sections: Number(row.sections) || 0,
    formatting: Number(row.formatting) || 0,
    length: Number(row.length) || 0,
  };
  return {
    overall,
    grade: typeof row.grade === "string" ? row.grade : "Needs Work",
    breakdown,
    suggestions,
    categories: Array.isArray(row.categories) ? (row.categories as ScoreCategory[]) : [],
    strengths: Array.isArray(row.strengths) ? (row.strengths as ScoreStrength[]) : [],
    metrics:
      row.metrics && typeof row.metrics === "object"
        ? (row.metrics as ScoreMetrics)
        : { total_bullets: 0, quantified_bullets: 0, unquantified_bullets: 0 },
    aiAudit: (row.aiAudit as AiAudit | null) ?? null,
  };
}
