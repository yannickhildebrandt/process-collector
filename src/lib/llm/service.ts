import { LLMProvider, LLMProviderConfig, LLMRequest, LLMResponse, LLMError } from "./types";
import { stripPII } from "./pii-filter";

export class LLMService {
  private providers: Map<string, LLMProvider>;
  private configs: Map<string, LLMProviderConfig>;
  private defaultProviderKey: string | null;

  constructor(providers: LLMProvider[], configs: LLMProviderConfig[]) {
    this.providers = new Map();
    this.configs = new Map();
    this.defaultProviderKey = null;

    for (const provider of providers) {
      this.providers.set(provider.providerKey, provider);
    }

    for (const config of configs) {
      this.configs.set(config.providerKey, config);
      if (config.isDefault) {
        this.defaultProviderKey = config.providerKey;
      }
    }
  }

  async complete(request: LLMRequest, providerOverride?: string): Promise<LLMResponse> {
    // 1. Select provider
    const providerKey = providerOverride ?? this.defaultProviderKey;
    if (!providerKey) {
      throw new LLMError({
        code: "UNAVAILABLE",
        message: "No LLM provider configured. Please contact your administrator.",
        retryAfter: null,
        provider: "none",
      });
    }

    const provider = this.providers.get(providerKey);
    if (!provider) {
      throw new LLMError({
        code: "UNAVAILABLE",
        message: "The requested AI provider is not available.",
        retryAfter: null,
        provider: providerKey,
      });
    }

    // 2. Verify DPA is active
    const config = this.configs.get(providerKey);
    if (!config || !config.dpaActive) {
      throw new LLMError({
        code: "DPA_INACTIVE",
        message: "This service cannot be used until a data processing agreement is in place.",
        retryAfter: null,
        provider: providerKey,
      });
    }

    // 3. Strip PII from prompt content
    const promptResult = stripPII(request.prompt);
    const systemResult = stripPII(request.systemMessage);

    if (promptResult.warnings.length > 0 || systemResult.warnings.length > 0) {
      const allWarnings = [...promptResult.warnings, ...systemResult.warnings];
      for (const warning of allWarnings) {
        console.warn(`[LLMService] PII Warning: ${warning}`);
      }
    }

    const sanitizedRequest: LLMRequest = {
      ...request,
      prompt: promptResult.filteredText,
      systemMessage: systemResult.filteredText,
    };

    // 4. Delegate to provider adapter
    const response = await provider.complete(sanitizedRequest);

    // 5. Return normalized response
    return response;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async checkProviderHealth(providerKey: string): Promise<boolean> {
    const provider = this.providers.get(providerKey);
    if (!provider) return false;
    return provider.isAvailable();
  }
}
