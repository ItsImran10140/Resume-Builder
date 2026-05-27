import { Suspense } from "react";
import HomePage from "@/components/home/HomePage";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
          Loading…
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}
