import { NextRequest, NextResponse } from "next/server";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/llm/ai-sdk-provider";
import { extractSummary } from "@/lib/interview/summary-extractor";
import type { ProcessSummary } from "@/lib/interview/schemas";
import type { ModelMessage } from "ai";

type Params = {
  params: Promise<{ projectId: string; interviewId: string }>;
};

// T016: POST - Transition interview to SUMMARY_REVIEW, generate final summary
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
    return forbidden("Only the interview owner can request a summary");
  }

  if (interview.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Interview must be in IN_PROGRESS status" },
      { status: 409 }
    );
  }

  if (interview.messages.length === 0) {
    return NextResponse.json(
      { error: "No messages to summarize. Please chat with the AI first." },
      { status: 400 }
    );
  }

  // Generate final summary from conversation history
  const messages: ModelMessage[] = interview.messages.map((m) => ({
    role: m.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  let finalSummary: ProcessSummary;
  try {
    const provider = await getAIProvider();
    const existingSummary =
      (interview.currentSummaryJson as ProcessSummary | null) ?? null;
    finalSummary = await extractSummary(provider, messages, existingSummary);
  } catch (e) {
    console.error("[RequestSummary] Summary extraction failed:", e);
    // Fall back to existing summary if available
    if (interview.currentSummaryJson) {
      finalSummary = interview.currentSummaryJson as unknown as ProcessSummary;
    } else {
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      );
    }
  }

  const updated = await prisma.interviewSession.update({
    where: { id: interviewId },
    data: {
      status: "SUMMARY_REVIEW",
      currentSummaryJson: finalSummary as object,
    },
  });

  return NextResponse.json({
    interview: {
      id: updated.id,
      status: updated.status,
      currentSummaryJson: updated.currentSummaryJson,
    },
  });
}
