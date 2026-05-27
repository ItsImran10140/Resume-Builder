"use client";

import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Editor from "./Editor";
import { PageSettingsMenu } from "./PageSettingsMenu";
import { ResumePreview } from "./ResumePreview";
import { ScoreBottomDrawer } from "./ScoreBottomDrawer";
import { ScoreSidebar } from "./ScoreSidebar";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useResumeSync } from "@/hooks/use-resume-sync";
import {
  DEFAULT_PAGE_PADDING,
  getResumePagePadding,
  saveResumePagePadding,
  type PagePadding,
} from "@/lib/page-padding";
import {
  DEFAULT_PAGE_SIZE_ID,
  getPageSize,
  getResumePageSizeId,
  saveResumePageSizeId,
  type PageSizeId,
} from "@/lib/page-size";
import { stripDefaultBlockSpacingFromHtml } from "@/lib/resume-html";
import { useResumeStore } from "@/stores/resume-store";
import "./MainPage.scss";

type LoadState = "loading" | "ready" | "missing" | "error";
type ScoreLayoutVariant = "drawer" | "sidebar";

const SCORE_LAYOUT_VARIANT: ScoreLayoutVariant = "drawer";

function MainPageInner() {
  const searchParams = useSearchParams();
  const resumeIdFromUrl = searchParams.get("id");

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [resumeHtml, setResumeHtml] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pagePadding, setPagePadding] =
    useState<PagePadding>(DEFAULT_PAGE_PADDING);
  const [pageSizeId, setPageSizeId] = useState<PageSizeId>(DEFAULT_PAGE_SIZE_ID);
  const [pageCount, setPageCount] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const defaultDrawerHeight = 180;
  const [drawerHeight, setDrawerHeight] = useState(defaultDrawerHeight);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [isDrawerFullscreen, setIsDrawerFullscreen] = useState(false);

  const isSaving = useResumeStore((s) => s.isSaving);
  const isScoring = useResumeStore((s) => s.isScoring);
  const resumeTitle = useResumeStore((s) => s.title);
  const {
    bootstrap,
    onEditorUpdate,
    updateTitle,
    updateJobTitle,
    rescore,
  } = useResumeSync(resumeIdFromUrl);

  const pageSize = getPageSize(pageSizeId);
  const minDrawerHeight = 180;
  const maxDrawerHeight = 520;

  const handlePagePaddingChange = useCallback((next: PagePadding) => {
    setPagePadding(next);
    saveResumePagePadding(next);
  }, []);

  const handlePageSizeChange = useCallback((next: PageSizeId) => {
    setPageSizeId(next);
    saveResumePageSizeId(next);
  }, []);

  const handleDrawerResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isDrawerCollapsed || isDrawerFullscreen) return;
      const pointerStartY = event.clientY;
      const startHeight = drawerHeight;
      event.currentTarget.setPointerCapture(event.pointerId);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaY = pointerStartY - moveEvent.clientY;
        const nextHeight = Math.min(
          maxDrawerHeight,
          Math.max(minDrawerHeight, startHeight + deltaY),
        );
        setIsDrawerFullscreen(false);
        setDrawerHeight(nextHeight);
      };

      const stop = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", stop);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", stop, { once: true });
    },
    [drawerHeight, isDrawerCollapsed, isDrawerFullscreen, maxDrawerHeight, minDrawerHeight],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await bootstrap();
      if (cancelled) return;

      if (!result?.html) {
        setLoadState("missing");
        return;
      }

      const cleaned = stripDefaultBlockSpacingFromHtml(result.html);
      setResumeHtml(cleaned);
      setPreviewHtml(cleaned);
      setFileName(result.fileName);
      setPagePadding(getResumePagePadding());
      setPageSizeId(getResumePageSizeId());
      setLoadState("ready");
    })().catch((err) => {
      if (cancelled) return;
      setLoadError(err instanceof Error ? err.message : "Failed to load");
      setLoadState("error");
    });

    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  useEffect(() => {
    if (loadState !== "missing") return;
    window.location.replace("/");
  }, [loadState]);

  useEffect(() => {
    return () => {
      useResumeStore.getState().reset();
    };
  }, []);

  const handleEditorUpdate = useCallback(
    (html: string) => {
      const cleaned = stripDefaultBlockSpacingFromHtml(html);
      setPreviewHtml(cleaned);
      onEditorUpdate(cleaned);
    },
    [onEditorUpdate],
  );

  if (loadState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Loading your resume…
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center text-sm text-zinc-600">
        <p className="text-red-600">{loadError}</p>
        <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-700">
          Back to upload
        </Link>
      </div>
    );
  }

  if (loadState === "missing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
        Redirecting…
      </div>
    );
  }

  if (!resumeHtml) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 text-sm text-zinc-600">
        <p>No resume loaded.</p>
        <Link
          href="/"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          Upload a resume
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-50">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back
          </Link>
          <input
            type="text"
            value={resumeTitle}
            onChange={(e) => updateTitle(e.target.value)}
            className="min-w-0 max-w-md truncate rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-zinc-900 hover:border-zinc-200 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            aria-label="Resume title"
          />
          {fileName && (
            <span className="hidden truncate text-xs text-zinc-500 sm:inline">
              {fileName}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {isSaving && <span>Saving…</span>}
            {isScoring && <span className="text-indigo-600">Scoring…</span>}
          </div>
          <PageSettingsMenu
            pageSizeId={pageSizeId}
            pageCount={pageCount}
            padding={pagePadding}
            onPageSizeChange={handlePageSizeChange}
            onPaddingChange={handlePagePaddingChange}
          />
          <button
            type="button"
            onClick={rescore}
            disabled={isScoring}
            className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            Re-score
          </button>
          <SignOutButton />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 border-t border-zinc-200">
        <div className="resume-editor-pane flex min-h-0 w-1/2 flex-col overflow-hidden border-r border-zinc-200 bg-white [&_.simple-editor-wrapper]:h-full [&_.tiptap.ProseMirror]:!font-[Georgia,'Times_New_Roman',Times,serif]">
          <Editor initialContent={resumeHtml} onUpdate={handleEditorUpdate} />
        </div>
        <div className="preview-pane flex min-h-0 w-1/2 flex-col overflow-hidden">
          {!isDrawerFullscreen && (
            <ResumePreview
              html={previewHtml}
              padding={pagePadding}
              pageSize={pageSize}
              onPageCountChange={setPageCount}
            />
          )}
          {SCORE_LAYOUT_VARIANT === "drawer" && (
            <>
              {!isDrawerFullscreen && (
                <div className="score-drawer-toggle-anchor">
                  <div className="score-drawer-toggle-stack">
                    <button
                      type="button"
                      className="score-drawer-toggle-btn"
                      onClick={() => {
                        if (isDrawerCollapsed) {
                          setDrawerHeight(defaultDrawerHeight);
                          setIsDrawerCollapsed(false);
                          return;
                        }
                        setIsDrawerCollapsed(true);
                        setIsDrawerFullscreen(false);
                      }}
                      aria-label={
                        isDrawerCollapsed
                          ? "Expand ATS score drawer"
                          : "Collapse ATS score drawer"
                      }
                      title={isDrawerCollapsed ? "Expand" : "Collapse"}
                    >
                      {isDrawerCollapsed ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path
                            d="M2.5 7.5L6 4L9.5 7.5"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path
                            d="M2.5 4.5L6 8L9.5 4.5"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      className="score-drawer-toggle-btn"
                      onClick={() => {
                        if (isDrawerFullscreen) {
                          setIsDrawerFullscreen(false);
                          setDrawerHeight(defaultDrawerHeight);
                          setIsDrawerCollapsed(false);
                          return;
                        }
                        setIsDrawerCollapsed(false);
                        setIsDrawerFullscreen(true);
                      }}
                      aria-label={
                        isDrawerFullscreen
                          ? "Restore drawer height"
                          : "Expand drawer to full height"
                      }
                      title={isDrawerFullscreen ? "Restore size" : "Full height"}
                    >
                      {isDrawerFullscreen ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path
                            d="M4 2.5H2.5V4M8 2.5H9.5V4M4 9.5H2.5V8M8 9.5H9.5V8"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path
                            d="M2.5 5V2.5H5M7 2.5H9.5V5M2.5 7V9.5H5M7 9.5H9.5V7"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {!isDrawerCollapsed && (
                <>
                  {!isDrawerFullscreen && (
                    <div
                      className="score-drawer-resize-handle"
                      onPointerDown={handleDrawerResizeStart}
                      role="separator"
                      aria-label="Resize ATS score drawer"
                      aria-orientation="horizontal"
                    />
                  )}
                  <div
                    className={isDrawerFullscreen ? "score-drawer-fullscreen" : undefined}
                    style={!isDrawerFullscreen ? { height: drawerHeight } : undefined}
                  >
                    {isDrawerFullscreen && (
                      <div className="score-drawer-fullscreen-nav">
                        <div className="score-drawer-fullscreen-nav-controls">
                          <button
                            type="button"
                            className="score-drawer-toggle-btn"
                            onClick={() => {
                              setIsDrawerCollapsed(true);
                              setIsDrawerFullscreen(false);
                            }}
                            aria-label="Collapse ATS score drawer"
                            title="Collapse"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                              <path
                                d="M2.5 4.5L6 8L9.5 4.5"
                                stroke="currentColor"
                                strokeWidth="1.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="score-drawer-toggle-btn"
                            onClick={() => {
                              setIsDrawerFullscreen(false);
                              setDrawerHeight(defaultDrawerHeight);
                              setIsDrawerCollapsed(false);
                            }}
                            aria-label="Restore drawer height"
                            title="Restore size"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                              <path
                                d="M4 2.5H2.5V4M8 2.5H9.5V4M4 9.5H2.5V8M8 9.5H9.5V8"
                                stroke="currentColor"
                                strokeWidth="1.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="score-drawer-fullscreen-nav-title">
                          <p>ATS Score</p>
                          <p>Updates as you edit</p>
                        </div>
                      </div>
                    )}
                    <ScoreBottomDrawer
                      className="score-bottom-drawer bg-white"
                      onJobTitleChange={updateJobTitle}
                      showScoreMetaText={!isDrawerFullscreen}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {SCORE_LAYOUT_VARIANT === "sidebar" && (
          <ScoreSidebar onRescore={rescore} onJobTitleChange={updateJobTitle} />
        )}
      </div>
    </div>
  );
}

export default function MainPage() {
  return <MainPageInner />;
}
