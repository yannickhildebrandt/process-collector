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
import { buildConfigChatPrompt } from "@/lib/config-chat/config-prompt-builder";
import {
  extractConfiguration,
  terminologyArrayToRecord,
} from "@/lib/config-chat/config-extractor";
import type { ProjectConfigurationData } from "@/lib/validators/config-schema";

type Params = {
  params: Promise<{ projectId: string }>;
};

/**
 * Extract text content from a Vercel AI SDK message.
 */
function extractTextFromMessage(msg: Record<string, unknown>): string {
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter(
        (p: { type?: string }) => p.type === "text" || p.type === undefined
      )
      .map(
        (p: { text?: string; content?: string }) => p.text || p.content || ""
      )
      .join("");
  }
  return "";
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId } = await params;

  // Validate consultant is project member with CONSULTANT role
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });
  if (!membership) return notFound("Project");
  if (membership.role !== "CONSULTANT") {
    return forbidden("Only consultants can use configuration chat");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { configuration: true },
  });
  if (!project) return notFound("Project");

  const body = await request.json();
  const incomingMessages: Array<Record<string, unknown>> =
    body.messages ?? [];

  // Convert to ModelMessage format for AI SDK
  const conversationHistory: ModelMessage[] = incomingMessages.map((msg) => ({
    role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: extractTextFromMessage(msg),
  }));

  // Load existing config for context
  const existingConfig = project.configuration
    ? ({
        industryClassification:
          project.configuration.industryClassification as unknown as ProjectConfigurationData["industryClassification"],
        processCategories:
          project.configuration.processCategories as unknown as ProjectConfigurationData["processCategories"],
        customTerminology:
          (project.configuration.customTerminology as unknown as ProjectConfigurationData["customTerminology"]) ??
          undefined,
        interviewTemplateRefs:
          (project.configuration.interviewTemplateRefs as unknown as ProjectConfigurationData["interviewTemplateRefs"]) ??
          undefined,
      } as ProjectConfigurationData)
    : null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const systemPrompt = buildConfigChatPrompt({
    projectName: project.name,
    existingConfig,
    language: user?.preferredLang === "DE" ? "de" : "en",
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

  const result = streamText({
    model: provider.model,
    system: systemPrompt,
    messages: conversationHistory,
    async onFinish({ text }) {
      // After AI responds, try to extract structured config
      try {
        const allMessages: ModelMessage[] = [
          ...conversationHistory,
          { role: "assistant" as const, content: text },
        ];
        const extracted = await extractConfiguration(provider, allMessages);

        // Convert terminology from array to record format
        const configForStorage = {
          ...extracted,
          customTerminology: terminologyArrayToRecord(
            extracted.customTerminology
          ),
        };

        // Store extracted config in a custom header is not possible with streaming,
        // so we'll store it temporarily and let the client fetch it via a separate call.
        // For now, the client will call extractConfiguration on its own after getting the response.
        // The extraction result is logged for debugging.
        console.log(
          "[ConfigChat] Extracted config:",
          JSON.stringify(configForStorage, null, 2)
        );
      } catch (e) {
        // Extraction failure is non-critical — the conversation continues
        console.error("[ConfigChat] Config extraction failed:", e);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
