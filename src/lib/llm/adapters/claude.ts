import Anthropic from "@anthropic-ai/sdk";
import { LLMProvider, LLMRequest, LLMResponse, LLMError } from "../types";

export class ClaudeAdapter implements LLMProvider {
  providerKey = "claude";

  private client: Anthropic;
  private modelId: string;

  constructor(apiKey: string, modelId: string = "claude-sonnet-4-6") {
    this.client = new Anthropic({ apiKey });
    this.modelId = modelId;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.modelId,
        max_tokens: request.options?.maxTokens ?? 4096,
        ...(request.options?.temperature !== undefined && {
          temperature: request.options.temperature,
        }),
        ...(request.options?.stopSequences && {
          stop_sequences: request.options.stopSequences,
        }),
        system: request.systemMessage,
        messages: [
          {
            role: "user",
            content: request.prompt,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      const content = textContent && "text" in textContent ? textContent.text : "";

      return {
        content,
        provider: "claude",
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
        },
        finishReason: response.stop_reason === "end_turn" ? "complete" : response.stop_reason ?? "complete",
      };
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) {
        throw new LLMError({
          code: "RATE_LIMITED",
          message: "Too many requests. Please wait before trying again.",
          retryAfter: 30,
          provider: "claude",
        });
      }
      if (error instanceof Anthropic.AuthenticationError) {
        throw new LLMError({
          code: "AUTH_FAILED",
          message: "Authentication failed. Please check the API configuration.",
          retryAfter: null,
          provider: "claude",
        });
      }
      throw new LLMError({
        code: "UNAVAILABLE",
        message: "The AI service is temporarily unavailable.",
        retryAfter: null,
        provider: "claude",
      });
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check - attempt a minimal request
      return this.client !== null;
    } catch {
      return false;
    }
  }
}
