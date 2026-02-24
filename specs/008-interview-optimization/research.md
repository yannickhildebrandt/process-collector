# Research: Interview Assistant Optimization

**Feature**: 008-interview-optimization | **Date**: 2026-02-24

## R1: Summary Extraction Batching Strategy

**Decision**: Batch summary extraction every 3 messages using a `lastSummarizedIndex` counter on InterviewSession. Extract immediately on explicit "Request Summary" action.

**Rationale**: The current system calls `extractSummary()` in the `onFinish` callback of every streamed response. For a 10-message interview, this means 10 extraction calls, each re-serializing the full conversation. By tracking `lastSummarizedIndex` in the database, we can skip extraction for messages that fall between batch boundaries. The batch size of 3 balances summary freshness against cost — the summary panel updates roughly every 2 exchanges.

**Alternatives considered**:
- Time-based debounce (extract after 30s idle): Rejected — unpredictable behavior, may never trigger if user types steadily
- Extract only on explicit request: Rejected — summary panel would be empty/stale during most of the interview
- Message count threshold of 5: Considered — slightly too infrequent for a good summary panel experience

## R2: Incremental Summary Extraction

**Decision**: Pass only new messages (since `lastSummarizedIndex`) plus the existing summary JSON to the extraction AI call. The extraction prompt already supports update mode when an existing summary is provided.

**Rationale**: The current `extractSummary()` already has two code paths: fresh extraction and update mode. The update mode already receives `existingSummary` and serializes it as context. The optimization is to also reduce the conversation text to only new messages rather than the full history. This directly reduces input tokens proportionally to the interview length.

**Alternatives considered**:
- Delta extraction (only output changed fields): Rejected — too complex, risk of losing context
- Full re-extraction every N messages: Rejected — loses the primary token-saving benefit

## R3: Conversation Windowing for Chat Responses

**Decision**: Send the most recent 15 messages to the AI for chat responses, supplemented by the current structured summary injected into the system prompt. When total messages < 15, send all.

**Rationale**: The structured ProcessSummary contains all captured process knowledge (steps, roles, systems, metrics, trigger). Older messages are conversational context that the summary has already absorbed. A window of 15 messages (roughly 7-8 exchanges) provides enough conversational continuity for the AI to maintain flow and reference recent discussion points, while the summary provides the full process picture.

**Alternatives considered**:
- Window of 10: Too small — risk of losing conversational flow, AI may repeat questions
- Window of 20: Diminishing returns — most of the token savings come from the first 15-message cutoff
- Sliding window with overlap: Rejected — unnecessary complexity

## R4: Project Configuration Caching

**Decision**: Use a server-side in-memory Map keyed by `projectId` with TTL-based invalidation. Cache the compiled system prompt alongside the config. Invalidate on project configuration updates via the existing save endpoint.

**Rationale**: Project configuration (industry, categories, terminology) does not change during an interview. The chat endpoint currently queries the full project + configuration relation for every message. Caching eliminates the DB join for the second message onward. A simple Map with TTL (e.g., 5 minutes) is sufficient since this is a single-server deployment. The existing configuration save endpoint can call a cache invalidation function.

**Alternatives considered**:
- Redis cache: Overengineered for a single-server Next.js deployment
- React Query on client: Doesn't help the server-side prompt building
- LRU cache with size limit: Unnecessary — the number of active projects is small

## R5: Markdown Rendering in Chat Messages

**Decision**: Use `react-markdown` with `remark-gfm` (both already installed) to render AI messages. Apply it inside `MessageBubble` only for assistant messages. Use Tailwind's `prose` classes for typography (same pattern as the existing `MarkdownViewer` component). Render progressively during streaming.

**Rationale**: `react-markdown` is already a project dependency, and `MarkdownViewer` in `src/components/processes/markdown-viewer.tsx` already demonstrates the exact pattern: `<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>` wrapped in `prose prose-sm`. The streaming case works naturally because React re-renders the component as the content string grows, and react-markdown parses whatever partial markdown is available.

**Alternatives considered**:
- Custom markdown parser: Rejected — reinventing the wheel when react-markdown is already installed
- `marked` + `dangerouslySetInnerHTML`: Rejected — XSS risk, React anti-pattern
- Render markdown only after stream completes: Rejected — user sees raw syntax for 2-5 seconds during streaming

## R6: Chat Visual Polish

**Decision**: Enhance `MessageBubble` with: (1) AI avatar icon (Bot from lucide-react), (2) user avatar icon (User from lucide-react), (3) improved bubble styling with better alignment and spacing, (4) markdown rendering only for assistant messages. Keep the existing color scheme (primary for user, muted for AI) as it aligns with the brand design.

**Rationale**: The current MessageBubble is minimal — plain text in a colored box with a text label ("You" / "AI Assistant"). Adding small avatar icons and tightening the typography provides a professional chat feel without requiring significant redesign. The existing color scheme from feature 005 (brand polish) should be preserved.

**Alternatives considered**:
- Full redesign with custom avatars/images: Overengineered — icons are sufficient
- Chat bubbles with tails/arrows: Rejected — adds visual complexity, modern chat UIs use flat bubbles

## R7: System Prompt Formatting Instructions

**Decision**: Add a short formatting instruction section to the system prompt in `buildSystemPrompt()` telling the AI to use markdown: bold for key terms, numbered lists for follow-up questions, bullet points for recaps. Keep the instruction concise (3-4 lines) to minimize prompt token overhead.

**Rationale**: Without explicit formatting instructions, Claude's responses are inconsistent — sometimes using markdown, sometimes not. A brief instruction ensures consistent, scannable responses that pair well with the new markdown rendering. The added prompt tokens (~50) are negligible compared to the savings from batching and windowing.

**Alternatives considered**:
- Detailed formatting template with examples: Rejected — too many additional tokens, overly prescriptive
- No prompt changes, rely on rendering only: Rejected — AI won't consistently produce markdown without instruction
