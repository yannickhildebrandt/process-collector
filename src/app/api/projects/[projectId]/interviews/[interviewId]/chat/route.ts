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
import {
  getOrBuildConfig,
  buildCachedSystemPrompt,
} from "@/lib/interview/config-cache";
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
  let conversationHistory: ModelMessage[] = interview.messages.map((m) => ({
    role: m.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));
  conversationHistory.push({ role: "user", content: sanitized });

  // Conversation windowing: send only the last 15 messages to reduce tokens
  const WINDOW_SIZE = 15;
  if (conversationHistory.length > WINDOW_SIZE) {
    conversationHistory = conversationHistory.slice(-WINDOW_SIZE);
  }

  // Build system prompt from cached project config
  const cachedConfig = await getOrBuildConfig(projectId);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const systemPrompt = buildCachedSystemPrompt(cachedConfig, {
    processCategory: interview.processCategory,
    processTitle: interview.title,
    language: user?.preferredLang === "DE" ? "de" : "en",
    currentSummary:
      (interview.currentSummaryJson as ProcessSummary | undefined) ?? undefined,
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

      // Batched summary extraction: only extract every 3 messages
      const aiMessageIndex = nextOrderIndex + 1;
      const messagesSinceLastExtraction =
        aiMessageIndex - interview.lastSummarizedIndex;

      if (messagesSinceLastExtraction >= 3) {
        const allMessages: ModelMessage[] = [
          ...conversationHistory,
          { role: "assistant" as const, content: text },
        ];
        const existingSummary =
          (interview.currentSummaryJson as ProcessSummary | null) ?? null;

        // Incremental extraction: only process messages since last extraction
        const startFromIndex =
          interview.lastSummarizedIndex >= 0
            ? interview.lastSummarizedIndex + 1
            : undefined;

        let updatedSummary: ProcessSummary | null = null;
        try {
          updatedSummary = await extractSummary(
            provider,
            allMessages,
            existingSummary,
            startFromIndex
          );
        } catch (e) {
          // Retry once on failure
          console.warn("[Chat] Summary extraction failed, retrying:", e);
          try {
            updatedSummary = await extractSummary(
              provider,
              allMessages,
              existingSummary,
              startFromIndex
            );
          } catch (retryError) {
            console.error(
              "[Chat] Summary extraction retry failed:",
              retryError
            );
          }
        }

        if (updatedSummary) {
          await prisma.interviewSession.update({
            where: { id: interviewId },
            data: {
              currentSummaryJson: updatedSummary as object,
              lastSummarizedIndex: aiMessageIndex,
            },
          });
          emitSummaryUpdate(
            interviewId,
            updatedSummary as Record<string, unknown>
          );
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
