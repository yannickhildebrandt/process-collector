import { NextRequest, NextResponse } from "next/server";
import type { ModelMessage } from "ai";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
  badRequest,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/llm/ai-sdk-provider";
import {
  extractConfiguration,
  terminologyArrayToRecord,
} from "@/lib/config-chat/config-extractor";

type Params = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });
  if (!membership) return notFound("Project");
  if (membership.role !== "CONSULTANT") {
    return forbidden("Only consultants can extract configuration");
  }

  const body = await request.json();
  const incomingMessages: Array<{ role: string; content: string }> =
    body.messages ?? [];

  if (incomingMessages.length < 2) {
    return badRequest(
      "At least 2 messages (user + assistant) are required for extraction"
    );
  }

  const conversationHistory: ModelMessage[] = incomingMessages.map((msg) => ({
    role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: msg.content,
  }));

  let provider;
  try {
    provider = await getAIProvider();
  } catch {
    return NextResponse.json(
      { error: "AI service is temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
    const extracted = await extractConfiguration(provider, conversationHistory);

    // Convert for storage format but return both formats
    const configForStorage = {
      industryClassification: extracted.industryClassification,
      processCategories: extracted.processCategories,
      customTerminology: terminologyArrayToRecord(extracted.customTerminology),
      interviewTemplateRefs: extracted.interviewTemplateRefs ?? null,
    };

    return NextResponse.json({ configuration: configForStorage });
  } catch (e) {
    console.error("[ConfigChat/Extract] Extraction failed:", e);
    return NextResponse.json(
      { error: "Could not extract configuration from conversation" },
      { status: 422 }
    );
  }
}
