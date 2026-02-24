import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, unauthorized, forbidden, notFound, badRequest, conflict } from "@/lib/api-utils";
import { validateProjectConfiguration } from "@/lib/validators/config-schema";
import { invalidateConfig } from "@/lib/interview/config-cache";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId } = await params;

  // Check consultant membership
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });

  if (!membership) return notFound("Project");
  if (membership.role !== "CONSULTANT") {
    return forbidden("Only consultants can update project configuration");
  }

  const body = await request.json();
  const { version, configuration } = body;

  if (typeof version !== "number") {
    return badRequest("Version number is required for optimistic concurrency control");
  }

  if (!configuration) {
    return badRequest("Configuration data is required");
  }

  // Validate the new configuration
  const configResult = validateProjectConfiguration(configuration);
  if (!configResult.valid) {
    return badRequest(
      `Invalid configuration: ${configResult.errors.map((e) => e.message).join(", ")}`
    );
  }

  // Optimistic concurrency check
  const currentConfig = await prisma.projectConfiguration.findUnique({
    where: { projectId },
  });

  if (!currentConfig) return notFound("Project configuration");

  if (currentConfig.version !== version) {
    return conflict("Configuration has been modified by another user", {
      currentVersion: currentConfig.version,
    });
  }

  const updated = await prisma.projectConfiguration.update({
    where: { projectId },
    data: {
      industryClassification: configuration.industryClassification,
      processCategories: configuration.processCategories,
      customTerminology: configuration.customTerminology ?? null,
      interviewTemplateRefs: configuration.interviewTemplateRefs ?? null,
      version: { increment: 1 },
    },
  });

  // Invalidate cached config so next chat message picks up the changes
  invalidateConfig(projectId);

  return NextResponse.json({
    configuration: {
      industryClassification: updated.industryClassification,
      processCategories: updated.processCategories,
      customTerminology: updated.customTerminology,
      interviewTemplateRefs: updated.interviewTemplateRefs,
      version: updated.version,
    },
  });
}
