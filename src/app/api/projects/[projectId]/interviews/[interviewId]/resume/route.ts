import { NextRequest, NextResponse } from "next/server";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/llm/ai-sdk-provider";
import { buildRecapPrompt } from "@/lib/interview/prompt-builder";
import { generateText } from "ai";

type Params = {
  params: Promise<{ projectId: string; interviewId: string }>;
};

// T026: POST - Resume a STALE interview with AI recap
export async function POST(_request: NextRequest, { params }: Params) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId, interviewId } = await params;

  const interview = await prisma.interviewSession.findUnique({
    where: { id: interviewId },
    include: {
      messages: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!interview || interview.projectId !== projectId) {
    return notFound("Interview");
  }

  if (interview.employeeId !== session.user.id) {
    return forbidden("Only the interview owner can resume it");
  }

  if (interview.status !== "STALE") {
    return NextResponse.json(
      { error: "Interview must be in STALE status to resume" },
      { status: 409 }
    );
  }

  // Transition back to IN_PROGRESS
  await prisma.interviewSession.update({
    where: { id: interviewId },
    data: { status: "IN_PROGRESS" },
  });

  // Generate AI recap message
  try {
    const provider = await getAIProvider();
    const recapPrompt = buildRecapPrompt(
      interview.currentSummaryJson as Record<string, unknown> | null
    );

    const { text } = await generateText({
      model: provider.model,
      prompt: recapPrompt,
    });

    // Persist recap as an assistant message
    const nextOrderIndex = interview.messages.length;
    await prisma.interviewMessage.create({
      data: {
        interviewSessionId: interviewId,
        role: "ASSISTANT",
        content: text,
        orderIndex: nextOrderIndex,
      },
    });
  } catch (e) {
    console.error("[Resume] Recap generation failed:", e);
    // Still resume even if recap fails
  }

  return NextResponse.json({
    interview: {
      id: interviewId,
      status: "IN_PROGRESS",
    },
  });
}
