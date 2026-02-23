import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { preferredLang } = body;

  if (preferredLang && !["DE", "EN"].includes(preferredLang)) {
    return NextResponse.json(
      { error: "Invalid language. Must be DE or EN." },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(preferredLang && { preferredLang }),
    },
    select: {
      id: true,
      preferredLang: true,
    },
  });

  return NextResponse.json({ user: updatedUser });
}
