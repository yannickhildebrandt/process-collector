import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; processId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId, processId } = await params;

  // Check membership
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });

  if (!membership) return notFound("Project");

  const process = await prisma.processEntry.findFirst({
    where: { id: processId, projectId },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      interviewSession: {
        select: { currentSummaryJson: true },
      },
    },
  });

  if (!process) return notFound("Process");

  return NextResponse.json({
    process: {
      id: process.id,
      title: process.title,
      status: process.status,
      markdownContent: process.markdownContent,
      bpmnXml: process.bpmnXml,
      summaryJson: process.interviewSession?.currentSummaryJson ?? null,
      createdBy: {
        id: process.createdBy.id,
        displayName: process.createdBy.name,
      },
      createdAt: process.createdAt.toISOString(),
      updatedAt: process.updatedAt.toISOString(),
    },
  });
}
