export type ScoreBreakdown = {
  keywords: number;
  sections: number;
  formatting: number;
  length: number;
};

export type ScoreSuggestion = {
  type: "keyword" | "section" | "formatting" | "length" | "verbs" | "repetition";
  message: string;
  priority: "high" | "medium" | "low";
  fix?: string;
};

export type ScoreCategoryIssue = {
  severity: string;
  message: string;
  fix: string;
  score_impact: number;
};

export type ScoreCategory = {
  id: string;
  label: string;
  description: string;
  score: number;
  issue_count: number;
  issues: ScoreCategoryIssue[];
};

export type ScoreStrength = {
  title: string;
  message: string;
};

export type ScoreMetrics = {
  total_bullets: number;
  quantified_bullets: number;
  unquantified_bullets: number;
};

export type AiRewrite = {
  original: string;
  improved: string;
  why: string;
};

export type AiAudit = {
  top_fix?: string;
  rewrites?: AiRewrite[];
  missing_angle?: string;
  error?: string;
};

export type ScoreReport = {
  overall: number;
  grade: string;
  breakdown: ScoreBreakdown;
  suggestions: ScoreSuggestion[];
  categories: ScoreCategory[];
  strengths: ScoreStrength[];
  metrics: ScoreMetrics;
  aiAudit: AiAudit | null;
};

export type StoredScoreBreakdown = ScoreBreakdown & {
  grade?: string;
  categories?: ScoreCategory[];
  strengths?: ScoreStrength[];
  metrics?: ScoreMetrics;
  aiAudit?: AiAudit | null;
};
