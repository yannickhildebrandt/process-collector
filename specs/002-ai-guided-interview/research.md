# Research: AI-Guided Interview

**Feature**: 002-ai-guided-interview
**Date**: 2026-02-23

## R1: Conversation Context Management for LLM

**Decision**: Send full conversation history with each request, with a token budget guard as safety net.

**Rationale**: Claude's context window (~200K tokens) far exceeds what a structured process interview will produce. A typical 30-50 exchange interview uses 5-15K tokens. Full history preserves maximum context fidelity and is the simplest approach. A token counting guard activates a summarization fallback only if approaching the limit (threshold: 150K tokens).

**Alternatives considered**:
- Sliding window (last N messages): Loses early context, critical for interviews where the trigger/overview is discussed first.
- Summarize older messages: Adds unnecessary complexity for bounded interviews.
- RAG over conversation: Over-engineered for structured, time-bounded interviews.

## R2: Structured Output from LLM (Process Summary)

**Decision**: Use tool_use (function calling) with a defined JSON schema, validated by zod on the server.

**Rationale**: tool_use is purpose-built for structured output. The LLM returns JSON conforming to a defined schema, separating structure definition from content generation. Combined with `tool_choice: { type: "tool" }` to force structured output, and server-side zod validation as defense-in-depth, this is the most reliable approach.

**Alternatives considered**:
- Prompt engineering with JSON examples: Fragile, may produce malformed JSON.
- XML tags in prompts: Still requires parsing, no schema validation guarantee.
- The Vercel AI SDK's `generateObject` function wraps tool_use with zod schema integration natively.

## R3: BPMN 2.0 XML Generation

**Decision**: Two-stage approach — LLM generates structured process JSON, deterministic code converts to BPMN 2.0 XML.

**Rationale**: LLMs cannot reliably generate valid BPMN 2.0 XML directly. BPMN XML requires strict namespace handling, consistent ID cross-references between process elements and diagram elements, and precise coordinate geometry for layout. The two-stage approach plays to each technology's strengths: LLM extracts process structure as JSON, then bpmn-moddle + bpmn-auto-layout produce valid XML.

**Implementation stack**: Interview answers → LLM (tool_use) → Process JSON → bpmn-moddle → BPMN 2.0 XML (with auto-layout for diagram coordinates)

**Validation**: The bpmn-js viewer (already in the project) serves as validation — if it renders without errors, the XML is valid.

**Alternatives considered**:
- LLM generates BPMN XML directly: Unreliable, broken IDs and layouts.
- External BPMN modeling API: Unnecessary external dependency.

## R4: Streaming vs Request-Response for Chat UI

**Decision**: Use streaming (SSE) for the chat interface via the Vercel AI SDK (`ai` package). Summary panel updates via a separate structured call after each streamed response completes.

**Rationale**: Users expect character-by-character output in chat interfaces. Without streaming, Claude's 2-8 second response time creates unacceptable dead periods. The Vercel AI SDK provides `useChat` (client) and `streamText` (server), handling SSE, message state, and error recovery out of the box for Next.js.

**Architecture pattern**:
1. User sends message → API streams chat response (SSE)
2. On stream completion → separate tool_use call extracts/updates structured process summary
3. Summary panel refreshes via React state

**Alternatives considered**:
- Request-response: Poor UX, long waits.
- WebSockets: Over-engineered for this use case.

## R5: Vercel AI SDK vs Existing LLMService

**Decision**: Use the Vercel AI SDK for the interview feature (streaming chat, structured output). Keep the existing LLMService for backward compatibility with non-interactive LLM calls.

**Rationale**: The Vercel AI SDK is LLM-agnostic by design (supports `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, etc.), which aligns with Principle V. It handles streaming, tool_use, and multi-turn conversations natively. Provider configuration from the existing LLMProviderConfig database table can configure the AI SDK provider at runtime, maintaining configuration-as-data (Principle IV).

**PII handling**: PII stripping is applied as middleware in the API route before messages reach the AI SDK, preserving the existing pii-filter functionality.

## R6: New Dependencies Required

| Package | Purpose | License |
|---------|---------|---------|
| `ai` | Vercel AI SDK core (streaming, useChat) | Apache-2.0 |
| `@ai-sdk/anthropic` | Claude provider for AI SDK | Apache-2.0 |
| `bpmn-moddle` | Programmatic BPMN 2.0 XML creation | MIT |
| `bpmn-auto-layout` | Auto-layout for BPMN diagram coordinates | MIT |
| `zod` | Schema validation for structured LLM output | MIT |
