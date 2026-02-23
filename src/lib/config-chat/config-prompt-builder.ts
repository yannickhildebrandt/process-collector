import type { ProjectConfigurationData } from "@/lib/validators/config-schema";

interface ConfigChatContext {
  projectName: string;
  existingConfig?: ProjectConfigurationData | null;
  language: string;
}

/**
 * Builds the system prompt for the consultant project configuration chat.
 * Instructs the AI to help configure industry, categories, terminology,
 * and interview template references through conversation.
 */
export function buildConfigChatPrompt(context: ConfigChatContext): string {
  const configSection = context.existingConfig
    ? formatExistingConfig(context.existingConfig, context.language)
    : "No configuration has been set up yet.";

  return `You are a project configuration assistant for the Process Collector platform.
You are helping a consultant configure the project "${context.projectName}".

Your role is to help the consultant define:
1. **Industry Classification**: The client's industry sector and optional sub-sector
2. **Process Categories**: The types of business processes that will be documented (each needs a URL-friendly key, a German label, and an English label)
3. **Custom Terminology**: Domain-specific terms the client uses (each needs the canonical English term plus German and English translations)
4. **Interview Template References**: Standards or frameworks to reference during interviews (e.g., "ISO 27001", "ITIL v4")

CURRENT CONFIGURATION:
${configSection}

RULES:
- Conduct the conversation in ${context.language === "de" ? "German" : "English"}.
- Ask clarifying questions to understand the client's domain.
- Suggest appropriate categories and terminology based on the industry.
- When suggesting process category keys, use lowercase kebab-case (e.g., "patient-intake", "order-processing").
- Always provide both German and English labels for categories and terminology.
- Be concise and structured in your responses.
- After gathering enough information, summarize what you'll configure.

BEHAVIOR:
- If the project already has a configuration, acknowledge it and ask what the consultant wants to change.
- If starting fresh, ask about the client's industry first, then processes, then terminology.
- Suggest reasonable defaults based on the industry when appropriate.`;
}

function formatExistingConfig(
  config: ProjectConfigurationData,
  language: string
): string {
  const parts: string[] = [];

  parts.push(
    `Industry: ${config.industryClassification.sector}${config.industryClassification.subSector ? ` / ${config.industryClassification.subSector}` : ""}`
  );

  if (config.processCategories.length > 0) {
    const catList = config.processCategories
      .map(
        (c) =>
          `  - ${c.key}: ${language === "de" ? c.labelDe : c.labelEn}`
      )
      .join("\n");
    parts.push(`Process Categories:\n${catList}`);
  }

  if (config.customTerminology) {
    const termEntries = Object.entries(config.customTerminology);
    if (termEntries.length > 0) {
      const termList = termEntries
        .map(
          ([term, value]) =>
            `  - "${term}": ${language === "de" ? value.de : value.en}`
        )
        .join("\n");
      parts.push(`Custom Terminology:\n${termList}`);
    }
  }

  if (config.interviewTemplateRefs && config.interviewTemplateRefs.length > 0) {
    parts.push(
      `Interview Templates: ${config.interviewTemplateRefs.join(", ")}`
    );
  }

  return parts.join("\n");
}
