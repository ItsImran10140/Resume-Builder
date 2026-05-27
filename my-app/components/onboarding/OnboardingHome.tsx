"use client";

import { useCallback, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FileUpload,
  getReadableFileSize,
  UploadedFile,
} from "@/components/application/file-upload/file-upload-base";
import { createResume } from "@/lib/resume-api";
import { parseResumeFile, parseResumeText } from "@/lib/resume-parser";
import { saveResumeContent } from "@/lib/resume-storage";

const ACCEPTED_HINT = "PDF, DOCX, TXT, or HTML — up to 10 MB";

type InputMode = "upload" | "paste";

type OnboardingHomeProps = {
  /** When true, only render the upload card (used on authenticated home). */
  embedded?: boolean;
};

export default function OnboardingHome({ embedded = false }: OnboardingHomeProps) {
  const router = useRouter();
  const { status } = useSession();
  const [mode, setMode] = useState<InputMode>("upload");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDropFiles = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;

    setError(null);
    setUploadedFile({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 100,
    });
    setFileObject(file);
  }, []);

  const handleDeleteFile = () => {
    setUploadedFile(null);
    setFileObject(null);
  };

  const canContinue =
    mode === "upload" ? Boolean(fileObject) : pastedText.trim().length > 0;

  const handleContinue = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let html: string;
      let fileName: string | undefined;

      if (mode === "upload" && fileObject) {
        html = await parseResumeFile(fileObject);
        fileName = fileObject.name;
      } else if (mode === "paste") {
        html = parseResumeText(pastedText);
      } else {
        throw new Error("Add your resume to continue.");
      }

      const title = fileName?.replace(/\.[^.]+$/, "") ?? "Untitled resume";

      if (status === "authenticated") {
        const resume = await createResume(title, html, fileName);
        startTransition(() => {
          router.push(`/editor?id=${resume.id}`);
        });
        return;
      }

      saveResumeContent(html, fileName);
      startTransition(() => {
        router.push("/editor");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const card = (
    <div
      className={
        embedded
          ? ""
          : "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/50 sm:p-8"
      }
    >
      {!embedded && (
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Start with your resume
          </h1>
          <p className="mt-3 text-base text-zinc-600">
            Upload a file or paste your content. We&apos;ll open it in the editor
            so you can refine every section.
          </p>
        </div>
      )}

      {embedded && (
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Upload a new resume
        </h2>
      )}

      <div
        className={
          embedded
            ? "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/50 sm:p-8"
            : ""
        }
      >
        <div className="mb-6 flex rounded-lg bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === "upload"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === "paste"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Paste text
          </button>
        </div>

        {mode === "upload" ? (
          <FileUpload.Root>
            <FileUpload.DropZone
              allowsMultiple={false}
              accept=".pdf,.doc,.docx,.txt,.md,.html,.htm"
              hint={ACCEPTED_HINT}
              onDropFiles={handleDropFiles}
              className="[&>div]:border-zinc-300 [&>div]:bg-zinc-50/50 [&>div]:py-10 [&>div]:transition-colors hover:[&>div]:border-indigo-400 hover:[&>div]:bg-indigo-50/30"
            />

            {uploadedFile && (
              <FileUpload.List className="mt-4 space-y-2">
                <li className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900">
                      {uploadedFile.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {getReadableFileSize(uploadedFile.size)} · Ready
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteFile}
                    className="shrink-0 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              </FileUpload.List>
            )}
          </FileUpload.Root>
        ) : (
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your full resume here — experience, education, skills, and contact info."
            rows={12}
            className="w-full resize-y rounded-lg border border-zinc-300 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!canContinue || isLoading || status === "loading"}
          onClick={handleContinue}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Saving to your account…" : "Continue to editor"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-500">
        {status === "authenticated"
          ? "Your resume is saved to your account and opens in the editor."
          : "Sign in when prompted — your resume is saved after you authenticate."}
      </p>
    </div>
  );

  if (embedded) {
    return card;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-zinc-200/80 bg-white/70 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            R
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            Resume Builder
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12">
        {card}
      </main>
    </div>
  );
}
