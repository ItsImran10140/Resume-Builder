import { create } from "zustand";
import type { ScoreSuggestion } from "@/lib/scorer-client";

export type ScoreBreakdownState = {
  keywords: number;
  sections: number;
  formatting: number;
  length: number;
};

type ResumeEditorState = {
  resumeId: string | null;
  title: string;
  htmlContent: string;
  plainText: string;
  isDirty: boolean;
  isSaving: boolean;
  atsScore: number | null;
  scoreBreakdown: ScoreBreakdownState | null;
  suggestions: ScoreSuggestion[];
  isScoring: boolean;
  scoreError: string | null;
  jobTitle: string;
  lastScoredAt: string | null;
  setResumeId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setHtmlContent: (html: string) => void;
  setPlainText: (text: string) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setScore: (
    overall: number,
    breakdown: ScoreBreakdownState,
    suggestions: ScoreSuggestion[],
  ) => void;
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
  scoreBreakdown: null,
  suggestions: [] as ScoreSuggestion[],
  isScoring: false,
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
  setScore: (atsScore, scoreBreakdown, suggestions) =>
    set({
      atsScore,
      scoreBreakdown,
      suggestions,
      isScoring: false,
      scoreError: null,
      lastScoredAt: new Date().toISOString(),
    }),
  setScoring: (isScoring) => set({ isScoring }),
  setScoreError: (scoreError) =>
    set({ scoreError, isScoring: false }),
  setJobTitle: (jobTitle) => set({ jobTitle }),
  reset: () => set(initialState),
}));
