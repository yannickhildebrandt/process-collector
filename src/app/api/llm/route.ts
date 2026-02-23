import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import { LLMService } from "@/lib/llm/service";
import { LLMError, LLMProviderConfig } from "@/lib/llm/types";
import { MockAdapter } from "@/lib/llm/adapters/mock";
import { ClaudeAdapter } from "@/lib/llm/adapters/claude";

async function createLLMService(): Promise<LLMService> {
  const dbConfigs = await prisma.lLMProviderConfig.findMany();

  const configs: LLMProviderConfig[] = dbConfigs.map((c) => ({
    providerKey: c.providerKey,
    displayName: c.displayName,
    apiEndpoint: c.apiEndpoint,
    credentialRef: c.credentialRef,
    modelId: c.modelId,
    maxTokens: c.maxTokens,
    rateLimitRpm: c.rateLimitRpm,
    dpaActive: c.dpaActive,
    isDefault: c.isDefault,
  }));

  const providers = [];

  for (const config of configs) {
    if (config.providerKey === "mock") {
      providers.push(new MockAdapter());
    } else if (config.providerKey === "claude") {
      const apiKey = process.env[config.credentialRef];
      if (apiKey) {
        providers.push(new ClaudeAdapter(apiKey, config.modelId));
      }
    }
  }

  return new LLMService(providers, configs);
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await request.json();
  const { prompt, systemMessage, options, provider: providerOverride } = body;

  if (!prompt || typeof prompt !== "string") {
    return badRequest("Prompt is required");
  }
  if (!systemMessage || typeof systemMessage !== "string") {
    return badRequest("System message is required");
  }

  try {
    const service = await createLLMService();

    const response = await service.complete(
      {
        prompt,
        systemMessage,
        options: {
          maxTokens: options?.maxTokens ?? 2048,
          temperature: options?.temperature ?? 0.3,
          stopSequences: options?.stopSequences,
        },
      },
      providerOverride
    );

    return NextResponse.json({ result: response });
  } catch (error) {
    if (error instanceof LLMError) {
      if (error.code === "DPA_INACTIVE") {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      if (error.code === "RATE_LIMITED") {
        return NextResponse.json(
          { error: error.message, retryAfter: error.retryAfter },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: error.message, retryAfter: error.retryAfter },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred with the AI service." },
      { status: 500 }
    );
  }
}
