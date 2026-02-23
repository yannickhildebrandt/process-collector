import { describe, it, expect } from "vitest";
import { LLMService } from "@/lib/llm/service";
import { MockAdapter } from "@/lib/llm/adapters/mock";
import { LLMProviderConfig, LLMRequest, LLMError } from "@/lib/llm/types";

const testRequest: LLMRequest = {
  prompt: "Summarize the following process steps: receive order, validate, ship.",
  systemMessage: "You are a business process analyst.",
  options: {
    maxTokens: 1024,
    temperature: 0.3,
  },
};

describe("LLM Provider Swap (SC-003)", () => {
  it("should return a normalized response from mock provider", async () => {
    const mockAdapter = new MockAdapter({ cannedResponse: "Mock response A" });

    const configs: LLMProviderConfig[] = [
      {
        providerKey: "mock",
        displayName: "Mock Provider",
        apiEndpoint: "http://localhost",
        credentialRef: "MOCK_KEY",
        modelId: "mock-v1",
        maxTokens: 4096,
        rateLimitRpm: null,
        dpaActive: true,
        isDefault: true,
      },
    ];

    const service = new LLMService([mockAdapter], configs);
    const response = await service.complete(testRequest);

    expect(response.content).toBe("Mock response A");
    expect(response.provider).toBe("mock");
    expect(response.model).toBe("mock-v1");
    expect(response.usage.promptTokens).toBeGreaterThan(0);
    expect(response.usage.completionTokens).toBeGreaterThan(0);
    expect(response.finishReason).toBe("complete");
  });

  it("should swap providers via configuration without code changes", async () => {
    // First: use mock provider A as default
    const mockA = new MockAdapter({ cannedResponse: "Response from Provider A" });
    const mockB = new MockAdapter({ cannedResponse: "Response from Provider B" });
    // Override providerKey for mockB to simulate a second provider
    (mockB as { providerKey: string }).providerKey = "mock-b";

    const configA: LLMProviderConfig = {
      providerKey: "mock",
      displayName: "Mock A",
      apiEndpoint: "http://localhost",
      credentialRef: "MOCK_KEY_A",
      modelId: "mock-v1",
      maxTokens: 4096,
      rateLimitRpm: null,
      dpaActive: true,
      isDefault: true,
    };

    const configB: LLMProviderConfig = {
      providerKey: "mock-b",
      displayName: "Mock B",
      apiEndpoint: "http://localhost",
      credentialRef: "MOCK_KEY_B",
      modelId: "mock-v1",
      maxTokens: 4096,
      rateLimitRpm: null,
      dpaActive: true,
      isDefault: false,
    };

    // Test with provider A (default)
    const serviceA = new LLMService([mockA, mockB], [configA, configB]);
    const responseA = await serviceA.complete(testRequest);
    expect(responseA.content).toBe("Response from Provider A");

    // Swap default: reconfigure with B as default (zero code changes)
    const swappedConfigA = { ...configA, isDefault: false };
    const swappedConfigB = { ...configB, isDefault: true };

    const serviceB = new LLMService([mockA, mockB], [swappedConfigA, swappedConfigB]);
    const responseB = await serviceB.complete(testRequest);
    expect(responseB.content).toBe("Response from Provider B");

    // Same request, different provider — no code changes required
    expect(responseA.content).not.toBe(responseB.content);
  });

  it("should swap provider via explicit override", async () => {
    const mockA = new MockAdapter({ cannedResponse: "Default response" });
    const mockB = new MockAdapter({ cannedResponse: "Override response" });
    (mockB as { providerKey: string }).providerKey = "mock-b";

    const configs: LLMProviderConfig[] = [
      {
        providerKey: "mock",
        displayName: "Mock A",
        apiEndpoint: "http://localhost",
        credentialRef: "KEY",
        modelId: "mock-v1",
        maxTokens: 4096,
        rateLimitRpm: null,
        dpaActive: true,
        isDefault: true,
      },
      {
        providerKey: "mock-b",
        displayName: "Mock B",
        apiEndpoint: "http://localhost",
        credentialRef: "KEY",
        modelId: "mock-v1",
        maxTokens: 4096,
        rateLimitRpm: null,
        dpaActive: true,
        isDefault: false,
      },
    ];

    const service = new LLMService([mockA, mockB], configs);

    const defaultResponse = await service.complete(testRequest);
    expect(defaultResponse.content).toBe("Default response");

    const overrideResponse = await service.complete(testRequest, "mock-b");
    expect(overrideResponse.content).toBe("Override response");
  });

  it("should enforce DPA gate (refuse if dpaActive=false)", async () => {
    const mockAdapter = new MockAdapter();

    const configs: LLMProviderConfig[] = [
      {
        providerKey: "mock",
        displayName: "Mock Provider",
        apiEndpoint: "http://localhost",
        credentialRef: "KEY",
        modelId: "mock-v1",
        maxTokens: 4096,
        rateLimitRpm: null,
        dpaActive: false, // DPA NOT active
        isDefault: true,
      },
    ];

    const service = new LLMService([mockAdapter], configs);

    await expect(service.complete(testRequest)).rejects.toThrow(LLMError);

    try {
      await service.complete(testRequest);
    } catch (error) {
      expect(error).toBeInstanceOf(LLMError);
      expect((error as LLMError).code).toBe("DPA_INACTIVE");
    }
  });

  it("should strip PII from prompts before sending to provider", async () => {
    let capturedPrompt = "";
    const mockAdapter = new MockAdapter();
    const originalComplete = mockAdapter.complete.bind(mockAdapter);
    mockAdapter.complete = async (req) => {
      capturedPrompt = req.prompt;
      return originalComplete(req);
    };

    const configs: LLMProviderConfig[] = [
      {
        providerKey: "mock",
        displayName: "Mock",
        apiEndpoint: "http://localhost",
        credentialRef: "KEY",
        modelId: "mock-v1",
        maxTokens: 4096,
        rateLimitRpm: null,
        dpaActive: true,
        isDefault: true,
      },
    ];

    const service = new LLMService([mockAdapter], configs);

    const requestWithPII: LLMRequest = {
      prompt: "Contact john@example.com and [PII:NAME:Anna Schmidt] about the process.",
      systemMessage: "You are a helpful assistant.",
    };

    await service.complete(requestWithPII);

    expect(capturedPrompt).not.toContain("john@example.com");
    expect(capturedPrompt).not.toContain("Anna Schmidt");
    expect(capturedPrompt).toContain("[EMAIL_1]");
    expect(capturedPrompt).toContain("[PERSON_1]");
  });
});
