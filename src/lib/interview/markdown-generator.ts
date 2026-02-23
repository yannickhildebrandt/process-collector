import { generateText } from "ai";
import type { AIProviderResult } from "@/lib/llm/ai-sdk-provider";
import type { ProcessSummary } from "./schemas";

/**
 * Generates a structured Markdown document from the confirmed process summary JSON.
 * Uses the LLM to produce well-formatted Markdown with proper sections.
 */
export async function generateProcessMarkdown(
  provider: AIProviderResult,
  summary: ProcessSummary,
  language: string
): Promise<string> {
  const lang = language === "de" ? "German" : "English";

  const { text } = await generateText({
    model: provider.model,
    system: `Generate a structured Markdown document from the following process summary.
Use these sections: Trigger, Process Steps, Roles/Responsibilities,
Systems Used, Decision Points, Key Metrics.
Use clear headings, bullet points, and tables where appropriate.
Conduct the output in ${lang}.
IMPORTANT: Only include information present in the summary.
Do not add, infer, or embellish any details.`,
    prompt: `Process Summary:\n${JSON.stringify(summary, null, 2)}`,
  });

  return text;
}
