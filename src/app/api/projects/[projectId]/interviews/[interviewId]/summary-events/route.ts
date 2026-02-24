import { NextRequest } from "next/server";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { onSummaryUpdate } from "@/lib/interview/summary-events";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string; interviewId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { projectId, interviewId } = await params;

  const interview = await prisma.interviewSession.findUnique({
    where: { id: interviewId },
    select: { projectId: true, employeeId: true },
  });

  if (!interview || interview.projectId !== projectId) {
    return notFound("Interview");
  }

  if (interview.employeeId !== session.user.id) {
    return forbidden("Only the interview owner can subscribe to updates");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      controller.enqueue(encoder.encode(":connected\n\n"));

      // Subscribe to summary updates for this interview
      const unsubscribe = onSummaryUpdate(interviewId, (summary) => {
        try {
          const data = JSON.stringify(summary);
          controller.enqueue(
            encoder.encode(`event: summary-update\ndata: ${data}\n\n`)
          );
        } catch {
          // Stream may already be closed
        }
      });

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(":heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Auto-close after 5 minutes
      const timeout = setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }, 5 * 60 * 1000);

      function cleanup() {
        unsubscribe();
        clearInterval(heartbeat);
        clearTimeout(timeout);
      }

      // Clean up on client disconnect
      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
