import { stripPII, type PIIFilterResult } from "@/lib/llm/pii-filter";

/**
 * PII middleware for interview messages.
 * Wraps the existing pii-filter.ts to strip PII from user messages
 * before they are sent to the AI SDK.
 */
export function sanitizeUserMessage(content: string): {
  sanitized: string;
  piiResult: PIIFilterResult;
} {
  const piiResult = stripPII(content);

  if (piiResult.warnings.length > 0) {
    for (const warning of piiResult.warnings) {
      console.warn(`[Interview PII] ${warning}`);
    }
  }

  return {
    sanitized: piiResult.filteredText,
    piiResult,
  };
}
