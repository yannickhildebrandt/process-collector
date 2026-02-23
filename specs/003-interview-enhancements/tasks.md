# Tasks: Interview Enhancements — Live BPMN, Contextual AI & Consultant Configuration Chat

**Input**: Design documents from `/specs/003-interview-enhancements/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-endpoints.md, quickstart.md

**Tests**: Integration tests included where appropriate (existing test patterns in `tests/integration/`).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared utilities, schemas, and i18n strings needed by multiple user stories

- [x] T001 Add i18n strings for greeting, config chat, and BPMN placeholder to `src/i18n/messages/en.json`
- [x] T002 Add i18n strings for greeting, config chat, and BPMN placeholder to `src/i18n/messages/de.json`
- [x] T003 Create `ProjectConfigurationSchema` (Zod, array-of-objects format) in `src/lib/config-chat/config-extractor.ts` for Anthropic-compatible structured extraction

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core fixes and prompt enhancements that MUST be complete before user story implementation

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Verify and fix `extractSummary` in `src/lib/interview/summary-extractor.ts` — ensure conditions array format works end-to-end with Anthropic (ProcessSummary schema uses `z.array(z.object({condition, nextStep}))`)
- [x] T005 [P] Update `buildSystemPrompt` in `src/lib/interview/prompt-builder.ts` to include process title, category, industry classification, custom terminology, and interview template refs from ProjectConfiguration
- [x] T006 [P] Verify `generateBpmnXml` in `src/lib/interview/bpmn-generator.ts` handles edge cases: 0 steps (empty/placeholder), 1 step, conditions array format

**Checkpoint**: Foundation ready — summary extraction works, prompts include full context, BPMN generator handles all cases

---

## Phase 3: User Story 4 — Fix Summary Panel Updates (Priority: P1)

**Goal**: Ensure the summary panel reliably updates after each AI message exchange during an interview.

**Independent Test**: Start an interview, send a message describing a process. After the AI responds, verify the summary panel shows the extracted information within 5 seconds.

### Implementation for User Story 4

- [x] T007 [US4] Debug and fix the summary refetch pipeline in `src/app/[locale]/interview/[interviewId]/page.tsx` — ensure `currentSummaryJson` re-fetches after AI response and passes updated data to summary panel
- [x] T008 [US4] Fix `src/components/interview/summary-panel.tsx` to reactively render when `currentSummaryJson` changes — verify structured sections (trigger, steps, roles, systems, metrics) display correctly
- [x] T009 [US4] Handle summary extraction failure gracefully in `src/app/api/projects/[projectId]/interviews/[interviewId]/chat/route.ts` — keep previous summary on error, no error shown to user
- [x] T010 [US4] Update integration test in `tests/integration/bpmn-generation.test.ts` to verify the conditions array format produces valid BPMN XML for 0, 1, and N steps

**Checkpoint**: Summary panel updates reliably after each message. Existing tests pass.

---

## Phase 4: User Story 1 — Live Summary & BPMN During Interview (Priority: P1)

**Goal**: Add a live BPMN diagram below the textual summary in the sidebar that regenerates from the current summary after each message exchange.

**Independent Test**: Start an interview, describe a process with 3+ steps including a decision point. After each message, verify the textual summary updates and the BPMN diagram grows to reflect newly captured steps, roles, and gateways.

### Implementation for User Story 1

- [x] T011 [US1] Add BPMN viewer section below the textual summary in `src/components/interview/summary-panel.tsx` — dynamically import `src/components/processes/bpmn-viewer.tsx`, call `generateBpmnXml()` from current summary, show placeholder when no steps
- [x] T012 [US1] Wire BPMN regeneration in `src/app/[locale]/interview/[interviewId]/page.tsx` — after summary refetch, pass updated XML to the BPMN viewer via props; constrain container height (~300px) with scroll/zoom
- [x] T013 [US1] Ensure `src/components/processes/bpmn-viewer.tsx` supports re-rendering on XML prop change — verify `useEffect` with `[xml]` dependency calls `importXML()` and `canvas.zoom('fit-viewport')`
- [x] T014 [US1] Add BPMN placeholder message in `src/components/interview/summary-panel.tsx` when no process steps are captured yet (use i18n key from T001/T002)

**Checkpoint**: BPMN diagram appears in sidebar and grows with each message. Placeholder shown when empty.

---

## Phase 5: User Story 2 — Contextual AI Greeting with Process Context (Priority: P1)

**Goal**: Generate a contextual AI greeting at interview creation time that references the process title, category, industry, and custom terminology, persisted as the first assistant message.

**Independent Test**: Create a new interview with a specific title and category. Verify the AI greeting appears immediately on page load, referencing the title, category, and industry context.

### Implementation for User Story 2

- [x] T015 [P] [US2] Create greeting generator in `src/lib/interview/greeting-generator.ts` — use `generateText` with the interview system prompt + greeting instruction; accept title, category, projectConfig, locale; return greeting text
- [x] T016 [P] [US2] Add static fallback greeting strings to `src/i18n/messages/en.json` and `src/i18n/messages/de.json` (fallback when AI is unavailable)
- [x] T017 [US2] Modify POST handler in `src/app/api/projects/[projectId]/interviews/route.ts` — after creating InterviewSession, call greeting generator, persist greeting as InterviewMessage (role: ASSISTANT, orderIndex: 0); on failure, persist static fallback
- [x] T018 [US2] Update `src/app/[locale]/interview/[interviewId]/page.tsx` to display the persisted greeting as the first message (already loaded from DB — verify it renders without additional fetch)
- [x] T019 [US2] Create integration test in `tests/integration/greeting-generation.test.ts` — test greeting generator with mock AI provider, verify fallback on error, verify greeting includes title/category

**Checkpoint**: New interviews show a contextual AI greeting immediately. Fallback works when AI is unavailable.

---

## Phase 6: User Story 3 — Consultant Configuration Chat (Priority: P2)

**Goal**: Provide a conversational AI interface for consultants to configure project settings (industry, categories, terminology) as an alternative to the existing form.

**Independent Test**: Navigate to project settings, click "Configure via AI", describe the client's needs, verify the AI extracts structured config displayed in a preview, and apply it to save.

### Implementation for User Story 3

- [x] T020 [P] [US3] Create config chat system prompt builder in `src/lib/config-chat/config-prompt-builder.ts` — build system prompt from project name, existing config (if any), instruct AI to help configure industry/categories/terminology
- [x] T021 [P] [US3] Create config extraction utility in `src/lib/config-chat/config-extractor.ts` — use `generateObject` with `ProjectConfigurationSchema` (from T003) to extract structured config from conversation; convert array-format terminology to record format for storage
- [x] T022 [US3] Create streaming config chat API endpoint at `src/app/api/projects/[projectId]/configure-chat/route.ts` — validate CONSULTANT role + project membership, load project config, build system prompt, stream AI response via `streamText`, extract config in `onFinish` via T021
- [x] T023 [US3] Create apply-config API endpoint at `src/app/api/projects/[projectId]/configure-chat/apply/route.ts` — accept extracted config + version, validate against `validateConfiguration()`, check optimistic concurrency, update/create ProjectConfiguration
- [x] T024 [P] [US3] Create config chat UI component in `src/components/projects/config-chat-interface.tsx` — use `useChat` with config-chat endpoint, display conversation messages, handle streaming
- [x] T025 [P] [US3] Create config preview panel component in `src/components/projects/config-preview-panel.tsx` — display extracted config as structured preview (industry, categories table, terminology table), "Apply Configuration" button
- [x] T026 [US3] Integrate config chat into project settings page `src/app/[locale]/projects/[projectId]/settings/page.tsx` — add "Configure via AI" button alongside existing form, toggle between form and chat view, wire up apply action
- [x] T027 [US3] Add unsaved changes confirmation — when consultant closes/navigates away from config chat with unapplied changes, show confirmation prompt

**Checkpoint**: Consultants can configure projects via AI conversation. Config is validated and saved. Existing form still works.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, edge case handling, and cross-story integration

- [x] T028 Verify all 3 existing integration tests pass with `npx vitest run`
- [x] T029 Run full build check with `npx next build` to verify no TypeScript or compilation errors
- [ ] T030 Run quickstart.md Scenario 1 (Summary Panel + Live BPMN) manually to validate end-to-end
- [ ] T031 Run quickstart.md Scenario 2 (Contextual AI Greeting) manually to validate end-to-end
- [ ] T032 Run quickstart.md Scenario 4 (Error Handling) manually to validate fallback behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T003 from Setup — BLOCKS all user stories
- **US4 — Fix Summary (Phase 3)**: Depends on Phase 2 (T004 summary fix, T005 prompt update)
- **US1 — Live BPMN (Phase 4)**: Depends on Phase 3 (US4 must work first — BPMN builds on working summary)
- **US2 — Greeting (Phase 5)**: Depends on Phase 2 (T005 prompt builder) — independent of US1/US4
- **US3 — Config Chat (Phase 6)**: Depends on Phase 1 (T003 schema) — independent of US1/US2/US4
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US4 (P1)**: Start after Phase 2. No dependencies on other stories. MUST complete before US1.
- **US1 (P1)**: Start after US4 is complete (BPMN needs working summary panel).
- **US2 (P1)**: Start after Phase 2. Independent of US1 and US4. Can run in parallel with US4/US1.
- **US3 (P2)**: Start after Phase 1. Independent of all other stories. Can run in parallel with US4/US1/US2.

### Within Each User Story

- Utility/lib files before API endpoints
- API endpoints before UI components
- UI components before page integration
- Tests alongside or after implementation

### Parallel Opportunities

**Phase 1**: T001 and T002 (i18n files) can run in parallel with T003 (schema)

**Phase 2**: T004, T005, T006 are all independent files — run in parallel

**Phase 5 (US2)**: T015 and T016 can run in parallel (greeting generator + fallback strings)

**Phase 6 (US3)**: T020+T021 (lib utilities) in parallel, then T022+T023 (API endpoints), then T024+T025 (UI components) in parallel

**Cross-story parallelism**: US2 (Phase 5) and US3 (Phase 6) can run in parallel with each other and with US4→US1

---

## Parallel Example: User Story 3

```bash
# Launch lib utilities in parallel:
Task: "Create config-prompt-builder.ts"       # T020
Task: "Create config-extractor.ts"            # T021

# Then API endpoints sequentially (T022 depends on T020+T021):
Task: "Create configure-chat streaming endpoint"  # T022
Task: "Create configure-chat/apply endpoint"      # T023

# Then UI components in parallel:
Task: "Create config-chat-interface.tsx"      # T024
Task: "Create config-preview-panel.tsx"       # T025

# Then page integration (depends on T024+T025):
Task: "Integrate into settings page"          # T026
Task: "Add unsaved changes confirmation"      # T027
```

---

## Implementation Strategy

### MVP First (US4 + US1: Working Summary + Live BPMN)

1. Complete Phase 1: Setup (i18n, schemas)
2. Complete Phase 2: Foundational (fix summary extraction, enhance prompts, verify BPMN)
3. Complete Phase 3: US4 — Fix Summary Panel
4. Complete Phase 4: US1 — Live BPMN
5. **STOP and VALIDATE**: Interview experience works end-to-end with summary + BPMN

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US4 (Fix Summary) → Summary panel works → Validate
3. US1 (Live BPMN) → BPMN diagram appears → Validate (Core MVP!)
4. US2 (Greeting) → Contextual auto-greeting → Validate
5. US3 (Config Chat) → Consultant can configure via AI → Validate
6. Polish → Full quickstart validation → Ready for demo

### Parallel Execution (Fastest Path)

1. Phase 1 + Phase 2 together (Setup + Foundational)
2. Once Phase 2 done:
   - **Track A**: US4 → US1 (sequential — BPMN depends on summary)
   - **Track B**: US2 (independent — greeting generation)
   - **Track C**: US3 (independent — config chat)
3. Polish after all tracks complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US4 must complete before US1 (BPMN builds on working summary panel)
- US2 and US3 are fully independent and can run in parallel with everything else
- All AI calls go through `getAIProvider()` — no provider-specific code
- Anthropic constraint: no `z.record()` — use `z.array(z.object({...}))` for all schemas
- bpmn-js is client-only — always use dynamic import with `ssr: false`
- Commit after each task or logical group
