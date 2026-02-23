import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, unauthorized, forbidden, badRequest, conflict } from "@/lib/api-utils";
import { validateProjectConfiguration } from "@/lib/validators/config-schema";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  let projects;

  if (user?.role === "CONSULTANT") {
    // Consultants see all their projects
    projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: session.user.id } },
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Employees see only their single assigned project
    projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: session.user.id } },
      },
      include: {
        _count: { select: { members: true } },
      },
    });
  }

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      industry: p.industry,
      status: p.status,
      memberCount: p._count.members,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "CONSULTANT") {
    return forbidden("Only consultants can create projects");
  }

  const body = await request.json();
  const { name, industry, configuration } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return badRequest("Project name is required");
  }
  if (!industry || typeof industry !== "string" || industry.trim() === "") {
    return badRequest("Industry is required");
  }

  // Validate configuration if provided
  if (configuration) {
    const configResult = validateProjectConfiguration(configuration);
    if (!configResult.valid) {
      return badRequest(
        `Invalid configuration: ${configResult.errors.map((e) => e.message).join(", ")}`
      );
    }
  }

  // Check for duplicate name within consultant's projects
  const existing = await prisma.project.findFirst({
    where: {
      name: name.trim(),
      members: { some: { userId: session.user.id } },
    },
  });

  if (existing) {
    return conflict("A project with this name already exists", {
      warning: "A project with this name already exists",
      existingProjectId: existing.id,
    });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      industry: industry.trim(),
      members: {
        create: {
          userId: session.user.id,
          role: "CONSULTANT",
        },
      },
      ...(configuration && {
        configuration: {
          create: {
            industryClassification: configuration.industryClassification,
            processCategories: configuration.processCategories,
            customTerminology: configuration.customTerminology ?? null,
            interviewTemplateRefs: configuration.interviewTemplateRefs ?? null,
          },
        },
      }),
    },
  });

  return NextResponse.json(
    {
      project: {
        id: project.id,
        name: project.name,
        industry: project.industry,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
