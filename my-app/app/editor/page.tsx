import { Suspense } from "react";
import MainPage from "@/components/MainPage";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
          Loading editor…
        </div>
      }
    >
      <MainPage />
    </Suspense>
  );
}
