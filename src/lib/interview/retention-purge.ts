import { prisma } from "@/lib/db";

/**
 * Purges interview messages where the retention period has expired.
 * Deletes InterviewMessages where interviewSession.messageRetentionUntil < now()
 * and interviewSession.status = COMPLETED.
 *
 * Can be called via a cron job or API route.
 */
export async function purgeExpiredMessages(): Promise<{
  sessionsChecked: number;
  messagesDeleted: number;
}> {
  const now = new Date();

  // Find completed sessions past their retention date
  const expiredSessions = await prisma.interviewSession.findMany({
    where: {
      status: "COMPLETED",
      messageRetentionUntil: { lt: now },
    },
    select: { id: true },
  });

  if (expiredSessions.length === 0) {
    return { sessionsChecked: 0, messagesDeleted: 0 };
  }

  const sessionIds = expiredSessions.map((s) => s.id);

  const result = await prisma.interviewMessage.deleteMany({
    where: {
      interviewSessionId: { in: sessionIds },
    },
  });

  return {
    sessionsChecked: expiredSessions.length,
    messagesDeleted: result.count,
  };
}
