"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import throttle from "lodash.throttle";
import { htmlToPlainText } from "@/lib/html-to-plain-text";
import { getStoredJobTitle } from "@/lib/job-title-storage";
import {
  createResume,
  fetchResume,
  resumeToEditorState,
  scoreResume,
  updateResume,
} from "@/lib/resume-api";
import {
  clearResumeContent,
  getResumeContent,
  getResumeFileName,
  getResumeId,
  saveResumeId,
} from "@/lib/resume-storage";
import { storedBreakdownToReport } from "@/lib/scorer-client";
import { useResumeStore } from "@/stores/resume-store";
import type { ScoreSuggestion } from "@/lib/score-types";

const SAVE_MS = 1500;
const SCORE_MS = 2500;

export function useResumeSync(resumeIdFromUrl: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resumeId = useResumeStore((s) => s.resumeId);
  const htmlContent = useResumeStore((s) => s.htmlContent);
  const setResumeId = useResumeStore((s) => s.setResumeId);
  const setTitle = useResumeStore((s) => s.setTitle);
  const setHtmlContent = useResumeStore((s) => s.setHtmlContent);
  const setPlainText = useResumeStore((s) => s.setPlainText);
  const setDirty = useResumeStore((s) => s.setDirty);
  const setSaving = useResumeStore((s) => s.setSaving);
  const setScoring = useResumeStore((s) => s.setScoring);
  const setScoreReport = useResumeStore((s) => s.setScoreReport);
  const setScoreError = useResumeStore((s) => s.setScoreError);
  const setJobTitle = useResumeStore((s) => s.setJobTitle);

  const resumeIdRef = useRef<string | null>(null);
  const fileNameRef = useRef<string | null>(null);
  const htmlRef = useRef("");

  useEffect(() => {
    resumeIdRef.current = resumeId;
  }, [resumeId]);

  useEffect(() => {
    htmlRef.current = htmlContent;
  }, [htmlContent]);

  const syncResumeUrl = useCallback(
    (id: string) => {
      if (resumeIdFromUrl === id) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", id);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, resumeIdFromUrl, router, searchParams],
  );

  const applyLatestScoreFromDb = useCallback(
    (latest: {
      overall: number;
      breakdown: unknown;
      suggestions: unknown;
    } | null) => {
      if (!latest) return false;
      const suggestions = (latest.suggestions as ScoreSuggestion[]) ?? [];
      const report = storedBreakdownToReport(
        latest.overall,
        latest.breakdown,
        suggestions,
      );
      if (!report) return false;
      setScoreReport(report);
      return true;
    },
    [setScoreReport],
  );

  const runScore = useCallback(
    async (id: string, html: string) => {
      const plain = htmlToPlainText(html);
      if (!plain.trim()) return;

      const jobTitle = useResumeStore.getState().jobTitle.trim() || undefined;

      setPlainText(plain);
      setScoring(true);
      setScoreError(null);

      try {
        const result = await scoreResume(id, plain, jobTitle);
        if (result.report) {
          setScoreReport(result.report);
        }
      } catch (err) {
        setScoreError(
          err instanceof Error ? err.message : "Could not score resume",
        );
      }
    },
    [setPlainText, setScoreReport, setScoreError, setScoring],
  );

  const runScoreRef = useRef(runScore);
  runScoreRef.current = runScore;

  const scoreRef = useRef(
    throttle((id: string, html: string) => {
      void runScoreRef.current(id, html);
    }, SCORE_MS),
  );

  const persistRef = useRef(
    throttle(async (id: string, html: string, title: string) => {
      setSaving(true);
      try {
        await updateResume(id, {
          html,
          title,
          fileName: fileNameRef.current ?? undefined,
        });
        setDirty(false);
      } catch (err) {
        setScoreError(
          err instanceof Error ? err.message : "Could not save resume",
        );
      } finally {
        setSaving(false);
      }
    }, SAVE_MS),
  );

  useEffect(() => {
    const throttledSave = persistRef.current;
    const throttledScore = scoreRef.current;
    return () => {
      throttledSave.cancel();
      throttledScore.cancel();
    };
  }, []);

  const bootstrap = useCallback(async () => {
    const urlId = resumeIdFromUrl;
    const storedId = urlId ?? getResumeId();
    const localHtml = getResumeContent();
    const localFileName = getResumeFileName();
    fileNameRef.current = localFileName;
    setJobTitle(getStoredJobTitle());

    try {
      if (storedId) {
        const resume = await fetchResume(storedId);
        const { html, fileName, latestScore } = resumeToEditorState(resume);
        const contentHtml = html || localHtml || "";

        setResumeId(resume.id);
        saveResumeId(resume.id);
        syncResumeUrl(resume.id);
        setTitle(resume.title);
        setHtmlContent(contentHtml);
        setDirty(false);
        htmlRef.current = contentHtml;

        const hasCachedScore = applyLatestScoreFromDb(latestScore);
        if (!hasCachedScore && contentHtml.trim()) {
          await runScore(resume.id, contentHtml);
        }

        clearResumeContent();
        return {
          html: contentHtml,
          fileName: fileName ?? localFileName ?? resume.title,
          title: resume.title,
        };
      }

      if (!localHtml) {
        return null;
      }

      const title = localFileName?.replace(/\.[^.]+$/, "") ?? "Untitled resume";
      const created = await createResume(
        title,
        localHtml,
        localFileName ?? undefined,
      );

      setResumeId(created.id);
      saveResumeId(created.id);
      syncResumeUrl(created.id);
      setTitle(created.title);
      setHtmlContent(localHtml);
      setDirty(false);
      htmlRef.current = localHtml;
      await runScore(created.id, localHtml);
      clearResumeContent();

      return { html: localHtml, fileName: localFileName, title: created.title };
    } catch (err) {
      setScoreError(
        err instanceof Error ? err.message : "Could not load resume",
      );
      if (localHtml) {
        return {
          html: localHtml,
          fileName: localFileName,
          title: localFileName?.replace(/\.[^.]+$/, "") ?? "Untitled resume",
        };
      }
      return null;
    }
  }, [
    applyLatestScoreFromDb,
    resumeIdFromUrl,
    runScore,
    setDirty,
    setHtmlContent,
    setJobTitle,
    setResumeId,
    setScoreError,
    setTitle,
    syncResumeUrl,
  ]);

  const onEditorUpdate = useCallback(
    (html: string) => {
      htmlRef.current = html;
      setHtmlContent(html);
      const id = resumeIdRef.current;
      if (!id) return;
      const title = useResumeStore.getState().title;
      persistRef.current(id, html, title);
      scoreRef.current(id, html);
    },
    [setHtmlContent],
  );

  const titlePersistRef = useRef(
    throttle(async (id: string, title: string) => {
      setSaving(true);
      try {
        await updateResume(id, { title });
        setDirty(false);
      } catch (err) {
        setScoreError(
          err instanceof Error ? err.message : "Could not update title",
        );
      } finally {
        setSaving(false);
      }
    }, SAVE_MS),
  );

  useEffect(() => {
    const throttledTitle = titlePersistRef.current;
    return () => {
      throttledTitle.cancel();
    };
  }, []);

  const updateTitle = useCallback(
    (title: string) => {
      setTitle(title);
      const id = resumeIdRef.current;
      if (!id) return;
      titlePersistRef.current(id, title);
    },
    [setTitle],
  );

  const rescore = useCallback(() => {
    const id = resumeIdRef.current;
    const html = htmlRef.current;
    if (!id || !html.trim()) return;
    if (useResumeStore.getState().isScoring) return;
    scoreRef.current.cancel();
    void runScore(id, html);
  }, [runScore]);

  return {
    bootstrap,
    onEditorUpdate,
    updateTitle,
    rescore,
    runScore,
  };
}
