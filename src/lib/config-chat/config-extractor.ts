import { z } from "zod";
import { generateObject } from "ai";
import type { AIProviderResult } from "@/lib/llm/ai-sdk-provider";
import type { ModelMessage } from "ai";
import type { CustomTerminology } from "@/lib/validators/config-schema";

/**
 * Anthropic-compatible Zod schema for project configuration extraction.
 * Uses z.array(z.object({...})) instead of z.record() to avoid
 * Anthropic's propertyNames rejection.
 */
export const ProjectConfigurationSchema = z.object({
  industryClassification: z.object({
    sector: z.string().describe("The industry sector, e.g. 'Manufacturing', 'Healthcare', 'Finance'"),
    subSector: z.string().optional().describe("A more specific sub-sector, e.g. 'Automotive', 'Hospital'"),
  }),
  processCategories: z
    .array(
      z.object({
        key: z.string().describe("URL-friendly key, e.g. 'patient-intake'"),
        labelDe: z.string().describe("German label for the category"),
        labelEn: z.string().describe("English label for the category"),
      })
    )
    .describe("List of process categories the project should have"),
  customTerminology: z
    .array(
      z.object({
        term: z.string().describe("The canonical English term being customized"),
        de: z.string().describe("German translation or custom term"),
        en: z.string().describe("English translation or custom term"),
      })
    )
    .optional()
    .describe("Custom terminology overrides for this project"),
  interviewTemplateRefs: z
    .array(z.string())
    .optional()
    .describe("References to interview templates or standards, e.g. 'ISO 27001'"),
});

export type ExtractedConfig = z.infer<typeof ProjectConfigurationSchema>;

/**
 * Extracts structured project configuration from a conversation using generateObject.
 *
 * Note: We serialize the conversation into a single user prompt instead of
 * passing messages directly, because Anthropic requires the last message
 * to be a user message when using generateObject (assistant prefill).
 */
export async function extractConfiguration(
  provider: AIProviderResult,
  messages: ModelMessage[]
): Promise<ExtractedConfig> {
  const conversationText = messages
    .map((m) => {
      const role = m.role === "assistant" ? "AI Assistant" : "Consultant";
      const content =
        typeof m.content === "string"
          ? m.content
          : JSON.stringify(m.content);
      return `${role}: ${content}`;
    })
    .join("\n\n");

  const { object } = await generateObject({
    model: provider.model,
    schema: ProjectConfigurationSchema,
    system: `You are a project configuration extraction assistant. Extract structured project configuration from the conversation between a consultant and an AI assistant. Only include information that was explicitly discussed. For process category keys, generate URL-friendly slugs from the label.`,
    prompt: `Extract the project configuration from the following conversation:\n\n${conversationText}`,
  });

  return object;
}

/**
 * Converts the array-format customTerminology from extraction
 * to the record format used in ProjectConfiguration storage.
 */
export function terminologyArrayToRecord(
  terminology: ExtractedConfig["customTerminology"]
): CustomTerminology | null {
  if (!terminology || terminology.length === 0) return null;
  const record: CustomTerminology = {};
  for (const entry of terminology) {
    record[entry.term] = { de: entry.de, en: entry.en };
  }
  return record;
}

/**
 * Converts the record-format customTerminology from DB storage
 * to the array format used in extraction schemas.
 */
export function terminologyRecordToArray(
  terminology: CustomTerminology | null | undefined
): ExtractedConfig["customTerminology"] {
  if (!terminology) return undefined;
  return Object.entries(terminology).map(([term, value]) => ({
    term,
    de: value.de,
    en: value.en,
  }));
}
