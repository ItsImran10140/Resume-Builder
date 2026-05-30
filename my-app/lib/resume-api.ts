import type { ScoreBreakdown, ScoreReport, ScoreSuggestion } from "@/lib/score-types";
import {
  buildResumeContent,
  parseResumeContent,
  type ResumeContentJson,
} from "@/lib/resume-content";

export type ResumeRecord = {
  id: string;
  userId: string;
  title: string;
  content: unknown;
  fileKey: string | null;
  createdAt: string;
  updatedAt: string;
  scores?: ScoreRecord[];
};

export type ResumeListItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  scores: { overall: number; createdAt: string }[];
};

export type ScoreRecord = {
  id: string;
  resumeId: string;
  overall: number;
  breakdown: ScoreBreakdown;
  suggestions: ScoreSuggestion[];
  jobTitle: string | null;
  createdAt: string;
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function createResume(
  title: string,
  html: string,
  fileName?: string,
): Promise<ResumeRecord> {
  const res = await fetch("/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      content: buildResumeContent(html, fileName),
    }),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ResumeRecord>;
}

export async function listResumes(): Promise<ResumeListItem[]> {
  const res = await fetch("/api/resumes");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ResumeListItem[]>;
}

export async function fetchResume(id: string): Promise<ResumeRecord> {
  const res = await fetch(`/api/resumes/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ResumeRecord>;
}

export async function updateResume(
  id: string,
  payload: { title?: string; html?: string; fileName?: string },
): Promise<ResumeRecord> {
  const body: { title?: string; content?: ResumeContentJson } = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.html !== undefined) {
    body.content = buildResumeContent(payload.html, payload.fileName);
  }

  const res = await fetch(`/api/resumes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ResumeRecord>;
}

export async function scoreResume(
  id: string,
  plainText: string,
  jobTitle?: string,
): Promise<{
  score: ScoreRecord;
  report: ScoreReport;
}> {
  const res = await fetch(`/api/resumes/${id}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plainText, jobTitle }),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    score: ScoreRecord;
    report: ScoreReport;
  }>;
}

export function resumeToEditorState(resume: ResumeRecord) {
  const { html, fileName } = parseResumeContent(resume.content);
  return {
    id: resume.id,
    title: resume.title,
    html,
    fileName: fileName ?? null,
    latestScore: (resume.scores?.[0] as ScoreRecord | undefined) ?? null,
  };
}
