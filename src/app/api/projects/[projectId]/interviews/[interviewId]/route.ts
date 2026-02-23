import { NextRequest, NextResponse } from "next/server";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ projectId: string; interviewId: string }> };

// T013: GET - Full interview detail with messages and summary
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId, interviewId } = await params;

  // Check project membership
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });
  if (!membership) return notFound("Project");

  const interview = await prisma.interviewSession.findUnique({
    where: { id: interviewId },
    include: {
      messages: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!interview || interview.projectId !== projectId) {
    return notFound("Interview");
  }

  // Only owner or consultant can view
  if (
    interview.employeeId !== session.user.id &&
    membership.role !== "CONSULTANT"
  ) {
    return forbidden("Not authorized to view this interview");
  }

  return NextResponse.json({
    interview: {
      id: interview.id,
      projectId: interview.projectId,
      processCategory: interview.processCategory,
      title: interview.title,
      status: interview.status,
      currentSummaryJson: interview.currentSummaryJson,
      messages: interview.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    },
  });
}

// T014: DELETE - Discard non-completed interview
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId, interviewId } = await params;

  const interview = await prisma.interviewSession.findUnique({
    where: { id: interviewId },
  });

  if (!interview || interview.projectId !== projectId) {
    return notFound("Interview");
  }

  if (interview.employeeId !== session.user.id) {
    return forbidden("Only the interview owner can discard it");
  }

  if (interview.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Cannot discard a completed interview" },
      { status: 409 }
    );
  }

  // Delete messages first, then the session
  await prisma.interviewMessage.deleteMany({
    where: { interviewSessionId: interviewId },
  });
  await prisma.interviewSession.delete({
    where: { id: interviewId },
  });

  return new NextResponse(null, { status: 204 });
}
