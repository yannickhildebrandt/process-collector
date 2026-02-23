import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId } = await params;

  // Check membership
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });

  if (!membership) return notFound("Project");

  const processes = await prisma.processEntry.findMany({
    where: { projectId },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    processes: processes.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      createdBy: {
        id: p.createdBy.id,
        displayName: p.createdBy.name,
      },
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
