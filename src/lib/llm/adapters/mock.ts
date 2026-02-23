import { LLMProvider, LLMRequest, LLMResponse } from "../types";

export class MockAdapter implements LLMProvider {
  providerKey = "mock";

  private cannedResponse: string;
  private available: boolean;

  constructor(options?: { cannedResponse?: string; available?: boolean }) {
    this.cannedResponse = options?.cannedResponse ?? "This is a mock response from the LLM abstraction layer.";
    this.available = options?.available ?? true;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Simulate a small delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const content = this.cannedResponse;
    const promptTokens = Math.ceil(request.prompt.length / 4);
    const completionTokens = Math.ceil(content.length / 4);

    return {
      content,
      provider: "mock",
      model: "mock-v1",
      usage: {
        promptTokens,
        completionTokens,
      },
      finishReason: "complete",
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }
}
