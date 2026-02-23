# LLM Abstraction Layer Contract

**Feature**: 001-platform-foundation
**Date**: 2026-02-23

## Purpose

Define the provider-neutral interface boundary for the LLM
abstraction layer. Business logic interacts ONLY with this
interface — never with provider SDKs directly (Principle V).

## Core Interface

### LLMProvider (adapter interface)

Each LLM provider adapter MUST implement this interface:

```text
LLMProvider:
  providerKey: string        // e.g., "claude", "openai", "mock"

  complete(request: LLMRequest) → LLMResponse
    - Translates the normalized request into provider-specific
      API call
    - Returns normalized response
    - Throws LLMProviderError on failure

  isAvailable() → boolean
    - Health check for the provider
```

### LLMRequest (normalized input)

```text
LLMRequest:
  prompt: string             // User/system prompt text
  systemMessage: string      // System-level instructions
  options:
    maxTokens: number        // Max response tokens
    temperature: number      // 0.0–1.0
    stopSequences: string[]  // Optional stop tokens
```

**Rules**:
- prompt and systemMessage MUST be provider-neutral (no
  provider-specific XML tags, tool schemas, or message formats).
- Prompt templates MUST NOT contain PII (FR-014). The service
  layer strips PII before constructing the LLMRequest.

### LLMResponse (normalized output)

```text
LLMResponse:
  content: string            // Generated text
  provider: string           // Which provider was used
  model: string              // Which model was used
  usage:
    promptTokens: number     // Input token count
    completionTokens: number // Output token count
  finishReason: string       // "complete", "max_tokens", "stop"
```

### LLMProviderError

```text
LLMProviderError:
  code: string               // "UNAVAILABLE", "RATE_LIMITED",
                             // "AUTH_FAILED", "INVALID_REQUEST"
  message: string            // Human-readable, no provider
                             // internals exposed
  retryAfter: number | null  // Seconds until retry (if rate limited)
  provider: string           // Which provider failed
```

## Service Layer (orchestrator)

```text
LLMService:
  constructor(providers: LLMProvider[], config: LLMProviderConfig[])

  complete(request: LLMRequest) → LLMResponse
    1. Select provider (default or explicit override)
    2. Verify DPA is active (FR-015) — refuse if not
    3. Strip PII from prompt content (FR-014)
    4. Delegate to provider adapter
    5. Normalize response
    6. Return to caller

    On error: catch provider-specific errors, wrap in
    LLMProviderError, return user-friendly message
```

## Required Adapters (Foundation)

1. **ClaudeAdapter**: Wraps the Anthropic Claude API SDK.
   Maps LLMRequest → Claude Messages API format.
   Maps Claude response → LLMResponse.

2. **MockAdapter**: Returns configurable canned responses.
   Used for testing provider-swap capability (SC-003)
   and development without API keys.

## PII Stripping Rules (FR-014)

The service layer MUST process prompts before sending:

- Remove email addresses (regex pattern)
- Remove personal names if tagged in the input
  (application-level: callers mark PII segments)
- Replace with anonymized placeholders:
  `[PERSON_1]`, `[EMAIL_1]`, etc.
- Log a warning if potential PII patterns are detected
  in prompts not explicitly marked

## DPA Gate (FR-015)

Before every LLM call:
1. Look up LLMProviderConfig for the selected provider
2. Check `dpaActive === true`
3. If false: reject with LLMProviderError code "DPA_INACTIVE"
4. Never send data to a provider without active DPA
