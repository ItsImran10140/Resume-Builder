"use client";

import { useCallback, useEffect, useState } from "react";

type HealthResponse = {
  status: "ok" | "degraded";
  checks: { database: boolean; scorer: boolean };
};

export function ServiceStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = (await res.json()) as HealthResponse;
      setHealth(data);
    } catch {
      setHealth({
        status: "degraded",
        checks: { database: false, scorer: false },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [poll]);

  if (loading) {
    return <span className="text-[11px] text-zinc-400">…</span>;
  }

  const ok = health?.status === "ok";
  const db = health?.checks.database;
  const scorer = health?.checks.scorer;

  return (
    <div
      className="flex items-center gap-2 text-[11px]"
      title={
        ok
          ? "Database and scorer are connected"
          : `DB: ${db ? "ok" : "down"} · Scorer: ${scorer ? "ok" : "down"}`
      }
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          ok ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      <span className={ok ? "text-zinc-500" : "text-amber-700"}>
        {ok ? "All services online" : "Service issue"}
      </span>
    </div>
  );
}
