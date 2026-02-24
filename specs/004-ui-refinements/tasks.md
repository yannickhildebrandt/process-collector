# Tasks: UI Refinements

**Input**: Design documents from `/specs/004-ui-refinements/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not included — no E2E framework in project yet. Manual viewport testing per quickstart.md.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new shadcn/ui components needed by multiple stories

- [x] T001 Install shadcn/ui Sheet component: `npx shadcn@latest add sheet` → creates `src/components/ui/sheet.tsx`
- [x] T002 Install shadcn/ui Skeleton component: `npx shadcn@latest add skeleton` → creates `src/components/ui/skeleton.tsx`

**Checkpoint**: New UI primitives available. User story implementation can begin.

---

## Phase 2: User Story 1 — Mobile Interview Tabs (Priority: P1) — MVP

**Goal**: Interview page shows Chat/Summary as switchable tabs on viewports < 1024px. Desktop side-by-side layout unchanged.

**Independent Test**: Open interview at 375px width → Chat and Summary tabs visible, switchable, no overflow.

### Implementation for User Story 1

- [x] T003 [P] [US1] Add i18n keys `interview.tabChat` ("Chat" / "Chat") and `interview.tabSummary` ("Summary" / "Zusammenfassung") in `src/i18n/messages/en.json` and `src/i18n/messages/de.json`
- [x] T004 [US1] Refactor interview page layout to use `<Tabs>` from `src/components/ui/tabs` in `src/app/[locale]/interview/[interviewId]/page.tsx`: wrap chat and summary in `<Tabs defaultValue="chat">`, add `<TabsList>` with two triggers visible only below `lg` (`lg:hidden`), put chat in `<TabsContent value="chat">` and summary in `<TabsContent value="summary">`. On `lg+` screens, both TabsContent panels render side-by-side (hide tabs strip, show both panels via CSS). Keep existing `w-80 border-l` sidebar structure for desktop.
- [x] T005 [US1] Add SSE update indicator to Summary tab in `src/app/[locale]/interview/[interviewId]/page.tsx`: add `summaryHasUpdate` boolean state, set to `true` when SSE `summary-update` event fires while active tab is "chat", clear when user switches to "summary" tab. Render a small colored dot on the Summary `<TabsTrigger>` when `summaryHasUpdate` is true.

**Checkpoint**: Interview page fully functional on mobile (375px) and desktop (1024px+). Chat and Summary both accessible via tabs on mobile.

---

## Phase 3: User Story 2 — Mobile Navigation (Priority: P2)

**Goal**: Header navigation collapses into hamburger menu with slide-out Sheet on viewports < 768px. Desktop nav unchanged.

**Independent Test**: Open any page at 375px width → hamburger icon visible, tap opens Sheet with all nav items.

### Implementation for User Story 2

- [x] T006 [P] [US2] Add i18n key `common.menu` ("Menu" / "Menü") in `src/i18n/messages/en.json` and `src/i18n/messages/de.json`
- [x] T007 [US2] Refactor header for responsive layout in `src/components/layout/header.tsx`: hide existing inline nav links below `md` (`hidden md:flex`), add hamburger `<Button>` with `Menu` icon from lucide-react visible below `md` (`md:hidden`). Wire hamburger to open a `<Sheet>` (from `src/components/ui/sheet`) sliding from the left.
- [x] T008 [US2] Populate Sheet content in `src/components/layout/header.tsx`: inside the Sheet, render nav links (Projects/Dashboard based on role), language switcher, and sign-out button stacked vertically with appropriate spacing and tap target sizes (min 44px). Close Sheet on navigation.

**Checkpoint**: Navigation fully functional at all viewport widths (320px–1920px).

---

## Phase 4: User Story 3 — Skeleton Loading States (Priority: P3)

**Goal**: Replace plain-text loading indicators with skeleton placeholders matching content shapes.

**Independent Test**: Throttle network to Slow 3G → navigate to Projects, Dashboard, Interview → skeletons appear before content.

### Implementation for User Story 3

- [x] T009 [P] [US3] Update projects loading skeleton in `src/app/[locale]/projects/loading.tsx`: replace existing `bg-muted animate-pulse` divs with `<Skeleton>` components from `src/components/ui/skeleton` matching the card grid layout (`md:grid-cols-2 lg:grid-cols-3`). Each skeleton card: title line + 3 short text lines.
- [x] T010 [P] [US3] Update dashboard loading skeleton in `src/app/[locale]/dashboard/loading.tsx`: replace existing placeholders with `<Skeleton>` components matching the welcome card + interview list row shapes.
- [x] T011 [P] [US3] Update interview loading skeleton in `src/app/[locale]/interview/[interviewId]/loading.tsx`: replace existing placeholders with `<Skeleton>` components matching the chat area (message bubble shapes) + sidebar (summary card shape). Also update the runtime `if (loading)` block in `src/app/[locale]/interview/[interviewId]/page.tsx` to use skeleton layout instead of plain "Loading interview..." text.
- [x] T012 [P] [US3] Update process detail loading skeleton in `src/app/[locale]/projects/[projectId]/processes/[processId]/loading.tsx`: replace existing placeholders with `<Skeleton>` components matching title + markdown block + BPMN placeholder.

**Checkpoint**: All primary pages show structured skeleton placeholders during loading. No layout shift on content swap.

---

## Phase 5: User Story 4 — Responsive Form Grids (Priority: P4)

**Goal**: Category input grids adapt to viewport width — single column on mobile, 3 columns on desktop.

**Independent Test**: Open project creation form at 375px → inputs stack vertically. At 1024px → 3-column grid.

### Implementation for User Story 4

- [x] T013 [P] [US4] Make category grid responsive in `src/components/projects/project-form.tsx`: change `grid grid-cols-3 gap-2` to `grid grid-cols-1 md:grid-cols-3 gap-2`. Ensure delete button remains accessible on mobile (appears after the last input field in single-column mode).
- [x] T014 [P] [US4] Make category grid responsive in `src/app/[locale]/projects/[projectId]/settings/page.tsx`: apply same change — `grid grid-cols-3 gap-2` to `grid grid-cols-1 md:grid-cols-3 gap-2`.

**Checkpoint**: Forms usable at all viewport widths. Desktop layout unchanged.

---

## Phase 6: User Story 5 — BPMN Viewer Dark Mode (Priority: P5)

**Goal**: BPMN viewer background respects active theme instead of hardcoded white.

**Independent Test**: Enable dark mode → view process with diagram → viewer background matches card.

### Implementation for User Story 5

- [x] T015 [US5] Fix BPMN viewer background in `src/components/processes/bpmn-viewer.tsx`: change `bg-white` to `bg-white dark:bg-card` on the container div (`className="border rounded-md bg-white"`).

**Checkpoint**: Diagram renders correctly in both light and dark themes.

---

## Phase 7: User Story 6 — Employee Password Login for Dev (Priority: P6)

**Goal**: Employee can log in with email+password in development mode. Production remains magic-link only.

**Independent Test**: Start dev server → employee tab shows password fields → login with employee@client.com / employee123.

### Implementation for User Story 6

- [x] T016 [US6] Add employee password to seed data in `prisma/seed.ts`: create a credential-provider account record for the employee user with hashed password `employee123`, following the same pattern used for the consultant account (Better Auth `account` table with `providerId: "credential"`).
- [x] T017 [US6] Add dev-mode password login to employee form in `src/components/auth/magic-link-form.tsx`: detect `process.env.NODE_ENV === "development"`. In dev mode, render email + password fields with a "Sign In" button that calls `signIn.email({ email, password })` and redirects to `/${locale}/dashboard`. In production mode, render the existing magic-link flow unchanged.
- [x] T018 [US6] Re-seed the database after seed.ts changes: run `npx prisma db seed` to apply the employee password credential.

**Checkpoint**: Employee can log in via password in dev mode. Production magic-link flow unaffected.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validate all stories work together across viewports

- [x] T019 Validate all pages at 320px, 375px, 768px, 1024px, and 1920px viewports — no horizontal overflow, no hidden content, no layout breakage. Fix any issues found.
- [x] T020 Run through `specs/004-ui-refinements/quickstart.md` testing checklist end-to-end and verify all items pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Setup (needs Tabs — already installed, no blocker)
- **US2 (Phase 3)**: Depends on Setup (needs Sheet from T001)
- **US3 (Phase 4)**: Depends on Setup (needs Skeleton from T002)
- **US4 (Phase 5)**: No setup dependency — can start immediately
- **US5 (Phase 6)**: No setup dependency — can start immediately
- **US6 (Phase 7)**: No setup dependency — can start immediately
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — no dependency on other stories
- **US2 (P2)**: Independent — no dependency on other stories
- **US3 (P3)**: Independent — no dependency on other stories
- **US4 (P4)**: Independent — no dependency on other stories
- **US5 (P5)**: Independent — no dependency on other stories
- **US6 (P6)**: Independent — no dependency on other stories

All stories touch different files and can be implemented in any order or in parallel.

### Parallel Opportunities

- T003, T006 can run in parallel (both edit i18n files but different sections)
- T009, T010, T011, T012 can all run in parallel (different loading.tsx files)
- T013, T014 can run in parallel (different form files)
- US4 (T013-T014), US5 (T015), and US6 (T016-T018) have no setup dependencies and can start immediately

---

## Parallel Example: User Story 3

```bash
# All skeleton tasks touch different files — launch together:
Task: "T009 Update projects loading skeleton in src/app/[locale]/projects/loading.tsx"
Task: "T010 Update dashboard loading skeleton in src/app/[locale]/dashboard/loading.tsx"
Task: "T011 Update interview loading skeleton in src/app/[locale]/interview/[interviewId]/loading.tsx"
Task: "T012 Update process detail loading skeleton in src/app/[locale]/projects/[projectId]/processes/[processId]/loading.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: US1 — Mobile Interview Tabs (T003-T005)
3. **STOP and VALIDATE**: Test at 375px and 1024px viewports
4. Deploy/demo if ready

### Incremental Delivery

1. Setup → Install Sheet + Skeleton
2. US1 (Interview Tabs) → Test → Deploy (MVP!)
3. US2 (Mobile Nav) → Test → Deploy
4. US3 (Skeletons) → Test → Deploy
5. US4 + US5 + US6 → Test → Deploy (can batch since they're small)
6. Polish → Final validation → Deploy

### Sequential Execution (single developer)

Recommended order: T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009-T012 → T013-T014 → T015 → T016 → T017 → T018 → T019 → T020

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- i18n key tasks (T003, T006) both edit en.json/de.json but in different sections — can run in parallel if careful, or sequence them
- T018 (re-seed) must run after T016 (seed.ts changes)
- Commit after each story checkpoint for clean git history
