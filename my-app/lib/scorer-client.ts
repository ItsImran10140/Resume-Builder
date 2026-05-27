export type ScoreBreakdown = {
  keywords: number;
  sections: number;
  formatting: number;
  length: number;
};

export type ScoreSuggestion = {
  type: "keyword" | "section" | "formatting" | "length";
  message: string;
  priority: "high" | "medium" | "low";
};

export type ScorerResponse = {
  overall: number;
  breakdown: ScoreBreakdown;
  suggestions: ScoreSuggestion[];
  extracted_sections?: Record<string, string>;
};

export async function scoreResume(
  plainText: string,
  jobTitle?: string,
  targetKeywords?: string[],
): Promise<ScorerResponse> {
  const baseUrl = process.env.SCORER_API_URL ?? "http://localhost:8000";

  const res = await fetch(`${baseUrl}/api/v1/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: plainText,
      job_title: jobTitle,
      target_keywords: targetKeywords ?? [],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Scorer API error (${res.status}): ${detail}`);
  }

  return res.json() as Promise<ScorerResponse>;
}
