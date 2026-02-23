export interface LLMRequest {
  prompt: string;
  systemMessage: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    stopSequences?: string[];
  };
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
  finishReason: string;
}

export interface LLMProviderError {
  code: "UNAVAILABLE" | "RATE_LIMITED" | "AUTH_FAILED" | "INVALID_REQUEST" | "DPA_INACTIVE";
  message: string;
  retryAfter: number | null;
  provider: string;
}

export interface LLMProvider {
  providerKey: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
}

export interface LLMProviderConfig {
  providerKey: string;
  displayName: string;
  apiEndpoint: string;
  credentialRef: string;
  modelId: string;
  maxTokens: number;
  rateLimitRpm: number | null;
  dpaActive: boolean;
  isDefault: boolean;
}

export class LLMError extends Error {
  code: LLMProviderError["code"];
  retryAfter: number | null;
  provider: string;

  constructor(error: LLMProviderError) {
    super(error.message);
    this.name = "LLMError";
    this.code = error.code;
    this.retryAfter = error.retryAfter;
    this.provider = error.provider;
  }
}
