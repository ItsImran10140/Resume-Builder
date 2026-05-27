"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import OnboardingHome from "@/components/onboarding/OnboardingHome";
import { ResumeList } from "@/components/resumes/ResumeList";

export default function HomePage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-zinc-200/80 bg-white/70 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              R
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              Resume Builder
            </span>
          </div>
          {isAuthenticated ? (
            <Link
              href="/editor"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Editor
            </Link>
          ) : status !== "loading" ? (
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {isAuthenticated && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Your resumes
            </h2>
            <ResumeList />
          </section>
        )}

        <OnboardingHome embedded={isAuthenticated} />
      </main>
    </div>
  );
}
