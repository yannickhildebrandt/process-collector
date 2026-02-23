import { generateText } from "ai";
import type { AIProviderResult } from "@/lib/llm/ai-sdk-provider";
import { buildSystemPrompt } from "./prompt-builder";

interface GreetingContext {
  title: string;
  processCategory: string;
  industry: string;
  sector?: string;
  language: string;
  customTerminology?: Record<string, { de: string; en: string }>;
  interviewTemplateRefs?: string[];
}

/**
 * Generates a contextual AI greeting for a new interview.
 * Uses the same system prompt as the interview chat, with an
 * additional instruction to generate only a greeting message.
 */
export async function generateGreeting(
  provider: AIProviderResult,
  context: GreetingContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt({
    industry: context.industry,
    sector: context.sector,
    processCategory: context.processCategory,
    processTitle: context.title,
    language: context.language,
    customTerminology: context.customTerminology,
    interviewTemplateRefs: context.interviewTemplateRefs,
  });

  const greetingInstruction =
    context.language === "de"
      ? `Erstelle eine freundliche Begrüßungsnachricht für den Mitarbeiter. Beziehe dich auf den Prozess "${context.title}" in der Kategorie "${context.processCategory}" und den Branchenkontext. Erkläre kurz den Zweck des Interviews. Antworte NUR mit der Begrüßung, ohne weitere Fragen.`
      : `Generate a friendly greeting message for the employee. Reference the process "${context.title}" in the "${context.processCategory}" category and the industry context. Briefly explain the interview's purpose. Respond ONLY with the greeting, do not ask any questions yet.`;

  const { text } = await generateText({
    model: provider.model,
    system: systemPrompt,
    prompt: greetingInstruction,
  });

  return text;
}
