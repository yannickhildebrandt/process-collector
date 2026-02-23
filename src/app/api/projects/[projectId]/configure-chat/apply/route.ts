import { NextRequest, NextResponse } from "next/server";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
  badRequest,
  conflict,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { validateProjectConfiguration } from "@/lib/validators/config-schema";

type Params = {
  params: Promise<{ projectId: string }>;
};

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
    return forbidden("Only consultants can apply configuration");
  }

  const body = await request.json();
  const { configuration, version } = body;

  if (!configuration) {
    return badRequest("Configuration data is required");
  }
  if (typeof version !== "number") {
    return badRequest(
      "Version number is required for optimistic concurrency control"
    );
  }

  // Validate the configuration
  const configResult = validateProjectConfiguration(configuration);
  if (!configResult.valid) {
    return NextResponse.json(
      {
        error: "Invalid configuration",
        details: configResult.errors,
      },
      { status: 400 }
    );
  }

  // Check if a configuration exists
  const existingConfig = await prisma.projectConfiguration.findUnique({
    where: { projectId },
  });

  if (existingConfig) {
    // Optimistic concurrency check
    if (existingConfig.version !== version) {
      return conflict("Configuration has been modified by another user", {
        currentVersion: existingConfig.version,
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

    return NextResponse.json({
      configuration: {
        industryClassification: updated.industryClassification,
        processCategories: updated.processCategories,
        customTerminology: updated.customTerminology,
        interviewTemplateRefs: updated.interviewTemplateRefs,
        version: updated.version,
      },
    });
  } else {
    // Create new configuration
    const created = await prisma.projectConfiguration.create({
      data: {
        projectId,
        industryClassification: configuration.industryClassification,
        processCategories: configuration.processCategories,
        customTerminology: configuration.customTerminology ?? null,
        interviewTemplateRefs: configuration.interviewTemplateRefs ?? null,
        version: 1,
      },
    });

    return NextResponse.json(
      {
        configuration: {
          industryClassification: created.industryClassification,
          processCategories: created.processCategories,
          customTerminology: created.customTerminology,
          interviewTemplateRefs: created.interviewTemplateRefs,
          version: created.version,
        },
      },
      { status: 201 }
    );
  }
}
