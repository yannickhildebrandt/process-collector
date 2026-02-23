import { generateObject } from "ai";
import { ProcessSummarySchema, type ProcessSummary } from "./schemas";
import type { AIProviderResult } from "@/lib/llm/ai-sdk-provider";
import type { ModelMessage } from "ai";

/**
 * Extracts or updates the structured process summary from conversation history.
 * Uses Vercel AI SDK generateObject with the zod schema.
 *
 * Note: We serialize the conversation into a single user prompt instead of
 * passing messages directly, because Anthropic requires the last message
 * to be a user message when using generateObject (assistant prefill).
 */
export async function extractSummary(
  provider: AIProviderResult,
  messages: ModelMessage[],
  existingSummary: ProcessSummary | null
): Promise<ProcessSummary> {
  const conversationText = messages
    .map((m) => {
      const role = m.role === "assistant" ? "AI Interviewer" : "Employee";
      const content =
        typeof m.content === "string"
          ? m.content
          : JSON.stringify(m.content);
      return `${role}: ${content}`;
    })
    .join("\n\n");

  const systemPrompt = existingSummary
    ? `You are a process documentation extraction assistant. Update the existing process summary based on the latest conversation messages. Only add or modify information that the employee has explicitly stated. Preserve existing information that hasn't been contradicted.

Existing summary:
${JSON.stringify(existingSummary, null, 2)}`
    : `You are a process documentation extraction assistant. Extract a structured process summary from the conversation between an AI interviewer and an employee. Only include information the employee has explicitly stated. Do not invent or assume any details.`;

  const { object } = await generateObject({
    model: provider.model,
    schema: ProcessSummarySchema,
    system: systemPrompt,
    prompt: `Extract the process summary from the following conversation:\n\n${conversationText}`,
  });

  return object;
}
