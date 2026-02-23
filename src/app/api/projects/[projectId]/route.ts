import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, unauthorized, notFound } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId } = await params;

  // Check membership
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: session.user.id },
    },
  });

  if (!membership) return notFound("Project");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      configuration: true,
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (!project) return notFound("Project");

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      industry: project.industry,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      configuration: project.configuration
        ? {
            industryClassification: project.configuration.industryClassification,
            processCategories: project.configuration.processCategories,
            customTerminology: project.configuration.customTerminology,
            interviewTemplateRefs: project.configuration.interviewTemplateRefs,
            version: project.configuration.version,
          }
        : null,
      members: project.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
    },
  });
}
