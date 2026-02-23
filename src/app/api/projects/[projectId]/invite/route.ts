import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, unauthorized, forbidden, notFound, badRequest } from "@/lib/api-utils";

export async function POST(
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
    return forbidden("Only consultants can invite employees");
  }

  const body = await request.json();
  const { email, displayName } = body;

  if (!email || typeof email !== "string") {
    return badRequest("Employee email is required");
  }
  if (!displayName || typeof displayName !== "string") {
    return badRequest("Employee display name is required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if employee already exists and is in another project
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      projectMembers: true,
    },
  });

  if (user) {
    // If user is already assigned to a project (employee can only be in one)
    if (user.role === "EMPLOYEE" && user.projectMembers.length > 0) {
      const existingProjectMember = user.projectMembers[0];
      if (existingProjectMember.projectId === projectId) {
        return badRequest("This employee is already a member of this project");
      }
      return badRequest("This employee is already assigned to another project");
    }

    // Check if already a member of this project
    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: user.id },
      },
    });

    if (existingMembership) {
      return badRequest("This user is already a member of this project");
    }
  } else {
    // Create new Employee user
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: displayName.trim(),
        role: "EMPLOYEE",
        emailVerified: false,
      },
      include: {
        projectMembers: true,
      },
    });
  }

  // Add to project
  await prisma.projectMember.create({
    data: {
      projectId,
      userId: user.id,
      role: "EMPLOYEE",
    },
  });

  // Send magic link
  let magicLinkSent = false;
  try {
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_xxx") {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await resend.emails.send({
        from: "Process Collector <noreply@process-collector.app>",
        to: normalizedEmail,
        subject: "You have been invited / Sie wurden eingeladen",
        html: `
          <p>You have been invited to a project on Process Collector.</p>
          <p>Sie wurden zu einem Projekt im Process Collector eingeladen.</p>
          <p><a href="${appUrl}">Click here to log in / Hier klicken zum Anmelden</a></p>
        `,
      });
      magicLinkSent = true;
    } else {
      console.log(`[Invite] Magic link would be sent to: ${normalizedEmail}`);
      magicLinkSent = true; // In dev mode, we log it
    }
  } catch (error) {
    console.error("[Invite] Failed to send email:", error);
  }

  return NextResponse.json(
    {
      invitation: {
        email: normalizedEmail,
        magicLinkSent,
      },
    },
    { status: 201 }
  );
}
