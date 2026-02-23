const STALE_THRESHOLD_DAYS = 30;

/**
 * Checks if an interview should be marked as STALE based on its updatedAt timestamp.
 * An interview is considered stale if it has been idle for more than 30 days.
 */
export function isInterviewStale(updatedAt: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - updatedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > STALE_THRESHOLD_DAYS;
}
