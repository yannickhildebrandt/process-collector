# Tasks: AI-Guided Interview

**Input**: Design documents from `/specs/002-ai-guided-interview/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Install new dependencies and extend the database schema for interviews.

- [x] T001 Install new dependencies: `ai`, `@ai-sdk/anthropic`, `bpmn-moddle`, `bpmn-auto-layout`, `zod`
- [x] T002 Add InterviewSession and InterviewMessage models to prisma/schema.prisma with enums (InterviewStatus: IN_PROGRESS, SUMMARY_REVIEW, COMPLETED, STALE; MessageRole: ASSISTANT, USER), fields per data-model.md, and add interviewSessionId back-reference to ProcessEntry
- [x] T003 Run Prisma migration: `npx prisma migrate dev --name add-interview-tables`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core interview infrastructure that MUST be complete before ANY user story can be implemented.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create AI SDK provider factory in src/lib/llm/ai-sdk-provider.ts that reads LLMProviderConfig from database and returns a configured Vercel AI SDK provider (anthropic or mock). Must support runtime provider selection from DB config.
- [x] T005 [P] Create process summary zod schema in src/lib/interview/schemas.ts matching the Process Summary JSON Schema from data-model.md (processName, trigger, steps, roles, systems, metrics)
- [x] T006 [P] Create prompt builder in src/lib/interview/prompt-builder.ts that constructs the system prompt from project configuration (industry, sector, categories, custom terminology, language). Template per prompt-contracts.md.
- [x] T007 [P] Create summary extractor in src/lib/interview/summary-extractor.ts that uses Vercel AI SDK `generateObject` with the zod schema to extract/update the structured process summary from conversation history
- [x] T008 [P] Create PII middleware helper in src/lib/interview/pii-middleware.ts that wraps the existing pii-filter.ts to strip PII from user messages before they are sent to the AI SDK
- [x] T009 [P] Add interview i18n strings to src/i18n/messages/en.json and src/i18n/messages/de.json (interview.startNew, interview.selectCategory, interview.enterTitle, interview.resume, interview.inProgress, interview.summaryReview, interview.completed, interview.stale, interview.confirm, interview.discard, interview.sendMessage, interview.placeholder, interview.aiGreeting, interview.aiUnavailable, interview.summaryPanel, interview.recap, interview.noInterviews, interview.backToDashboard, interview.requestSummary, interview.confirmSummary, interview.processCreated)
- [x] T010 Update prisma/seed.ts to add a sample in-progress InterviewSession with a few InterviewMessages for the existing Acme Corp project (for testing dashboard display)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Employee Completes a Process Interview (Priority: P1) MVP

**Goal**: An employee can start an interview, converse with the AI, see a live summary, review the final summary, and confirm it.

**Independent Test**: Employee starts an interview, answers AI questions, sees live summary updates, reviews the final summary, and confirms. The interview state is persisted throughout.

### Implementation for User Story 1

- [x] T011 [US1] Create POST /api/projects/[projectId]/interviews endpoint in src/app/api/projects/[projectId]/interviews/route.ts — creates InterviewSession (validates employee is project member, processCategory exists in project config, title required)
- [x] T012 [US1] Create GET /api/projects/[projectId]/interviews endpoint in src/app/api/projects/[projectId]/interviews/route.ts — lists interviews for current employee in project (id, processCategory, title, status, messageCount, updatedAt)
- [x] T013 [US1] Create GET /api/projects/[projectId]/interviews/[interviewId] endpoint in src/app/api/projects/[projectId]/interviews/[interviewId]/route.ts — returns full interview detail with messages and currentSummaryJson
- [x] T014 [US1] Create DELETE /api/projects/[projectId]/interviews/[interviewId] endpoint in src/app/api/projects/[projectId]/interviews/[interviewId]/route.ts — discards non-completed interviews
- [x] T015 [US1] Create POST streaming chat endpoint in src/app/api/projects/[projectId]/interviews/[interviewId]/chat/route.ts — accepts user message, persists it as InterviewMessage, streams AI response via Vercel AI SDK `streamText`, persists AI response on completion, then triggers summary extractor to update currentSummaryJson on InterviewSession
- [x] T016 [US1] Create POST /api/projects/[projectId]/interviews/[interviewId]/request-summary endpoint in src/app/api/projects/[projectId]/interviews/[interviewId]/request-summary/route.ts — transitions interview to SUMMARY_REVIEW status, generates final summary via summary extractor
- [x] T017 [US1] Create new interview dialog component in src/components/interview/new-interview-dialog.tsx — shows process categories from project config, accepts title input, calls POST /interviews to create session, redirects to interview page
- [x] T018 [US1] Create message bubble component in src/components/interview/message-bubble.tsx — renders a single chat message with sender indicator (AI/Employee), content, and timestamp
- [x] T019 [US1] Create chat interface component in src/components/interview/chat-interface.tsx — uses Vercel AI SDK `useChat` hook pointed at the streaming endpoint, renders message list with message bubbles, input field, send button, loading indicator during streaming
- [x] T020 [US1] Create summary panel component in src/components/interview/summary-panel.tsx — displays currentSummaryJson as a structured view (trigger, steps, roles, systems, decisions, metrics), refreshes after each message exchange
- [x] T021 [US1] Create interview page in src/app/[locale]/interview/[interviewId]/page.tsx — two-column layout: chat interface (left/main) and summary panel (right/sidebar). Loads interview data, passes to child components. Shows "Request Summary" button when AI indicates readiness. Shows confirm/edit UI when in SUMMARY_REVIEW status.
- [x] T022 [US1] Update dashboard page src/app/[locale]/dashboard/page.tsx — enable "Document a new process" button to open new interview dialog, pass project config (categories) to the dialog

**Checkpoint**: At this point, an employee can start an interview, chat with the AI, see live summary updates, request a final summary, and review it. Interview state persists in the database.

---

## Phase 4: User Story 2 — Pause and Resume (Priority: P2)

**Goal**: Employees can close the browser and return later to find their in-progress interviews, resuming exactly where they left off.

**Independent Test**: Start an interview, answer several questions, close the browser, reopen, see the interview on the dashboard with a Resume option, resume and see the AI recap.

### Implementation for User Story 2

- [x] T023 [US2] Create interview list component in src/components/dashboard/interview-list.tsx — displays in-progress and stale interviews for the employee, showing title, category, status badge, last activity date, and message count. Resume button links to interview page.
- [x] T024 [US2] Update dashboard page src/app/[locale]/dashboard/page.tsx — integrate interview-list component, fetch interviews via GET /api/projects/[projectId]/interviews, show above the "start new process" button
- [x] T025 [US2] Update interview page src/app/[locale]/interview/[interviewId]/page.tsx — when loading an existing interview (status IN_PROGRESS), display all previous messages from the InterviewSession, scroll to bottom, and have the AI provide a recap as the first new action
- [x] T026 [US2] Create POST /api/projects/[projectId]/interviews/[interviewId]/resume endpoint in src/app/api/projects/[projectId]/interviews/[interviewId]/resume/route.ts — transitions STALE interviews back to IN_PROGRESS, adds a system-generated AI recap message using the recap prompt template from prompt-contracts.md
- [x] T027 [US2] Add stale interview detection: create a utility function in src/lib/interview/stale-detector.ts that checks interview.updatedAt against a 30-day threshold, and call it when listing interviews (mark as STALE if idle > 30 days)

**Checkpoint**: Employees can now pause and resume interviews seamlessly.

---

## Phase 5: User Story 3 — Structured Markdown and BPMN Output (Priority: P3)

**Goal**: Confirmed interviews produce a structured Markdown document and valid BPMN 2.0 XML diagram, stored as a ProcessEntry.

**Independent Test**: Complete an interview, confirm the summary, verify a ProcessEntry is created with proper Markdown sections and a BPMN diagram that renders in the existing bpmn-js viewer.

### Implementation for User Story 3

- [x] T028 [US3] Create Markdown generator in src/lib/interview/markdown-generator.ts — uses Vercel AI SDK `generateText` with the confirmed process summary JSON as input to produce a structured Markdown document with sections: Trigger, Process Steps, Roles/Responsibilities, Systems Used, Decision Points, Key Metrics. Language determined by employee preference.
- [x] T029 [US3] Create BPMN generator in src/lib/interview/bpmn-generator.ts — takes the process summary JSON (steps array with type, nextSteps, conditions), uses bpmn-moddle to programmatically create BPMN 2.0 model elements (start event, tasks, exclusive gateways, sequence flows, end event), applies bpmn-auto-layout for diagram coordinates, and serializes to valid BPMN 2.0 XML string.
- [x] T030 [US3] Create POST /api/projects/[projectId]/interviews/[interviewId]/confirm endpoint in src/app/api/projects/[projectId]/interviews/[interviewId]/confirm/route.ts — validates interview is in SUMMARY_REVIEW status, calls markdown-generator and bpmn-generator, creates a ProcessEntry with the generated content, links ProcessEntry to InterviewSession (processEntryId), transitions interview to COMPLETED, sets messageRetentionUntil (completedAt + 90 days)
- [x] T031 [US3] Update interview page src/app/[locale]/interview/[interviewId]/page.tsx — when in SUMMARY_REVIEW status, show confirm and "request changes" buttons. On confirm, call the confirm endpoint, show success message, redirect to the new ProcessEntry page.
- [x] T032 [US3] Create integration test for BPMN generation in tests/integration/bpmn-generation.test.ts — test that process summary JSON with various step types (task, decision, subprocess) produces valid BPMN XML that contains correct elements (start, tasks, gateways, flows, end)

**Checkpoint**: Complete interview flow produces professional deliverables (Markdown + BPMN).

---

## Phase 6: User Story 4 — AI Adapts to Project Configuration (Priority: P4)

**Goal**: The AI interview behavior changes based on project configuration (industry, terminology, categories) without code changes.

**Independent Test**: Create two projects with different configurations, run interviews in each, verify the AI's questions and terminology differ.

### Implementation for User Story 4

- [x] T033 [US4] Enhance prompt builder src/lib/interview/prompt-builder.ts — inject customTerminology map into the system prompt (replacing generic terms with configured terms), add industry-specific context hints, include interviewTemplateRefs guidance if configured on the project
- [x] T034 [US4] Update new interview dialog src/components/interview/new-interview-dialog.tsx — filter process categories to only show categories configured for the employee's project (not hardcoded)
- [x] T035 [US4] Create integration test for config-driven prompts in tests/integration/config-driven-prompts.test.ts — test that prompt builder produces different system prompts for different project configurations (manufacturing vs finance), and that customTerminology substitutions are applied correctly

**Checkpoint**: AI behavior adapts to project configuration.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T036 Create message retention purge utility in src/lib/interview/retention-purge.ts — deletes InterviewMessages where interviewSession.messageRetentionUntil < now() and interviewSession.status = COMPLETED. Can be called via a cron job or API route.
- [x] T037 [P] Add loading skeleton for interview page in src/app/[locale]/interview/[interviewId]/loading.tsx
- [x] T038 [P] Add error handling to chat interface src/components/interview/chat-interface.tsx — display user-friendly error message when LLM is unavailable (FR-014), retry button, preserve input text
- [x] T039 [P] Add empty state to interview list src/components/dashboard/interview-list.tsx — show message when no interviews exist
- [x] T040 Update mock LLM adapter src/lib/llm/adapters/mock.ts — add interview-aware canned responses that simulate structured interview behavior (greeting, follow-up questions, summary request) for testing without a live API key
- [x] T041 Verify build succeeds: `npm run build`
- [x] T042 Run all tests: `npm run test`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion — this is the MVP
- **US2 (Phase 4)**: Depends on Phase 3 (needs interview CRUD and chat flow to exist)
- **US3 (Phase 5)**: Depends on Phase 3 (needs interview confirmation flow)
- **US4 (Phase 6)**: Depends on Phase 3 (needs prompt builder and interview flow)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories. **This is the MVP.**
- **US2 (P2)**: Depends on US1 (needs interview CRUD, chat interface, and dashboard integration)
- **US3 (P3)**: Depends on US1 (needs interview completion flow and summary review state)
- **US4 (P4)**: Depends on US1 (needs prompt builder and interview flow to exist)

### Within Each User Story

- API routes before UI components (components need endpoints to call)
- Services before endpoints (endpoints depend on business logic)
- Core flow before edge cases

### Parallel Opportunities

- T005, T006, T007, T008, T009 can all run in parallel (different files, no dependencies)
- T011-T014 (interview CRUD endpoints) can be developed in parallel
- T017, T018, T019, T020 (UI components) can be developed in parallel after endpoints exist
- T028, T029 (Markdown and BPMN generators) can be developed in parallel
- T036, T037, T038, T039 (polish tasks) can all run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010)
3. Complete Phase 3: User Story 1 (T011-T022)
4. **STOP and VALIDATE**: Employee can start interview, chat with AI, see live summary, request and review final summary
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP!)
3. Add US2 → Pause/resume works → Deploy/Demo
4. Add US3 → Structured output generated → Deploy/Demo
5. Add US4 → Config-driven behavior → Deploy/Demo
6. Polish → Production-ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- The Vercel AI SDK `useChat` hook handles streaming state management on the client
- BPMN generation is deterministic code (bpmn-moddle), NOT LLM-generated
- PII stripping happens as middleware before messages reach the AI SDK
- The mock adapter should be enhanced (T040) to support full interview testing without API keys
