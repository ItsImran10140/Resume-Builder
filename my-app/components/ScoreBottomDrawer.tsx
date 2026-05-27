"use client";

import { useResumeStore } from "@/stores/resume-store";
import type { ScoreBreakdownState } from "@/stores/resume-store";

type ScoreBottomDrawerProps = {
  onJobTitleChange: (title: string) => void;
  className?: string;
  showScoreMetaText?: boolean;
};

function scoreLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Fair";
  return "Needs work";
}

function scoreColor(score: number) {
  if (score >= 80) {
    return { stroke: "#059669", text: "text-emerald-600", bg: "bg-emerald-500" };
  }
  if (score >= 60) {
    return { stroke: "#d97706", text: "text-amber-600", bg: "bg-amber-500" };
  }
  return { stroke: "#dc2626", text: "text-red-600", bg: "bg-red-500" };
}

function ScoreRing({
  score,
  isScoring,
  showMetaText,
}: {
  score: number;
  isScoring: boolean;
  showMetaText: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const colors = scoreColor(clamped);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="-rotate-90" width="112" height="112" aria-hidden>
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="9"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold tabular-nums ${colors.text}`}>
            {Math.round(clamped)}
          </span>
          <span className="text-[8px] font-medium uppercase tracking-wide text-zinc-500">
            {scoreLabel(clamped)}
          </span>
          {isScoring && (
            <span className="mt-1 text-[10px] text-indigo-600">Updating…</span>
          )}
        </div>
      </div>
      {showMetaText && (
        <>
          <p className="text-[12px]">ATS Score</p>
          <p className="text-[10px] text-zinc-500">Updates as you edit</p>
        </>
      )}
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  barClass,
}: {
  label: string;
  value: number;
  barClass: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <li>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-600">{label}</span>
        <span className="font-medium tabular-nums text-zinc-900">
          {Math.round(clamped)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </li>
  );
}

function BreakdownBars({ breakdown }: { breakdown: ScoreBreakdownState }) {
  return (
    <ul className="space-y-2.5">
      <BreakdownBar
        label="Keywords"
        value={breakdown.keywords}
        barClass="bg-indigo-500"
      />
      <BreakdownBar
        label="Sections"
        value={breakdown.sections}
        barClass="bg-violet-500"
      />
      <BreakdownBar
        label="Formatting"
        value={breakdown.formatting}
        barClass="bg-sky-500"
      />
      <BreakdownBar label="Length" value={breakdown.length} barClass="bg-teal-500" />
    </ul>
  );
}

function priorityStyles(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return "border-red-200 bg-red-50 text-red-800";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function TargetRoleSection({
  jobTitle,
  onJobTitleChange,
}: {
  jobTitle: string;
  onJobTitleChange: (title: string) => void;
}) {
  return (
    <div className="border-t border-zinc-100 pt-4">
      <label
        htmlFor="target-role-drawer"
        className="mb-1 block text-xs font-medium text-zinc-600"
      >
        Target role (optional)
      </label>
      <input
        id="target-role-drawer"
        type="text"
        value={jobTitle}
        onChange={(e) => onJobTitleChange(e.target.value)}
        placeholder="e.g. Software Engineer"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
      <p className="mt-1 text-[11px] text-zinc-500">
        Tailors keyword scoring to this job title.
      </p>
    </div>
  );
}

export function ScoreBottomDrawer({
  onJobTitleChange,
  className,
  showScoreMetaText = true,
}: ScoreBottomDrawerProps) {
  const atsScore = useResumeStore((s) => s.atsScore);
  const breakdown = useResumeStore((s) => s.scoreBreakdown);
  const suggestions = useResumeStore((s) => s.suggestions);
  const isScoring = useResumeStore((s) => s.isScoring);
  const scoreError = useResumeStore((s) => s.scoreError);
  const jobTitle = useResumeStore((s) => s.jobTitle);
  const lastScoredAt = useResumeStore((s) => s.lastScoredAt);
  const isSaving = useResumeStore((s) => s.isSaving);

  const lastScoredLabel = lastScoredAt
    ? new Date(lastScoredAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <section className={className}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-2">
        {scoreError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            <p>{scoreError}</p>
            <p className="mt-1 text-zinc-600">
              Start the scorer:{" "}
              <code className="text-[11px]">uvicorn app.main:app --port 8000</code>
            </p>
          </div>
        )}

        {atsScore === null && !isScoring && !scoreError ? (
          <>
            <p className="text-sm text-zinc-500">
              {isSaving
                ? "Saving your resume… score will appear shortly."
                : "Your ATS score will appear here once scoring runs."}
            </p>
            <TargetRoleSection
              jobTitle={jobTitle}
              onJobTitleChange={onJobTitleChange}
            />
          </>
        ) : atsScore !== null ? (
          <>
            <div
              className={`grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr] md:items-start`}
            >
              <div className="justify-self-center md:justify-self-start">
                <ScoreRing
                  score={atsScore}
                  isScoring={isScoring}
                  showMetaText={showScoreMetaText}
                />
              </div>
              <div className="space-y-2">
                {lastScoredLabel && (
                  <p className="text-[11px] text-zinc-500">
                    Last scored at {lastScoredLabel}
                  </p>
                )}
                {breakdown && <BreakdownBars breakdown={breakdown} />}
              </div>
            </div>

            {suggestions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Suggested fixes
                </h3>
                <ul className="space-y-2">
                  {suggestions.map((s, i) => (
                    <li
                      key={`${s.type}-${i}`}
                      className={`rounded-md border px-3 py-2 text-xs ${priorityStyles(s.priority)}`}
                    >
                      <span className="font-semibold uppercase tracking-wide">
                        {s.priority}
                      </span>
                      <p className="mt-1 leading-relaxed">{s.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <TargetRoleSection
              jobTitle={jobTitle}
              onJobTitleChange={onJobTitleChange}
            />
          </>
        ) : isScoring ? (
          <>
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-zinc-500">Analyzing resume…</p>
              <p className="text-[10px] text-zinc-500">Updates as you edit</p>
            </div>
            <TargetRoleSection
              jobTitle={jobTitle}
              onJobTitleChange={onJobTitleChange}
            />
          </>
        ) : (
          <TargetRoleSection
            jobTitle={jobTitle}
            onJobTitleChange={onJobTitleChange}
          />
        )}
      </div>
    </section>
  );
}
