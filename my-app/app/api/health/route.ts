import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const checks = {
    database: false,
    scorer: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const scorerUrl = process.env.SCORER_API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${scorerUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    checks.scorer = res.ok;
  } catch {
    checks.scorer = false;
  }

  const ok = checks.database && checks.scorer;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks,
      scorerUrl,
    },
    { status: ok ? 200 : 503 },
  );
}
