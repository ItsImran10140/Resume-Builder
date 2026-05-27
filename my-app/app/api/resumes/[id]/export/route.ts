import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getPdfExportQueue, type PdfExportJobData } from "@/lib/queue";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await context.params;
  const resume = await prisma.resume.findFirst({
    where: { id, userId: session!.user.id },
  });

  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { latexSource: string };

  if (!body.latexSource?.trim()) {
    return NextResponse.json(
      { error: "latexSource is required" },
      { status: 400 },
    );
  }

  try {
    const outputKey = `exports/${session!.user.id}/${id}/${Date.now()}.pdf`;
    const queue = getPdfExportQueue();
    const job = await queue.add("export-pdf", {
      resumeId: id,
      userId: session!.user.id,
      latexSource: body.latexSource,
      outputKey,
    } satisfies PdfExportJobData);

    return NextResponse.json({ jobId: job.id, outputKey }, { status: 202 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to enqueue export";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
