# Tasks: Platform Foundation

**Input**: Design documents from `/specs/001-platform-foundation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and tooling configuration

- [X] T001 Initialize Next.js 15 project with TypeScript, App Router, and Tailwind CSS in the repository root (package.json, tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.js)
- [X] T002 Install core dependencies: react@19, next@15, prisma, @prisma/client, better-auth, next-intl, bpmn-js, resend, @anthropic-ai/sdk, react-markdown; dev dependencies: vitest, @vitejs/plugin-react, playwright, @types/node, @types/react
- [X] T003 [P] Create .env.example with all required environment variables (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, RESEND_API_KEY, ANTHROPIC_API_KEY, NEXT_PUBLIC_APP_URL) in .env.example
- [X] T004 [P] Initialize shadcn/ui: run init command, configure components.json, install base components (Button, Input, Label, Card, Dialog, DropdownMenu, Select, Toast) in src/components/ui/
- [X] T005 [P] Configure Vitest with vitest.config.ts at repository root (TypeScript paths, React plugin, test directory mapping to tests/)
- [X] T006 [P] Configure Playwright with playwright.config.ts at repository root (base URL, browser selection, test directory mapping to tests/e2e/)

**Checkpoint**: Project scaffolding complete — `npm run dev` starts without errors, all tooling configs in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, authentication, i18n, and base layout that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Create Prisma schema with all entities (User, Session, Project, ProjectMember, ProjectConfiguration, ProcessEntry, LLMProviderConfig) including enums (Role, ProjectStatus, ProcessEntryStatus, Language), relations, indexes, and JSONB fields in prisma/schema.prisma
- [ ] T008 Run initial Prisma migration to create database tables: `npx prisma migrate dev --name init`
- [X] T009 Create Prisma client singleton in src/lib/db.ts (global instance pattern for Next.js hot reload)
- [X] T010 Configure Better Auth with email/password credentials provider, magic link plugin (15-min expiry, single-use), roles plugin (CONSULTANT, EMPLOYEE), and 7-day session lifetime in src/lib/auth.ts
- [X] T011 Create Better Auth API catch-all route handler in src/app/api/auth/[...all]/route.ts
- [X] T012 Create auth middleware for protected routes in src/middleware.ts (Next.js middleware checking session, redirecting unauthenticated users to login)
- [X] T013 [P] Set up next-intl: create src/i18n/request.ts (locale detection, user preference), create src/i18n/messages/en.json and src/i18n/messages/de.json with base UI strings (navigation, common buttons, error messages, auth forms)
- [X] T014 [P] Create root layout with providers (Better Auth session, next-intl, Tailwind) in src/app/[locale]/layout.tsx; include locale switcher, responsive container
- [X] T015 [P] Create shared layout components: Header with app logo, user menu (display name, language switcher, sign out), and role-based navigation in src/components/layout/header.tsx; Sidebar with nav links in src/components/layout/sidebar.tsx
- [X] T016 Create landing/login page at src/app/[locale]/page.tsx with consultant email/password login form and employee magic link request form (two-tab or two-section layout)
- [X] T017 [P] Create auth form components: ConsultantLoginForm (email + password) in src/components/auth/consultant-login-form.tsx and MagicLinkForm (email only) in src/components/auth/magic-link-form.tsx
- [X] T018 Create database seed script with demo data: one Consultant user, one Project with ProjectConfiguration (sample industry, categories, terminology), one Employee user assigned to the project, one sample ProcessEntry with Markdown content and BPMN XML, one mock LLMProviderConfig (dpaActive=true), one Claude LLMProviderConfig (dpaActive=true) in prisma/seed.ts
- [X] T019 Configure seed script in package.json prisma.seed field and run: `npx prisma db seed`
- [X] T020 [P] Create user preferences API route (PATCH /api/user/preferences) for language preference updates in src/app/api/user/route.ts
- [X] T021 [P] Create user settings page with language selector (DE/EN dropdown, persists via API) in src/app/[locale]/settings/page.tsx

**Checkpoint**: Foundation ready — auth works (login/logout), i18n switches between DE/EN, database seeded with demo data, base layout renders.

---

## Phase 3: User Story 1 - Consultant Creates a Client Project (Priority: P1)

**Goal**: A consultant can log in, create a new client project with configuration, view project details, and invite employees.

**Independent Test**: Log in as demo consultant → create project → verify in list → invite employee → verify magic link sent.

### Implementation for User Story 1

- [X] T022 [US1] Create ProjectConfiguration JSON schema validator (validates industryClassification, processCategories structure, customTerminology format) with clear error messages for invalid configs in src/lib/validators/config-schema.ts
- [X] T023 [US1] Add application startup configuration validation: on app boot, load all ProjectConfiguration records and validate against config schema (src/lib/validators/config-schema.ts); log clear error messages for invalid configs; prevent serving requests for projects with invalid configurations. Implement in src/lib/startup-validation.ts, invoke from Next.js instrumentation hook (instrumentation.ts at project root)
- [X] T024 [US1] Create project API routes in src/app/api/projects/route.ts: GET /api/projects (list projects for authenticated user, role-aware filtering), POST /api/projects (create project with configuration, consultant-only, duplicate name warning with 409 status)
- [X] T025 [US1] Create project detail and configuration API routes in src/app/api/projects/[projectId]/route.ts: GET /api/projects/:projectId (project details + configuration), and src/app/api/projects/[projectId]/configuration/route.ts: PATCH (update configuration with optimistic concurrency control using version field, 409 on conflict)
- [X] T026 [US1] Create employee invitation API route in src/app/api/projects/[projectId]/invite/route.ts: POST (creates Employee user if not exists, creates ProjectMember, enforces single-project-per-employee constraint, sends magic link via Resend)
- [X] T027 [P] [US1] Create project list page showing consultant's projects (name, industry, status, member count, created date) with "New Project" button in src/app/[locale]/projects/page.tsx
- [X] T028 [P] [US1] Create project list component (card grid with project summary, link to detail) in src/components/projects/project-list.tsx
- [X] T029 [US1] Create new project form page with fields: client name, industry, process categories (dynamic add/remove with DE/EN labels), custom terminology (optional key-value pairs), submit with validation in src/app/[locale]/projects/new/page.tsx
- [X] T030 [P] [US1] Create project creation form component with multi-step or single-page layout, inline validation, bilingual category labels in src/components/projects/project-form.tsx
- [X] T031 [US1] Create project detail page showing project name, industry, status, configuration summary, member list, and "Invite Employee" action in src/app/[locale]/projects/[projectId]/page.tsx
- [X] T032 [US1] Create project settings page for editing configuration (process categories, terminology) with optimistic concurrency conflict handling (show warning on 409) in src/app/[locale]/projects/[projectId]/settings/page.tsx
- [X] T033 [US1] Create employee invitation dialog component (email + display name input, submit triggers invite API, shows success/error feedback) in src/components/projects/invite-dialog.tsx
- [X] T034 [US1] Add i18n strings for project management (create form labels, validation messages, success/error toasts, invite dialog text) to src/i18n/messages/en.json and src/i18n/messages/de.json

**Checkpoint**: US1 complete — consultant can log in, create projects, view details, edit configuration, invite employees. All acceptance scenarios testable.

---

## Phase 4: User Story 2 - Employee Logs In and Sees the Dashboard (Priority: P2)

**Goal**: An employee receives a magic link, authenticates, and lands on a dashboard showing their project context with a clear call-to-action.

**Independent Test**: Use invited employee email → request magic link → click link → verify dashboard shows project name, categories, and "Document a new process" CTA.

### Implementation for User Story 2

- [X] T035 [US2] Create employee dashboard page at src/app/[locale]/dashboard/page.tsx: fetch employee's single project with configuration, display welcome message (personalized with display name), project name, industry context, list of process categories (localized labels based on preferred language), and prominent "Document a new process" CTA button (disabled with tooltip explaining it's coming in a future release)
- [X] T036 [P] [US2] Create dashboard components: WelcomeCard (greeting + project context) in src/components/dashboard/welcome-card.tsx, ProcessCategoryList (renders categories with localized labels) in src/components/dashboard/process-category-list.tsx
- [X] T037 [US2] Implement post-login redirect logic: after magic link verification, redirect Employees to /dashboard; after email/password login, redirect Consultants to /projects. Handle in src/middleware.ts or Better Auth callback configuration in src/lib/auth.ts
- [X] T038 [US2] Add error handling for invalid/expired magic links: display clear non-technical message ("This link has expired. Please request a new one.") with a button to request a new magic link on the login page. Update src/app/[locale]/page.tsx
- [X] T039 [US2] Add i18n strings for employee dashboard (welcome message, category labels, CTA text, magic link error messages) to src/i18n/messages/en.json and src/i18n/messages/de.json

**Checkpoint**: US2 complete — employee can authenticate via magic link, sees personalized dashboard with project context and CTA. Invalid credentials show helpful error.

---

## Phase 5: User Story 3 - LLM Abstraction Layer Round-Trip (Priority: P3)

**Goal**: The system sends a prompt through the LLM abstraction layer and receives a normalized response. Provider can be swapped via configuration.

**Independent Test**: Send test prompt via mock adapter → verify response. Switch to Claude adapter → verify response. No business logic code changes between swaps.

### Implementation for User Story 3

- [X] T040 [P] [US3] Define LLM TypeScript types and interfaces (LLMRequest, LLMResponse, LLMProviderError, LLMProvider interface with complete() and isAvailable() methods) in src/lib/llm/types.ts per contracts/llm-abstraction.md
- [X] T041 [P] [US3] Implement PII stripping utility: regex-based email removal, tagged name removal, replacement with anonymized placeholders ([PERSON_1], [EMAIL_1]), warning log for untagged PII patterns in src/lib/llm/pii-filter.ts
- [X] T042 [US3] Implement MockAdapter (implements LLMProvider): returns configurable canned responses, supports isAvailable() health check, providerKey="mock" in src/lib/llm/adapters/mock.ts
- [X] T043 [US3] Implement ClaudeAdapter (implements LLMProvider): wraps @anthropic-ai/sdk, maps LLMRequest to Claude Messages API format, maps Claude response to LLMResponse, handles API errors (rate limit, auth failure, unavailable) as LLMProviderError, providerKey="claude" in src/lib/llm/adapters/claude.ts
- [X] T044 [US3] Implement LLMService orchestrator: constructor takes providers array + config from database, complete() method selects provider (default or override), verifies DPA gate (refuse if dpaActive=false with DPA_INACTIVE error), calls pii-filter, delegates to adapter, normalizes response, wraps errors in src/lib/llm/service.ts
- [X] T045 [US3] Create LLM completion API route (POST /api/llm/complete): authenticated, accepts prompt/systemMessage/options, instantiates LLMService with providers from DB config, returns normalized response or error (503 for unavailable, 403 for DPA violation) in src/app/api/llm/route.ts
- [X] T046 [US3] Add i18n strings for LLM error messages (service unavailable, DPA violation, rate limited — all user-friendly, no technical jargon) to src/i18n/messages/en.json and src/i18n/messages/de.json
- [X] T047 [US3] Create LLM provider-swap integration test: configure mock provider, send prompt, verify normalized response; reconfigure to Claude provider (or second mock with different canned response), send same prompt, verify response — with zero business-logic code changes between swaps. Validates SC-003 and constitution mandate in tests/integration/llm-provider-swap.test.ts

**Checkpoint**: US3 complete — LLM abstraction layer returns responses from both mock and Claude adapters. PII stripped. DPA gate enforced. Provider swappable via DB config alone. Integration test proves swap capability.

---

## Phase 6: User Story 4 - Process Output Rendering (Priority: P4)

**Goal**: A user navigates to a process entry and sees rendered Markdown + bpmn.js BPMN viewer with pan/zoom on sample data.

**Independent Test**: Navigate to seeded sample process entry → verify Markdown renders with formatting → verify bpmn.js loads BPMN diagram → verify pan/zoom.

### Implementation for User Story 4

- [X] T048 [P] [US4] Create process list API route in src/app/api/projects/[projectId]/processes/route.ts: GET (list process entries for project, auth required, project member check)
- [X] T049 [P] [US4] Create process detail API route in src/app/api/projects/[projectId]/processes/[processId]/route.ts: GET (single process with markdownContent and bpmnXml, auth required, project member check)
- [X] T050 [P] [US4] Create Markdown renderer component using react-markdown with support for headings, lists, emphasis, links, code blocks in src/components/processes/markdown-viewer.tsx
- [X] T051 [P] [US4] Create bpmn.js viewer component: mount bpmn-js NavigatedViewer (view-only, pan + zoom enabled, no editing), load BPMN XML from props, handle loading state and error fallback ("Diagram temporarily unavailable") in src/components/processes/bpmn-viewer.tsx
- [X] T052 [US4] Create process detail page at src/app/[locale]/projects/[projectId]/processes/[processId]/page.tsx: fetch process entry via API, render title and status, Markdown section using MarkdownViewer component, BPMN section using BpmnViewer component, back navigation to project
- [X] T053 [US4] Add sample BPMN 2.0 XML file for the seeded ProcessEntry (a simple Order-to-Cash diagram with 5-8 activities, start/end events, gateways) in prisma/seed-data/sample-process.bpmn and reference in prisma/seed.ts
- [X] T054 [US4] Add i18n strings for process view (title, status labels, loading states, BPMN fallback message) to src/i18n/messages/en.json and src/i18n/messages/de.json

**Checkpoint**: US4 complete — sample process entry renders Markdown with formatting and bpmn.js viewer displays BPMN diagram with pan/zoom. Fallback shown on load failure.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error handling consistency, navigation completeness, and final validation

- [X] T055 [P] Create global error boundary component with non-technical error messages (bilingual) and recovery guidance in src/components/layout/error-boundary.tsx; integrate in src/app/[locale]/layout.tsx
- [X] T056 [P] Create loading states for all async pages (project list, dashboard, process view) using Next.js loading.tsx convention in src/app/[locale]/projects/loading.tsx, src/app/[locale]/dashboard/loading.tsx, src/app/[locale]/projects/[projectId]/processes/[processId]/loading.tsx
- [X] T057 [P] Create empty state components: "No projects yet" for consultant project list, "No processes yet" for process list within a project in src/components/projects/empty-state.tsx and src/components/processes/empty-state.tsx
- [X] T058 Add navigation links between all pages: header nav (Projects for consultants, Dashboard for employees), project detail → process list → process detail breadcrumbs; update src/components/layout/header.tsx and src/components/layout/sidebar.tsx
- [X] T059 Validate complete user flows end-to-end against quickstart.md verification checklist: run through all 4 user story verification steps manually, fix any issues found
- [X] T060 Review all user-facing error messages across the app for plain language compliance (no stack traces, no technical codes, no provider-specific terms per SC-005); update i18n message files if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3) can proceed independently after Phase 2
  - US2 (Phase 4) can proceed independently after Phase 2 (uses invitation from US1 in full flow, but magic link auth works standalone)
  - US3 (Phase 5) can proceed independently after Phase 2 (no frontend dependency)
  - US4 (Phase 6) can proceed independently after Phase 2 (uses seeded data)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on other stories
- **US2 (P2)**: After Phase 2 — logically follows US1 (invitation flow) but testable independently with seeded employee data
- **US3 (P3)**: After Phase 2 — fully independent backend-only story
- **US4 (P4)**: After Phase 2 — fully independent, uses seeded sample data

### Within Each User Story

- Models/types before services
- Services before API routes
- API routes before pages
- Core implementation before integration refinements
- i18n strings can be added at any point (parallel)

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T006 can all run in parallel after T001+T002
- **Phase 2**: T013, T014, T015, T017, T020, T021 can run in parallel after T007-T012
- **Phase 3 (US1)**: T027+T028 in parallel, T030 in parallel with API work
- **Phase 4 (US2)**: T036 in parallel with T035
- **Phase 5 (US3)**: T040+T041 in parallel, then T042+T043 in parallel
- **Phase 6 (US4)**: T048+T049+T050+T051 all in parallel, then T052
- **Phase 7**: T055+T056+T057 all in parallel

---

## Parallel Example: User Story 3 (LLM)

```bash
# Launch types and PII filter together:
Task: "Define LLM types in src/lib/llm/types.ts"
Task: "Implement PII filter in src/lib/llm/pii-filter.ts"

# Then launch both adapters together:
Task: "Implement MockAdapter in src/lib/llm/adapters/mock.ts"
Task: "Implement ClaudeAdapter in src/lib/llm/adapters/claude.ts"

# Then service (depends on types + adapters):
Task: "Implement LLMService in src/lib/llm/service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Consultant can create project and invite employees
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Polish phase → Final validation
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (project management)
   - Developer B: User Story 3 (LLM abstraction — no frontend)
   - Developer C: User Story 4 (rendering components)
3. User Story 2 (employee dashboard) after US1 invitation flow exists
4. Polish phase: all developers

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- bpmn.js MUST be bundled (not CDN) per assumption in spec
- All i18n tasks are parallelizable within their story
