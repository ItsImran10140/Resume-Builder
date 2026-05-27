import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedResume(id: string, userId: string) {
  return prisma.resume.findFirst({
    where: { id, userId },
    include: {
      scores: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await context.params;
  const resume = await getOwnedResume(id, session!.user.id);

  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(resume);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await context.params;
  const existing = await getOwnedResume(id, session!.user.id);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    title?: string;
    content?: Prisma.InputJsonValue;
    fileKey?: string;
  };

  const data: Prisma.ResumeUpdateInput = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.content !== undefined) data.content = body.content;
  if (body.fileKey !== undefined) data.fileKey = body.fileKey;

  const resume = await prisma.resume.update({
    where: { id },
    data,
  });

  return NextResponse.json(resume);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await context.params;
  const existing = await getOwnedResume(id, session!.user.id);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.resume.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
