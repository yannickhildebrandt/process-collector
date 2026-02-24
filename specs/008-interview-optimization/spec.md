# Feature Specification: Interview Assistant Optimization

**Feature Branch**: `008-interview-optimization`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "optimize the interview assistant"

## Clarifications

### Session 2026-02-24

- Q: What UX improvements should be included in the "formatting of messages" scope? → A: Both rich markdown rendering in AI messages AND visual chat polish (bubbles, icons, spacing)
- Q: Should the AI be instructed to use structured formatting in its responses? → A: Yes, update the system prompt to instruct the AI to use markdown formatting (bold, lists, numbered steps)
- Q: Should markdown render progressively during streaming or only after completion? → A: Progressive — render markdown as tokens stream in (real-time formatted text)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reduce AI Token Consumption per Interview (Priority: P1)

As a platform operator, I want the interview assistant to use significantly fewer AI tokens per interview session so that operating costs are lower and interviews complete faster.

Currently, the system extracts a full process summary after every single message by re-serializing the entire conversation history. For a 10-message interview, this means 10 summary extraction calls, each re-processing all previous messages. This is the largest source of unnecessary token usage.

The system should batch summary extractions so they only happen every few messages (e.g., every 3 messages or when explicitly requested), and when extracting, it should only send recent messages plus the existing summary as context rather than the full conversation history.

**Why this priority**: Token consumption directly drives operating cost. A 10-message interview currently triggers ~15,000 tokens just for summary extraction. Batching and incremental updates can reduce this by 60-70%, making the platform economically viable at scale.

**Independent Test**: Conduct a 10-message interview and compare the number of AI extraction calls and total tokens used before and after the optimization. The summary quality should remain equivalent while the number of extraction calls drops from 10 to 3-4.

**Acceptance Scenarios**:

1. **Given** an in-progress interview with 5 messages, **When** the employee sends messages 6, 7, and 8, **Then** summary extraction runs once after message 8 (not three times), and the summary includes information from all 8 messages.
2. **Given** an in-progress interview with 12 messages and an existing summary, **When** summary extraction runs, **Then** only the messages since the last extraction are sent to the AI along with the current summary, not the full conversation history.
3. **Given** an in-progress interview where the employee explicitly clicks "Request Summary", **Then** summary extraction runs immediately regardless of the batch interval.

---

### User Story 2 - Conversation Windowing for Long Interviews (Priority: P2)

As an employee conducting a long interview (20+ messages), I want the AI assistant to remain responsive and contextually accurate without degrading in quality, even as the conversation grows.

Currently, the full conversation history is sent to the AI for every response. As interviews grow longer, this increases latency and token costs linearly. The system should send only the most recent messages (a "window") along with the structured summary as persistent context, so the AI has full process knowledge without re-reading every old message.

**Why this priority**: Long interviews are where the platform delivers the most value (complex processes), but they are also where performance degrades most. Windowing keeps response times consistent regardless of interview length.

**Independent Test**: Conduct a 25-message interview. Verify that AI response quality remains high (the assistant references earlier process details correctly via the summary context) and that response latency does not noticeably increase after message 15 compared to message 5.

**Acceptance Scenarios**:

1. **Given** an interview with 25 messages and a current summary, **When** the employee sends message 26, **Then** the AI receives the system prompt, the current summary, and only the most recent messages (not all 26), and still provides a contextually relevant response.
2. **Given** a windowed conversation where early messages mentioned a specific role, **When** the employee asks a follow-up about that role, **Then** the AI answers correctly because the role is captured in the summary context.
3. **Given** a short interview with fewer messages than the window size, **When** the employee sends a message, **Then** all messages are sent as usual (no unnecessary truncation).

---

### User Story 3 - Cache Immutable Context per Session (Priority: P3)

As a platform operator, I want the system to avoid redundant work by caching data that doesn't change during an interview session, such as the project configuration and the compiled system prompt.

Currently, every message triggers a fresh database query for project configuration (industry, categories, terminology) and rebuilds the system prompt from scratch. Since project configuration doesn't change during an interview, this work is redundant.

**Why this priority**: While the per-message savings are smaller than US1/US2, this optimization compounds across all interviews and eliminates unnecessary database load and prompt construction overhead.

**Independent Test**: Conduct a 10-message interview and verify that the project configuration is fetched from the database only once (on the first message or session start), not 10 times.

**Acceptance Scenarios**:

1. **Given** an interview session, **When** the employee sends 5 messages in sequence, **Then** the project configuration is loaded from the database once and reused for all 5 messages.
2. **Given** a cached system prompt, **When** the project configuration is updated by a consultant in a separate session, **Then** the next interview message picks up the new configuration (cache is invalidated on project config changes).
3. **Given** a server restart, **When** an employee resumes an interview, **Then** the system prompt is rebuilt from the database on the first message and cached for subsequent messages.

---

### User Story 4 - Polished Chat Experience with Rich Formatting (Priority: P2)

As an employee conducting an interview, I want the AI assistant's messages to display with rich formatting (headings, bullet lists, bold text, numbered steps) and the overall chat to feel visually polished (clear distinction between my messages and the AI's, proper spacing, icons), so the interview feels professional and the AI's guidance is easy to scan and follow.

Currently, AI messages display as plain text without any formatting. When the AI produces structured guidance — such as a list of follow-up questions, a recap of steps, or a summary of what was captured — it appears as a wall of text that is hard to parse visually.

**Why this priority**: Equal priority with US2. While backend optimizations reduce cost, the chat experience is what employees interact with directly. Rich formatting makes the AI's structured output immediately scannable, reducing cognitive load and improving the quality of employee responses.

**Independent Test**: Start an interview where the AI asks multiple questions or lists process steps. Verify that bullet lists, numbered lists, bold text, and headings render correctly in the AI's messages. Verify that user and AI messages are visually distinct with appropriate icons and spacing.

**Acceptance Scenarios**:

1. **Given** an AI response containing markdown (bullet lists, bold text, numbered steps), **When** the message is displayed in the chat, **Then** the markdown renders as formatted rich text (not raw markdown syntax).
2. **Given** the interview chat, **When** viewing messages, **Then** AI messages and employee messages are visually distinct with different background colors, alignment, and an icon or avatar for the AI.
3. **Given** a long AI response with multiple sections, **When** the employee reads the message, **Then** sections are clearly separated with appropriate spacing, and lists are properly indented.
4. **Given** the employee's own messages, **When** displayed in the chat, **Then** they appear as plain text (no markdown rendering needed) with a consistent, clean bubble style.

---

### Edge Cases

- What happens when summary extraction fails during a batched run? The system should retry once, and if it still fails, continue the interview without blocking the employee. The extraction should be attempted again on the next batch trigger.
- What happens when the conversation window excludes messages that contained critical process information? The summary serves as persistent memory, so as long as the summary is current, windowed-out messages should not cause information loss.
- What happens when an interview is resumed after a long pause (stale session)? The system should rebuild context from the database rather than relying on any in-memory cache.
- What happens when the employee sends messages very rapidly (faster than the batch interval)? The system should queue messages normally and trigger extraction at the next batch boundary, not skip messages.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST batch summary extractions so they run at most once every 3 messages rather than after every message.
- **FR-002**: System MUST allow immediate summary extraction when the employee explicitly requests a summary, bypassing the batch interval.
- **FR-003**: System MUST perform incremental summary extraction by sending only the messages since the last extraction plus the existing summary, rather than the full conversation history.
- **FR-004**: System MUST track which messages have already been processed for summary extraction to avoid re-processing.
- **FR-005**: System MUST limit the conversation history sent to the AI for chat responses to a configurable window of recent messages, supplemented by the current structured summary as context.
- **FR-006**: System MUST send the full conversation when the total message count is below the window threshold.
- **FR-007**: System MUST inject the current structured summary into the system prompt so the AI has full process knowledge even when older messages are windowed out.
- **FR-008**: System MUST cache the project configuration in memory for the duration of an interview session to avoid redundant database queries.
- **FR-009**: System MUST invalidate the cached project configuration when the project settings are updated.
- **FR-010**: System MUST handle summary extraction failures gracefully by retrying once and continuing the interview if the retry also fails.
- **FR-011**: System MUST render markdown formatting in AI messages (headings, bold, italic, bullet lists, numbered lists, inline code) as rich text in the chat interface.
- **FR-012**: System MUST visually distinguish AI messages from employee messages with different styling (background color, alignment, and an AI icon or avatar).
- **FR-013**: Employee messages MUST display as plain text with a clean bubble style (no markdown rendering).
- **FR-014**: System MUST ensure proper spacing and indentation for multi-section AI responses so they are easy to scan.
- **FR-015**: The AI's system prompt MUST instruct the assistant to use markdown formatting in its responses — bold for key terms, numbered lists for follow-up questions, and bullet points for recaps or summaries.
- **FR-016**: System MUST render markdown progressively as AI response tokens stream in, so the employee sees formatted rich text building up in real-time rather than raw markdown syntax.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A 10-message interview triggers no more than 4 summary extraction calls (down from 10), reducing summary-related AI usage by at least 50%.
- **SC-002**: Total AI token consumption per 10-message interview decreases by at least 40% compared to the current implementation.
- **SC-003**: AI response latency for message 20 of an interview is within 20% of the latency for message 5 (no significant degradation for long interviews).
- **SC-004**: Summary quality (completeness of extracted steps, roles, systems, metrics) remains equivalent after optimization — no regression in captured process information.
- **SC-005**: The interview experience remains seamless for employees — no visible delays, errors, or gaps in the AI's contextual understanding.
- **SC-006**: AI messages containing markdown (lists, bold, headings) render as formatted rich text — no raw markdown syntax visible to the employee.
- **SC-007**: Employees can visually distinguish their own messages from AI messages at a glance without reading the content.

## Assumptions

- The batch interval of 3 messages is a reasonable default; it can be adjusted based on production usage data.
- The conversation window size of 15 recent messages provides sufficient immediate context alongside the structured summary.
- Project configuration changes during an active interview are rare edge cases and a slight delay in picking up changes is acceptable.
- The structured summary is reliable enough to serve as the sole source of historical context for windowed-out messages.
