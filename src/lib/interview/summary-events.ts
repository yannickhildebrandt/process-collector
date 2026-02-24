import { EventEmitter } from "events";

const globalForEvents = globalThis as unknown as {
  summaryEventEmitter: EventEmitter | undefined;
};

export const summaryEventEmitter =
  globalForEvents.summaryEventEmitter ?? new EventEmitter();

summaryEventEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.summaryEventEmitter = summaryEventEmitter;
}

export function emitSummaryUpdate(
  interviewId: string,
  summary: Record<string, unknown>
) {
  summaryEventEmitter.emit(`summary:${interviewId}`, summary);
}

export function onSummaryUpdate(
  interviewId: string,
  callback: (summary: Record<string, unknown>) => void
): () => void {
  const event = `summary:${interviewId}`;
  summaryEventEmitter.on(event, callback);
  return () => {
    summaryEventEmitter.off(event, callback);
  };
}
