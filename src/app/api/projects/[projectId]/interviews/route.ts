import { NextRequest, NextResponse } from "next/server";
import {
  getAuthSession,
  unauthorized,
  badRequest,
  notFound,
  forbidden,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { isInterviewStale } from "@/lib/interview/stale-detector";
import { generateGreeting } from "@/lib/interview/greeting-generator";
import { getAIProvider } from "@/lib/llm/ai-sdk-provider";

// T011: POST - Create a new interview session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId } = await params;

  // Check project membership
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });
  if (!membership) return notFound("Project");
  if (membership.role !== "EMPLOYEE") {
    return forbidden("Only employees can create interviews");
  }

  const body = await request.json();
  const { processCategory, title } = body;

  if (!processCategory || typeof processCategory !== "string") {
    return badRequest("processCategory is required");
  }
  if (!title || typeof title !== "string") {
    return badRequest("title is required");
  }

  // Validate that processCategory exists in project config
  const config = await prisma.projectConfiguration.findUnique({
    where: { projectId },
  });
  if (config) {
    const categories = config.processCategories as Array<{
      key: string;
    }>;
    const validCategory = categories.some((c) => c.key === processCategory);
    if (!validCategory) {
      return badRequest(`Invalid process category: ${processCategory}`);
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { configuration: true },
  });

  const interview = await prisma.interviewSession.create({
    data: {
      projectId,
      employeeId: session.user.id,
      processCategory,
      title,
      status: "IN_PROGRESS",
    },
  });

  // Generate contextual AI greeting and persist as first message
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  const language = user?.preferredLang === "DE" ? "de" : "en";

  let greetingText: string;
  try {
    const provider = await getAIProvider();
    const industryClassification = (project?.configuration?.industryClassification ?? {}) as {
      sector?: string;
    };
    greetingText = await generateGreeting(provider, {
      title,
      processCategory,
      industry: project?.industry ?? "General",
      sector: industryClassification.sector,
      language,
      customTerminology:
        (project?.configuration?.customTerminology as Record<
          string,
          { de: string; en: string }
        >) ?? undefined,
      interviewTemplateRefs:
        (project?.configuration?.interviewTemplateRefs as string[]) ?? undefined,
    });
  } catch (e) {
    console.error("[Interviews] Greeting generation failed, using fallback:", e);
    // Static fallback greeting
    greetingText =
      language === "de"
        ? `Hallo! Ich bin hier, um Ihnen bei der Dokumentation Ihres Geschäftsprozesses "${title}" zu helfen. Bitte beschreiben Sie, worum es in diesem Prozess geht, und wir legen los.`
        : `Hello! I'm here to help you document your business process "${title}". Please describe what this process is about and we'll get started.`;
  }

  await prisma.interviewMessage.create({
    data: {
      interviewSessionId: interview.id,
      role: "ASSISTANT",
      content: greetingText,
      orderIndex: 0,
    },
  });

  return NextResponse.json({ interview }, { status: 201 });
}

// T012: GET - List interviews for current employee in project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId } = await params;

  // Check project membership
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });
  if (!membership) return notFound("Project");

  const interviews = await prisma.interviewSession.findMany({
    where: {
      projectId,
      employeeId: session.user.id,
    },
    select: {
      id: true,
      processCategory: true,
      title: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Mark stale interviews (idle > 30 days)
  const staleIds: string[] = [];
  for (const interview of interviews) {
    if (
      interview.status === "IN_PROGRESS" &&
      isInterviewStale(interview.updatedAt)
    ) {
      staleIds.push(interview.id);
    }
  }
  if (staleIds.length > 0) {
    await prisma.interviewSession.updateMany({
      where: { id: { in: staleIds } },
      data: { status: "STALE" },
    });
  }

  return NextResponse.json({
    interviews: interviews.map((i) => ({
      id: i.id,
      processCategory: i.processCategory,
      title: i.title,
      status:
        i.status === "IN_PROGRESS" && staleIds.includes(i.id)
          ? "STALE"
          : i.status,
      messageCount: i._count.messages,
      updatedAt: i.updatedAt,
      createdAt: i.createdAt,
    })),
  });
}
