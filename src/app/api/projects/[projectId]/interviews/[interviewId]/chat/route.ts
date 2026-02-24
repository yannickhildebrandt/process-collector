import { NextRequest, NextResponse } from "next/server";
import { streamText, type ModelMessage } from "ai";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/llm/ai-sdk-provider";
import { buildSystemPrompt } from "@/lib/interview/prompt-builder";
import { sanitizeUserMessage } from "@/lib/interview/pii-middleware";
import { extractSummary } from "@/lib/interview/summary-extractor";
import { emitSummaryUpdate } from "@/lib/interview/summary-events";
import type { ProcessSummary } from "@/lib/interview/schemas";

type Params = {
  params: Promise<{ projectId: string; interviewId: string }>;
};

/**
 * Extract text content from a Vercel AI SDK message.
 * Messages can have either a `content` string or a `parts` array.
 */
function extractTextFromMessage(msg: Record<string, unknown>): string {
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter(
        (p: { type?: string }) => p.type === "text" || p.type === undefined
      )
      .map((p: { text?: string; content?: string }) => p.text || p.content || "")
      .join("");
  }
  return "";
}

// T015: POST - Streaming chat endpoint
// Compatible with Vercel AI SDK useChat / DefaultChatTransport protocol
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId, interviewId } = await params;

  const interview = await prisma.interviewSession.findUnique({
    where: { id: interviewId },
    include: {
      messages: { orderBy: { orderIndex: "asc" } },
      project: {
        include: { configuration: true },
      },
    },
  });

  if (!interview || interview.projectId !== projectId) {
    return notFound("Interview");
  }

  if (interview.employeeId !== session.user.id) {
    return forbidden("Only the interview owner can send messages");
  }

  if (
    interview.status !== "IN_PROGRESS" &&
    interview.status !== "SUMMARY_REVIEW"
  ) {
    return NextResponse.json(
      { error: "Interview is not in a valid status for chat" },
      { status: 409 }
    );
  }

  const body = await request.json();

  // Vercel AI SDK sends { messages: [...] } via DefaultChatTransport
  const incomingMessages: Array<Record<string, unknown>> = body.messages ?? [];
  const lastMessage = incomingMessages[incomingMessages.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "No user message provided" },
      { status: 400 }
    );
  }

  const userMessageText = extractTextFromMessage(lastMessage);
  if (!userMessageText.trim()) {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 }
    );
  }

  // Strip PII from user message before sending to AI
  const { sanitized } = sanitizeUserMessage(userMessageText);

  // Persist user message
  const nextOrderIndex = interview.messages.length;
  await prisma.interviewMessage.create({
    data: {
      interviewSessionId: interviewId,
      role: "USER",
      content: userMessageText, // Store original message in DB
      orderIndex: nextOrderIndex,
    },
  });

  // Build conversation history for AI (with sanitized content)
  const conversationHistory: ModelMessage[] = interview.messages.map((m) => ({
    role: m.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));
  conversationHistory.push({ role: "user", content: sanitized });

  // Build system prompt from project config
  const config = interview.project.configuration;
  const industryClassification = (config?.industryClassification ?? {}) as {
    sector?: string;
  };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const systemPrompt = buildSystemPrompt({
    industry: interview.project.industry,
    sector: industryClassification.sector,
    processCategory: interview.processCategory,
    processTitle: interview.title,
    language: user?.preferredLang === "DE" ? "de" : "en",
    customTerminology:
      (config?.customTerminology as Record<
        string,
        { de: string; en: string }
      >) ?? undefined,
    interviewTemplateRefs:
      (config?.interviewTemplateRefs as string[]) ?? undefined,
  });

  let provider;
  try {
    provider = await getAIProvider();
  } catch {
    return NextResponse.json(
      { error: "AI service is temporarily unavailable" },
      { status: 503 }
    );
  }

  // Stream the AI response
  const result = streamText({
    model: provider.model,
    system: systemPrompt,
    messages: conversationHistory,
    async onFinish({ text }) {
      // Persist AI response
      await prisma.interviewMessage.create({
        data: {
          interviewSessionId: interviewId,
          role: "ASSISTANT",
          content: text,
          orderIndex: nextOrderIndex + 1,
        },
      });

      // Update the interview's updatedAt
      await prisma.interviewSession.update({
        where: { id: interviewId },
        data: { updatedAt: new Date() },
      });

      // Try to update the summary (non-blocking, best effort)
      try {
        const allMessages: ModelMessage[] = [
          ...conversationHistory,
          { role: "assistant" as const, content: text },
        ];
        const existingSummary =
          (interview.currentSummaryJson as ProcessSummary | null) ?? null;
        const updatedSummary = await extractSummary(
          provider,
          allMessages,
          existingSummary
        );
        await prisma.interviewSession.update({
          where: { id: interviewId },
          data: { currentSummaryJson: updatedSummary as object },
        });
        emitSummaryUpdate(interviewId, updatedSummary as Record<string, unknown>);
      } catch (e) {
        console.error("[Chat] Summary extraction failed:", e);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
