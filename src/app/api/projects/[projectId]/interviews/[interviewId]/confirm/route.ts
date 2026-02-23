import { NextRequest, NextResponse } from "next/server";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/llm/ai-sdk-provider";
import { generateProcessMarkdown } from "@/lib/interview/markdown-generator";
import { generateBpmnXml } from "@/lib/interview/bpmn-generator";
import type { ProcessSummary } from "@/lib/interview/schemas";

type Params = {
  params: Promise<{ projectId: string; interviewId: string }>;
};

// T030: POST - Confirm summary, generate ProcessEntry with Markdown + BPMN
export async function POST(_request: NextRequest, { params }: Params) {
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
    return forbidden("Only the interview owner can confirm");
  }

  if (interview.status !== "SUMMARY_REVIEW") {
    return NextResponse.json(
      { error: "Interview must be in SUMMARY_REVIEW status to confirm" },
      { status: 409 }
    );
  }

  const summary = interview.currentSummaryJson as unknown as ProcessSummary;
  if (!summary) {
    return NextResponse.json(
      { error: "No summary available to confirm" },
      { status: 400 }
    );
  }

  // Get user language preference
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  const language = user?.preferredLang === "DE" ? "de" : "en";

  // Generate Markdown
  let markdownContent: string;
  try {
    const provider = await getAIProvider();
    markdownContent = await generateProcessMarkdown(provider, summary, language);
  } catch (e) {
    console.error("[Confirm] Markdown generation failed:", e);
    // Fallback: generate basic markdown from summary
    markdownContent = generateFallbackMarkdown(summary);
  }

  // Generate BPMN (deterministic, no LLM)
  let bpmnXml: string;
  try {
    bpmnXml = generateBpmnXml(summary);
  } catch (e) {
    console.error("[Confirm] BPMN generation failed:", e);
    return NextResponse.json(
      { error: "BPMN generation failed. The interview has been preserved for review." },
      { status: 500 }
    );
  }

  // Create ProcessEntry and update interview in a transaction
  const retentionDays = 90;
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + retentionDays);

  const result = await prisma.$transaction(async (tx) => {
    const processEntry = await tx.processEntry.create({
      data: {
        projectId,
        createdById: session.user.id,
        title: interview.title,
        status: "COMPLETED",
        markdownContent,
        bpmnXml,
        interviewSessionId: interviewId,
      },
    });

    const updatedInterview = await tx.interviewSession.update({
      where: { id: interviewId },
      data: {
        status: "COMPLETED",
        messageRetentionUntil: retentionDate,
      },
    });

    return { processEntry, interview: updatedInterview };
  });

  return NextResponse.json({
    interview: {
      id: result.interview.id,
      status: result.interview.status,
      processEntryId: result.processEntry.id,
    },
    processEntry: {
      id: result.processEntry.id,
      title: result.processEntry.title,
      status: result.processEntry.status,
      markdownContent: result.processEntry.markdownContent,
      bpmnXml: result.processEntry.bpmnXml,
    },
  });
}

function generateFallbackMarkdown(summary: ProcessSummary): string {
  const lines: string[] = [];
  lines.push(`# ${summary.processName}`);
  if (summary.description) lines.push(`\n${summary.description}`);

  if (summary.trigger) {
    lines.push(`\n## Trigger\n${summary.trigger.description}`);
  }

  if (summary.steps?.length) {
    lines.push("\n## Process Steps");
    for (const step of summary.steps) {
      lines.push(`\n### ${step.name}`);
      lines.push(step.description);
      if (step.actor) lines.push(`- **Actor**: ${step.actor}`);
      if (step.system) lines.push(`- **System**: ${step.system}`);
    }
  }

  if (summary.roles?.length) {
    lines.push("\n## Roles & Responsibilities");
    for (const role of summary.roles) {
      lines.push(`- **${role.name}**${role.description ? `: ${role.description}` : ""}`);
    }
  }

  if (summary.systems?.length) {
    lines.push("\n## Systems Used");
    for (const sys of summary.systems) {
      lines.push(`- **${sys.name}**${sys.description ? `: ${sys.description}` : ""}`);
    }
  }

  if (summary.metrics?.length) {
    lines.push("\n## Key Metrics");
    for (const metric of summary.metrics) {
      lines.push(`- **${metric.name}**${metric.value ? `: ${metric.value}` : ""}`);
    }
  }

  return lines.join("\n");
}
