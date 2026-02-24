# Tasks: Process Detail Viewer

**Input**: Design documents from `/specs/006-process-detail-viewer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. US1 (side-by-side desktop layout) is the MVP. US2 (mobile tabs) builds on the same page file sequentially.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (i18n Keys)

**Purpose**: Add all required i18n translations before page rewrite

- [x] T001 [P] Add tabDiagram, tabDocumentation, and noContent i18n keys to src/i18n/messages/en.json under the processes namespace
- [x] T002 [P] Add tabDiagram, tabDocumentation, and noContent i18n keys to src/i18n/messages/de.json under the processes namespace

**Checkpoint**: All i18n keys available for use in page component

---

## Phase 2: User Story 1 — Side-by-Side Process View (Priority: P1) 🎯 MVP

**Goal**: Redesign the process detail page so the BPMN diagram fills the main area (~65-75% width) with the text summary in a fixed-width sidebar (w-96), both filling viewport height. Handle content variations (BPMN only, markdown only, neither).

**Independent Test**: Open a completed process at 1024px+ — large BPMN viewer on left, scrollable text summary on right. Open a process with only BPMN — diagram expands full width. Open a process with neither — empty state message shown.

### Implementation for User Story 1

- [x] T003 [US1] Rewrite the process detail page layout in src/app/[locale]/projects/[projectId]/processes/[processId]/page.tsx: replace stacked Card layout with flexbox side-by-side (BPMN as flex-1, markdown sidebar as w-96 with overflow-y-auto). Set content area height to h-[calc(100vh-10rem)]. Pass height="100%" to BpmnViewer. Keep the existing header (title, creator, status badge, back button) above the content area.
- [x] T004 [US1] Add content variation handling in src/app/[locale]/projects/[projectId]/processes/[processId]/page.tsx: when only bpmnXml exists, render BpmnViewer at full width (no sidebar); when only markdownContent exists, render MarkdownViewer prominently at full width; when neither exists, show an empty state card with the noContent i18n message.
- [x] T005 [US1] Ensure the text summary sidebar scrolls independently (overflow-y-auto) without affecting the BPMN viewer position in src/app/[locale]/projects/[projectId]/processes/[processId]/page.tsx

**Checkpoint**: Desktop side-by-side layout works for all content variations. BPMN is pannable/zoomable. Sidebar scrolls independently.

---

## Phase 3: User Story 2 — Mobile Responsive Layout (Priority: P2)

**Goal**: On viewports below lg (1024px), switch to a tabbed interface with "Diagram" and "Documentation" tabs. Use CSS visibility toggle to keep both components mounted (avoid BPMN re-render).

**Independent Test**: Open a process at 375px width — tabs appear, content swaps without page reload. BPMN fills available width. Text is readable without horizontal scroll.

**Depends on**: User Story 1 (same file, sequential)

### Implementation for User Story 2

- [x] T006 [US2] Add state-based tab switching for mobile layout in src/app/[locale]/projects/[projectId]/processes/[processId]/page.tsx: add activeTab state ("diagram" | "documentation"), render tab buttons below header on screens below lg breakpoint, use hidden/block CSS classes to toggle visibility while keeping both components mounted. Only show tabs when both bpmnXml and markdownContent exist.
- [x] T007 [US2] Ensure BPMN diagram fills available width on mobile and text summary is readable without horizontal scroll in src/app/[locale]/projects/[projectId]/processes/[processId]/page.tsx

**Checkpoint**: Mobile tabbed layout works at 375px, 768px. Content variations still handled correctly on mobile.

---

## Phase 4: Polish & Validation

**Purpose**: Final verification across all viewports and content states

- [x] T008 Run linting with npm run lint and fix any errors introduced by the page rewrite
- [x] T009 Validate implementation against quickstart.md testing checklist (P1 side-by-side layout, P1 content variations, P2 mobile layout)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — i18n keys can be added immediately
- **US1 (Phase 2)**: Depends on Phase 1 (uses noContent key)
- **US2 (Phase 3)**: Depends on US1 (modifies the same page file)
- **Polish (Phase 4)**: Depends on all user stories being complete

### Within-Phase Dependencies

- T001 and T002 are parallel (different files)
- T003 → T004 → T005 are sequential (same file, incremental changes)
- T006 → T007 are sequential (same file, incremental changes)

### Parallel Opportunities

```text
# Phase 1: Both i18n files in parallel
T001 (en.json) || T002 (de.json)

# Phase 2-3: Sequential (all in page.tsx)
T003 → T004 → T005 → T006 → T007

# Phase 4: Sequential
T008 → T009
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Add i18n keys (T001, T002)
2. Complete Phase 2: Desktop side-by-side layout + content variations (T003–T005)
3. **STOP and VALIDATE**: Test at 1024px+ with all content variations
4. Proceed to US2 for mobile support

### Incremental Delivery

1. i18n keys → Foundation ready
2. US1 desktop layout → Core value delivered (big BPMN viewer + sidebar)
3. US2 mobile tabs → Full responsive support
4. Polish → Lint clean, checklist validated

---

## Notes

- All US1 and US2 tasks modify the same file (page.tsx) — must be sequential
- BpmnViewer component already supports dynamic height via props — no component changes needed
- MarkdownViewer component works as-is in sidebar context — no changes needed
- No API changes, no schema changes, no new dependencies
