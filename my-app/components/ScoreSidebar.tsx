"use client";

import { AtsScorePanel } from "@/components/AtsScorePanel";

export function ScoreSidebar() {
  return (
    <aside className="flex h-full w-[min(100%,28rem)] shrink-0 flex-col border-l border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">ATS score</h2>
        <p className="text-xs text-zinc-500">Detailed review · updates as you edit</p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <AtsScorePanel />
      </div>
    </aside>
  );
}
