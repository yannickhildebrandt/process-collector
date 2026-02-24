# Tasks: Interview Assistant Optimization

**Input**: Design documents from `/specs/008-interview-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. US1 (batched/incremental summary extraction) is the MVP. US2 (conversation windowing) and US4 (chat polish) are equal P2. US3 (config caching) is P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Schema Migration)

**Purpose**: Add the `lastSummarizedIndex` field needed for batched extraction

- [X] T001 Add `lastSummarizedIndex Int @default(-1)` field to the InterviewSession model in prisma/schema.prisma and run `npx prisma migrate dev --name add-last-summarized-index`

**Checkpoint**: Migration applied, InterviewSession has the new field

---

## Phase 2: Foundational (Summary Extractor Enhancement)

**Purpose**: Update the summary extractor to support incremental extraction (new messages only + existing summary)

- [X] T002 Update the `extractSummary` function in src/lib/interview/summary-extractor.ts to accept an optional `startFromIndex` parameter. When provided, only serialize messages with index >= startFromIndex into the conversation text. The existing summary update-mode logic is already in place — this just reduces the input messages.

**Checkpoint**: Summary extractor can operate on a subset of messages

---

## Phase 3: User Story 1 — Batched & Incremental Summary Extraction (Priority: P1) 🎯 MVP

**Goal**: Reduce summary extraction calls from every message to every 3 messages, and extract incrementally (only new messages + existing summary).

**Independent Test**: Conduct a 10-message interview. Summary extraction should run ~3-4 times (not 10). Summary should contain all information from all messages.

### Implementation for User Story 1

- [X] T003 [US1] Update the chat endpoint in src/app/api/projects/[projectId]/interviews/[interviewId]/chat/route.ts: in the `onFinish` callback, check if `(nextOrderIndex + 1 - interview.lastSummarizedIndex) >= 3` before triggering summary extraction. When extracting, filter `allMessages` to only include messages with index > `interview.lastSummarizedIndex`, pass the existing summary, and update `lastSummarizedIndex` in the DB alongside the new summary.
- [X] T004 [US1] Update the summary request endpoint (or the confirm/request-summary action) to always trigger extraction regardless of batch position, passing only new messages since `lastSummarizedIndex`, and update `lastSummarizedIndex` after extraction.
- [X] T005 [US1] Add retry logic to the summary extraction in the chat endpoint `onFinish`: if extraction fails, retry once. If the retry also fails, log the error and continue without blocking.

**Checkpoint**: Summary extraction batched every 3 messages. Incremental extraction uses only new messages. Manual "Request Summary" bypasses batch interval.

---

## Phase 4: User Story 2 — Conversation Windowing (Priority: P2)

**Goal**: Limit conversation history sent to AI for chat responses to the most recent 15 messages, supplemented by the current summary in the system prompt.

**Independent Test**: Conduct a 25-message interview. AI should reference early process details correctly (via summary). Response latency at message 20 should be similar to message 5.

**Depends on**: US1 (needs summary to be populated for windowing to work safely)

### Implementation for User Story 2

- [X] T006 [US2] Update `buildSystemPrompt` in src/lib/interview/prompt-builder.ts to accept an optional `currentSummary` parameter (ProcessSummary type). When provided, append a "CURRENT PROCESS SUMMARY" section to the system prompt that serializes the summary as structured context (process name, trigger, steps, roles, systems, metrics).
- [X] T007 [US2] Update the chat endpoint in src/app/api/projects/[projectId]/interviews/[interviewId]/chat/route.ts: after building `conversationHistory`, if the array has more than 15 messages, slice to the last 15. Pass `interview.currentSummaryJson` to `buildSystemPrompt` as the `currentSummary` parameter so the AI has full process context even with windowed history.

**Checkpoint**: Long interviews use windowed history + summary context. Short interviews send all messages. AI quality preserved.

---

## Phase 5: User Story 4 — Chat Polish with Rich Formatting (Priority: P2)

**Goal**: AI messages render with rich markdown formatting (progressive during streaming) and the chat has visual polish (icons, better bubble styling).

**Independent Test**: Start an interview. AI messages should show formatted lists, bold text, and icons. User messages should be plain text in styled bubbles.

### Implementation for User Story 4

- [X] T008 [P] [US4] Update the system prompt in src/lib/interview/prompt-builder.ts: add a FORMATTING section after the BEHAVIOR section instructing the AI to use **bold** for key terms, numbered lists for follow-up questions, and bullet points for recaps/summaries.
- [X] T009 [US4] Rewrite src/components/interview/message-bubble.tsx: for assistant messages, render content using ReactMarkdown with remarkGfm plugin and prose prose-sm styling (same pattern as src/components/processes/markdown-viewer.tsx). For user messages, keep plain text with whitespace-pre-wrap. Add Bot icon (lucide) for AI messages and User icon for employee messages. Improve bubble layout with avatar icons aligned to the top-left/right of each bubble.

**Checkpoint**: AI messages render rich markdown (bold, lists, headings). User messages are plain text. Both have icons. Markdown renders progressively during streaming.

---

## Phase 6: User Story 3 — Config Caching (Priority: P3)

**Goal**: Cache project configuration and compiled system prompt in memory to avoid redundant DB queries per message.

**Independent Test**: Conduct a 10-message interview. Project config fetched from DB only once.

**Depends on**: US2 (system prompt changes in US2 must be in place before caching the compiled prompt)

### Implementation for User Story 3

- [X] T010 [US3] Create src/lib/interview/config-cache.ts: implement a Map-based in-memory cache keyed by projectId. Export `getOrBuildConfig(projectId)` that returns cached config + compiled system prompt if fresh (TTL 5 min), or queries DB and rebuilds if stale/missing. Export `invalidateConfig(projectId)` to clear a cache entry.
- [X] T011 [US3] Update the chat endpoint in src/app/api/projects/[projectId]/interviews/[interviewId]/chat/route.ts: replace the inline project config loading and system prompt building with a call to `getOrBuildConfig(projectId)` from the config cache.
- [X] T012 [US3] Update the configuration save endpoint in src/app/api/projects/[projectId]/configuration/route.ts: after saving configuration, call `invalidateConfig(projectId)` to clear the cache.

**Checkpoint**: Config loaded from DB once per session. Cache invalidated on config changes. Server restart rebuilds cache on first message.

---

## Phase 7: Polish & Validation

**Purpose**: Final verification

- [X] T013 Run linting with `npm run lint` and fix any errors introduced by the new code
- [X] T014 Validate implementation against quickstart.md testing checklist (P1 batching, P2a windowing, P2b markdown, P3 caching, edge cases)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — apply migration
- **Foundational (Phase 2)**: Depends on Phase 1 (needs schema updated)
- **US1 (Phase 3)**: Depends on Phase 2 (needs incremental extractor)
- **US2 (Phase 4)**: Depends on US1 (needs summary populated for windowing)
- **US4 (Phase 5)**: Independent of backend stories — can run after Phase 2
- **US3 (Phase 6)**: Depends on US2 (caches the system prompt that includes summary injection)
- **Polish (Phase 7)**: Depends on all user stories

### Parallel Opportunities

```text
# Phase 1: Sequential
T001 (migration)

# Phase 2: Sequential
T002 (extractor update)

# Phase 3: Sequential (same file)
T003 → T004 → T005

# Phase 4 + Phase 5: Can run in parallel (different files)
(T006 → T007) || (T008 || T009)

# Phase 6: Sequential
T010 → T011 → T012

# Phase 7: Sequential
T013 → T014
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Migration (T001)
2. Complete Phase 2: Extractor enhancement (T002)
3. Complete Phase 3: Batched extraction in chat route (T003–T005)
4. **STOP and VALIDATE**: Test batching with a 10-message interview
5. Proceed to US2/US4 for windowing and chat polish

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 batched extraction → Core cost savings delivered
3. US2 windowing + US4 chat polish → UX + latency improvements
4. US3 config caching → Final optimization
5. Polish → Lint clean, checklist validated

---

## Notes

- The summary extractor already supports update mode (existing summary as context). The optimization is sending fewer messages, not changing the extraction logic.
- `react-markdown` and `remark-gfm` are already installed in the project — no new dependencies needed.
- The config cache is intentionally simple (in-memory Map with TTL). No Redis or external cache needed for a single-server deployment.
- Conversation windowing depends on the summary being populated. For the first few messages (before any extraction), all messages are sent anyway (below window threshold).
- The `lastSummarizedIndex` field defaults to -1, meaning "no extraction performed yet". The batch check `(count - (-1)) >= 3` correctly triggers on message 3.
