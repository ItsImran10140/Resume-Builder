"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useResumeStore } from "@/stores/resume-store";
import type { ScoreCategory } from "@/lib/score-types";

const AI_COACH_HEIGHT_KEY = "resume-builder:ai-coach-height";
const AI_COACH_MIN_HEIGHT = 72;
const AI_COACH_MAX_HEIGHT = 320;
const AI_COACH_DEFAULT_HEIGHT = 128;

type AtsScorePanelProps = {
  compact?: boolean;
};

function scoreColor(score: number) {
  if (score >= 80) return { stroke: "#059669", text: "text-emerald-600" };
  if (score >= 60) return { stroke: "#d97706", text: "text-amber-600" };
  return { stroke: "#dc2626", text: "text-red-600" };
}

function ScoreRing({
  score,
  isScoring,
  size = "md",
}: {
  score: number;
  isScoring: boolean;
  size?: "sm" | "md";
}) {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = size === "sm" ? 32 : 40;
  const dim = size === "sm" ? 88 : 112;
  const cx = dim / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const colors = scoreColor(clamped);

  return (
    <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg className="-rotate-90" width={dim} height={dim} aria-hidden>
        <circle cx={cx} cy={cx} r={radius} fill="none" stroke="#e4e4e7" strokeWidth="8" />
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold tabular-nums ${colors.text} ${size === "sm" ? "text-xl" : "text-2xl"}`}>
          {Math.round(clamped)}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">Overall</span>
        {isScoring && <span className="mt-0.5 text-[9px] text-indigo-600">Updating…</span>}
      </div>
    </div>
  );
}

function QuantifyBar({
  quantified,
  total,
}: {
  quantified: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((quantified / total) * 100) : 0;
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[11px] text-zinc-600">
        <span>Bullets with metrics</span>
        <span className="font-medium text-zinc-900">
          {quantified} of {total} ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gradient-to-r from-red-200 via-amber-200 to-emerald-300">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {total > quantified && (
        <p className="mt-1.5 text-[11px] text-zinc-600">
          Add numbers (% , $, users, latency) to{" "}
          <strong>{total - quantified}</strong> more bullet
          {total - quantified === 1 ? "" : "s"} for a stronger impact score.
        </p>
      )}
    </div>
  );
}

function CategoryDetail({ category, metrics }: { category: ScoreCategory; metrics: { total_bullets: number; quantified_bullets: number } | null }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{category.label}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">{category.description}</p>
        </div>
        <div className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-800">
          {Math.round(category.score)}
        </div>
      </div>

      {category.id === "quantification" && metrics && (
        <QuantifyBar quantified={metrics.quantified_bullets} total={metrics.total_bullets} />
      )}

      {category.issue_count === 0 ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          No issues found in this area — nice work.
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {category.issues.map((issue, i) => (
            <li
              key={`${category.id}-issue-${i}`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs shadow-sm"
            >
              <p className="font-medium text-zinc-900">{issue.message}</p>
              {issue.fix && (
                <p className="mt-1.5 leading-relaxed text-zinc-600">
                  <span className="font-medium text-indigo-700">How to fix: </span>
                  {issue.fix}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScoringOverlay({ message }: { message: string }) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/95 px-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
      <p className="text-center text-sm font-medium text-zinc-900">{message}</p>
      <p className="max-w-[220px] text-center text-xs leading-relaxed text-zinc-500">
        Running ATS checks, then asking the AI coach for rewrite tips. This usually takes
        15–30 seconds.
      </p>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-indigo-700">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-600" />
        AI coach in progress…
      </div>
    </div>
  );
}

function AiCoachLoading() {
  return (
    <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="text-[11px] font-semibold text-indigo-800">AI coach</p>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 animate-pulse rounded bg-indigo-100" />
        <div className="h-2 w-4/5 animate-pulse rounded bg-indigo-100" />
      </div>
    </div>
  );
}

function AiCoachStatus() {
  const aiCoachStatus = useResumeStore((s) => s.aiCoachStatus);
  const isScoring = useResumeStore((s) => s.isScoring);

  if (isScoring || aiCoachStatus === "ready" || aiCoachStatus === "idle") {
    return null;
  }

  return (
    <p className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[11px] text-zinc-600">
      AI coach did not return tips this time. Check{" "}
      <code className="text-[10px]">OPENROUTER_API_KEY</code> in backend/.env and try
      Re-score again.
    </p>
  );
}

function ResizableAiCoachPanel() {
  const [height, setHeight] = useState(AI_COACH_DEFAULT_HEIGHT);
  const [collapsed, setCollapsed] = useState(false);
  const heightRef = useRef(AI_COACH_DEFAULT_HEIGHT);

  useEffect(() => {
    const stored = sessionStorage.getItem(AI_COACH_HEIGHT_KEY);
    if (!stored) return;
    const parsed = Number.parseInt(stored, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(AI_COACH_MAX_HEIGHT, Math.max(AI_COACH_MIN_HEIGHT, parsed));
      heightRef.current = clamped;
      setHeight(clamped);
    }
  }, []);

  const persistHeight = useCallback((next: number) => {
    const clamped = Math.min(AI_COACH_MAX_HEIGHT, Math.max(AI_COACH_MIN_HEIGHT, next));
    heightRef.current = clamped;
    setHeight(clamped);
    sessionStorage.setItem(AI_COACH_HEIGHT_KEY, String(clamped));
  }, []);

  const handleResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = heightRef.current;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const delta = startY - moveEvent.clientY;
        persistHeight(startHeight + delta);
      };

      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [persistHeight],
  );

  return (
    <div className="flex shrink-0 flex-col border-t border-zinc-200 bg-zinc-50/80">
      <div className="flex items-center justify-between gap-2 px-1 py-0.5">
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize AI coach panel"
          onPointerDown={handleResizeStart}
          className="flex h-3 flex-1 cursor-ns-resize items-center justify-center rounded hover:bg-zinc-200/80"
        >
          <span className="h-0.5 w-8 rounded-full bg-zinc-300" />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200"
          aria-expanded={!collapsed}
        >
          {collapsed ? "Show AI" : "Hide"}
        </button>
      </div>
      {!collapsed && (
        <div
          className="overflow-y-auto px-1 pb-1"
          style={{ height }}
        >
          <AiSection />
        </div>
      )}
    </div>
  );
}

function AiSection() {
  const aiAudit = useResumeStore((s) => s.aiAudit);
  const aiCoachStatus = useResumeStore((s) => s.aiCoachStatus);
  const isScoring = useResumeStore((s) => s.isScoring);

  if (isScoring || aiCoachStatus === "pending") {
    return <AiCoachLoading />;
  }

  if (!aiAudit || aiAudit.error) {
    return <AiCoachStatus />;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
        AI coach
      </h4>
      {aiAudit.top_fix && (
        <p className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs leading-relaxed text-indigo-950">
          <span className="font-semibold">Top priority: </span>
          {aiAudit.top_fix}
        </p>
      )}
      {aiAudit.rewrites?.map((rw, i) => (
        <div key={`rw-${i}`} className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs">
          <p className="text-zinc-500 line-through">{rw.original}</p>
          <p className="mt-1 font-medium text-zinc-900">{rw.improved}</p>
          {rw.why && <p className="mt-1 text-zinc-600">{rw.why}</p>}
        </div>
      ))}
      {aiAudit.missing_angle && (
        <p className="text-[11px] text-zinc-600">
          <span className="font-medium">Missing angle: </span>
          {aiAudit.missing_angle}
        </p>
      )}
    </div>
  );
}

export function AtsScorePanel({ compact = false }: AtsScorePanelProps) {
  const atsScore = useResumeStore((s) => s.atsScore);
  const scoreGrade = useResumeStore((s) => s.scoreGrade);
  const categories = useResumeStore((s) => s.scoreCategories);
  const strengths = useResumeStore((s) => s.scoreStrengths);
  const metrics = useResumeStore((s) => s.scoreMetrics);
  const selectedCategoryId = useResumeStore((s) => s.selectedCategoryId);
  const setSelectedCategoryId = useResumeStore((s) => s.setSelectedCategoryId);
  const isScoring = useResumeStore((s) => s.isScoring);
  const scoringMessage = useResumeStore((s) => s.scoringMessage);
  const aiCoachStatus = useResumeStore((s) => s.aiCoachStatus);
  const scoreError = useResumeStore((s) => s.scoreError);
  const lastScoredAt = useResumeStore((s) => s.lastScoredAt);
  const isSaving = useResumeStore((s) => s.isSaving);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? categories[0] ?? null,
    [categories, selectedCategoryId],
  );

  const topFixes = useMemo(
    () => categories.filter((c) => c.issue_count > 0).sort((a, b) => b.issue_count - a.issue_count),
    [categories],
  );

  const lastScoredLabel = lastScoredAt
    ? new Date(lastScoredAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  if (scoreError) {
    return (
      <div className="p-3">
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          <p>{scoreError}</p>
          <p className="mt-1 text-zinc-600">
            Start the scorer:{" "}
            <code className="text-[11px]">uvicorn app.main:app --port 8000</code>
          </p>
        </div>
      </div>
    );
  }

  if (atsScore === null && !isScoring) {
    return (
      <div className="p-3">
        <p className="text-sm text-zinc-500">
          {isSaving
            ? "Saving your resume… score will appear shortly."
            : "Your ATS score will appear here once scoring runs."}
        </p>
      </div>
    );
  }

  if (isScoring && atsScore === null) {
    return (
      <div className="relative flex min-h-[140px] flex-col items-center justify-center gap-2 p-4">
        <ScoringOverlay message={scoringMessage ?? "Analyzing your resume…"} />
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-0 flex-col ${compact ? "h-full gap-2 p-2" : "gap-3 p-3"} ${isScoring ? "min-h-[160px]" : ""}`}
    >
      {isScoring && (
        <ScoringOverlay message={scoringMessage ?? "Re-scoring your resume…"} />
      )}
      <div className="flex shrink-0 items-start gap-3 border-b border-zinc-100 pb-3">
        {atsScore !== null && <ScoreRing score={atsScore} isScoring={isScoring} size={compact ? "sm" : "md"} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">
            Your resume scored {atsScore} out of 100
          </p>
          {scoreGrade && (
            <p className="text-xs text-zinc-600">
              Grade: <span className="font-medium">{scoreGrade}</span>
              {lastScoredLabel && ` · Last scored ${lastScoredLabel}`}
              {aiCoachStatus === "ready" && (
                <span className="text-emerald-700"> · AI tips ready</span>
              )}
            </p>
          )}
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Select a category below to see what to fix. Scores update as you edit; use{" "}
            <span className="font-medium text-zinc-700">Re-score</span> in the toolbar after
            major changes.
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
          <nav className="flex w-[130px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-zinc-100 pr-2">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Top fixes
            </p>
            {topFixes.length === 0 ? (
              <p className="px-1 text-[11px] text-zinc-500">No critical issues</p>
            ) : (
              topFixes.map((cat) => (
                <CategoryNavButton
                  key={cat.id}
                  category={cat}
                  isActive={selectedCategory?.id === cat.id}
                  onSelect={() => setSelectedCategoryId(cat.id)}
                />
              ))
            )}
            <p className="mb-1 mt-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              All checks
            </p>
            {categories.map((cat) => (
              <CategoryNavButton
                key={`all-${cat.id}`}
                category={cat}
                isActive={selectedCategory?.id === cat.id}
                onSelect={() => setSelectedCategoryId(cat.id)}
                muted={cat.issue_count === 0}
              />
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {selectedCategory ? (
              <CategoryDetail category={selectedCategory} metrics={metrics} />
            ) : (
              <p className="text-sm text-zinc-500">Select a category to view details.</p>
            )}
          </div>

          {!compact && (
            <div className="hidden max-h-full min-h-0 w-[200px] shrink-0 overflow-y-auto border-l border-zinc-100 pl-3 xl:block">
              <AiSection />
              {strengths.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    What you did well
                  </h4>
                  <ul className="space-y-1.5">
                    {strengths.slice(0, 4).map((s, i) => (
                      <li
                        key={`str-${i}`}
                        className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-900"
                      >
                        {s.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {compact && <ResizableAiCoachPanel />}
      </div>
    </div>
  );
}

function CategoryNavButton({
  category,
  isActive,
  onSelect,
  muted = false,
}: {
  category: ScoreCategory;
  isActive: boolean;
  onSelect: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] transition",
        isActive
          ? "bg-indigo-50 font-medium text-indigo-900"
          : muted
            ? "text-zinc-400 hover:bg-zinc-50"
            : "text-zinc-700 hover:bg-zinc-50",
      ].join(" ")}
    >
      <span className="truncate">{category.label}</span>
      {category.issue_count > 0 ? (
        <span className="ml-1 shrink-0 rounded-full bg-red-100 px-1.5 text-[10px] font-semibold text-red-700">
          {category.issue_count}
        </span>
      ) : (
        <span className="ml-1 shrink-0 text-[10px] text-zinc-400">{Math.round(category.score)}</span>
      )}
    </button>
  );
}
