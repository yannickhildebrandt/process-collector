import { createAnthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/db";
import type { LanguageModel } from "ai";

export interface AIProviderResult {
  model: LanguageModel;
  providerKey: string;
  modelId: string;
}

/**
 * Creates a Vercel AI SDK provider from the database LLMProviderConfig.
 * Reads runtime configuration from DB and returns a configured provider.
 */
export async function getAIProvider(
  providerKeyOverride?: string
): Promise<AIProviderResult> {
  const config = providerKeyOverride
    ? await prisma.lLMProviderConfig.findUnique({
        where: { providerKey: providerKeyOverride },
      })
    : await prisma.lLMProviderConfig.findFirst({
        where: { isDefault: true },
      });

  if (!config) {
    throw new Error(
      "No LLM provider configured. Please contact your administrator."
    );
  }

  if (!config.dpaActive) {
    throw new Error(
      "This service cannot be used until a data processing agreement is in place."
    );
  }

  if (config.providerKey === "mock") {
    // Return a mock model for testing
    const { createMockAIModel } = await import("./mock-ai-model");
    return {
      model: createMockAIModel(),
      providerKey: config.providerKey,
      modelId: config.modelId,
    };
  }

  if (
    config.providerKey === "claude" ||
    config.providerKey === "anthropic"
  ) {
    const apiKey = process.env[config.credentialRef];
    if (!apiKey) {
      throw new Error(
        `API key not found in environment variable: ${config.credentialRef}`
      );
    }

    const anthropic = createAnthropic({
      apiKey,
      baseURL: config.apiEndpoint.includes("anthropic.com")
        ? undefined
        : config.apiEndpoint,
    });

    return {
      model: anthropic(config.modelId),
      providerKey: config.providerKey,
      modelId: config.modelId,
    };
  }

  throw new Error(`Unsupported provider: ${config.providerKey}`);
}
