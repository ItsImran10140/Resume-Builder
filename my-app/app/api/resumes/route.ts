import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const resumes = await prisma.resume.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      scores: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { overall: true, createdAt: true },
      },
    },
  });

  return NextResponse.json(resumes);
}

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = (await request.json()) as {
    title?: string;
    content?: unknown;
  };

  const resume = await prisma.resume.create({
    data: {
      userId: session!.user.id,
      title: body.title ?? "Untitled resume",
      content: body.content ?? { type: "doc", content: [] },
    },
  });

  return NextResponse.json(resume, { status: 201 });
}
