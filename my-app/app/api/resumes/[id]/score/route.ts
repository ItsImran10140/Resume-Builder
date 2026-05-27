import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { scoreResume } from "@/lib/scorer-client";

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

  const body = (await request.json()) as {
    plainText: string;
    jobTitle?: string;
    targetKeywords?: string[];
  };

  if (!body.plainText?.trim()) {
    return NextResponse.json(
      { error: "plainText is required" },
      { status: 400 },
    );
  }

  try {
    const result = await scoreResume(
      body.plainText,
      body.jobTitle,
      body.targetKeywords,
    );

    const saved = await prisma.score.create({
      data: {
        resumeId: id,
        overall: result.overall,
        breakdown: result.breakdown,
        suggestions: result.suggestions,
        jobTitle: body.jobTitle,
      },
    });

    return NextResponse.json({
      score: saved,
      extracted_sections: result.extracted_sections,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
