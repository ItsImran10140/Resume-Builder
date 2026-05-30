import { create } from "zustand";
import type {
  AiAudit,
  ScoreBreakdown,
  ScoreCategory,
  ScoreMetrics,
  ScoreReport,
  ScoreStrength,
  ScoreSuggestion,
} from "@/lib/score-types";

export type ScoreBreakdownState = ScoreBreakdown;

type ResumeEditorState = {
  resumeId: string | null;
  title: string;
  htmlContent: string;
  plainText: string;
  isDirty: boolean;
  isSaving: boolean;
  atsScore: number | null;
  scoreGrade: string | null;
  scoreBreakdown: ScoreBreakdownState | null;
  scoreCategories: ScoreCategory[];
  scoreStrengths: ScoreStrength[];
  scoreMetrics: ScoreMetrics | null;
  aiAudit: AiAudit | null;
  suggestions: ScoreSuggestion[];
  selectedCategoryId: string | null;
  isScoring: boolean;
  scoringMessage: string | null;
  aiCoachStatus: "idle" | "pending" | "ready" | "unavailable";
  scoreError: string | null;
  jobTitle: string;
  lastScoredAt: string | null;
  setResumeId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setHtmlContent: (html: string) => void;
  setPlainText: (text: string) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setScoreReport: (report: ScoreReport) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setScoring: (scoring: boolean) => void;
  setScoreError: (error: string | null) => void;
  setJobTitle: (jobTitle: string) => void;
  reset: () => void;
};

const initialState = {
  resumeId: null,
  title: "Untitled resume",
  htmlContent: "",
  plainText: "",
  isDirty: false,
  isSaving: false,
  atsScore: null,
  scoreGrade: null,
  scoreBreakdown: null,
  scoreCategories: [] as ScoreCategory[],
  scoreStrengths: [] as ScoreStrength[],
  scoreMetrics: null as ScoreMetrics | null,
  aiAudit: null as AiAudit | null,
  suggestions: [] as ScoreSuggestion[],
  selectedCategoryId: null as string | null,
  isScoring: false,
  scoringMessage: null,
  aiCoachStatus: "idle" as const,
  scoreError: null,
  jobTitle: "",
  lastScoredAt: null,
};

export const useResumeStore = create<ResumeEditorState>((set) => ({
  ...initialState,
  setResumeId: (resumeId) => set({ resumeId }),
  setTitle: (title) => set({ title, isDirty: true }),
  setHtmlContent: (htmlContent) => set({ htmlContent, isDirty: true }),
  setPlainText: (plainText) => set({ plainText }),
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),
  setScoreReport: (report) => {
    const topFix =
      report.categories.find((c) => c.issue_count > 0)?.id ??
      report.categories[0]?.id ??
      null;
    set({
      atsScore: report.overall,
      scoreGrade: report.grade,
      scoreBreakdown: report.breakdown,
      scoreCategories: report.categories,
      scoreStrengths: report.strengths,
      scoreMetrics: report.metrics,
      aiAudit: report.aiAudit,
      aiCoachStatus:
        report.aiAudit && !report.aiAudit.error ? "ready" : "unavailable",
      suggestions: report.suggestions,
      selectedCategoryId: topFix,
      isScoring: false,
      scoringMessage: null,
      scoreError: null,
      lastScoredAt: new Date().toISOString(),
    });
  },
  setSelectedCategoryId: (selectedCategoryId) => set({ selectedCategoryId }),
  setScoring: (isScoring) =>
    set((state) => ({
      isScoring,
      scoringMessage: isScoring ? "Analyzing ATS checks & AI coach…" : null,
      aiCoachStatus: isScoring ? "pending" : state.aiCoachStatus,
    })),
  setScoreError: (scoreError) =>
    set({
      scoreError,
      isScoring: false,
      scoringMessage: null,
      aiCoachStatus: "idle",
    }),
  setJobTitle: (jobTitle) => set({ jobTitle }),
  reset: () => set(initialState),
}));
