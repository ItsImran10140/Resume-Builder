"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listResumes, type ResumeListItem } from "@/lib/resume-api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ResumeList() {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResumes();
      setResumes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load resumes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">Loading your saved resumes…</p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (resumes.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No saved resumes yet. Upload one below to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
      {resumes.map((resume) => {
        const latestScore = resume.scores[0]?.overall;
        return (
          <li key={resume.id}>
            <Link
              href={`/editor?id=${resume.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900">
                  {resume.title}
                </p>
                <p className="text-xs text-zinc-500">
                  Updated {formatDate(resume.updatedAt)}
                </p>
              </div>
              {latestScore != null && (
                <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  ATS {Math.round(latestScore)}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
