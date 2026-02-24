# Tasks: Brand Design Polish

**Input**: Design documents from `/specs/005-brand-design-polish/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not included — no E2E framework in project yet. Manual visual testing per quickstart.md.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths included in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add i18n keys needed by multiple stories

- [x] T001 [P] Add i18n keys for BPMN diagram UX in `src/i18n/messages/en.json`: add `"bpmnRegenerate": "Regenerate Diagram"`, `"bpmnGenerating": "Generating..."`, `"bpmnError": "Failed to generate diagram. Click to retry."`, `"bpmnNoSummary": "Send some messages first to generate a diagram."` under the `interview` section.
- [x] T002 [P] Add German i18n keys for BPMN diagram UX in `src/i18n/messages/de.json`: add `"bpmnRegenerate": "Diagramm neu erstellen"`, `"bpmnGenerating": "Erstelle..."`, `"bpmnError": "Diagramm konnte nicht erstellt werden. Klicken zum Wiederholen."`, `"bpmnNoSummary": "Senden Sie zuerst einige Nachrichten, um ein Diagramm zu erstellen."` under the `interview` section.

**Checkpoint**: i18n keys available for implementation.

---

## Phase 2: User Story 1 — BPMN Diagram Regeneration (Priority: P1) — MVP

**Goal**: Each click of "Generate Diagram" regenerates from the current summary. Button disabled when no summary. Error state displayed with retry. Button text differentiates first generation from regeneration.

**Independent Test**: Start interview, send messages, generate diagram, send more messages, click "Generate Diagram" again — new diagram reflects updated summary.

### Implementation for User Story 1

- [x] T003 [US1] Improve BPMN regeneration UX in `src/components/interview/summary-panel.tsx`: (1) Add `bpmnError` boolean state alongside existing `bpmnXml` state. (2) In `handleGenerateBpmn`, set `bpmnError = false` before generating, and on catch set `bpmnError = true` (instead of just setting `bpmnXml` to null). (3) When `bpmnError` is true, display error message from `t("bpmnError")` with a retry button that calls `handleGenerateBpmn` again. (4) Change button text: show `t("bpmnGenerate")` when `bpmnXml` is null and no error, show `t("bpmnRegenerate")` when `bpmnXml` already exists (diagram was previously generated). (5) When `!summary?.steps?.length`, show the `t("bpmnNoSummary")` placeholder text instead of `t("bpmnPlaceholder")` and hide the generate button entirely.

**Checkpoint**: BPMN diagram always regenerates from current summary. Error states handled. Button text contextual.

---

## Phase 3: User Story 2 — Brand Color Scheme (Priority: P2)

**Goal**: Application colors match Eggers & Partner corporate identity: white backgrounds, dark charcoal text, cyan-blue (#0693e3) accents, pill-shaped primary buttons.

**Independent Test**: Open any page — colors match eggers-partner.de. Primary buttons are cyan-blue with pill shape. Dark mode preserves cyan-blue accent.

### Implementation for User Story 2

- [x] T004 [US2] Update light mode theme tokens in `src/app/globals.css`: in the `:root` block, change `--primary` from `oklch(0.205 0 0)` to `oklch(0.623 0.173 245.28)` (cyan-blue #0693e3), change `--ring` from `oklch(0.708 0 0)` to `oklch(0.623 0.173 245.28)` (matching cyan-blue focus rings). Keep `--primary-foreground` as white.
- [x] T005 [US2] Update dark mode theme tokens in `src/app/globals.css`: in the `.dark` block, change `--primary` from `oklch(0.922 0 0)` to `oklch(0.68 0.173 245.28)` (lighter cyan-blue for dark backgrounds), change `--primary-foreground` from `oklch(0.205 0 0)` to `oklch(1 0 0)` (white text on blue buttons), change `--ring` from `oklch(0.556 0 0)` to `oklch(0.68 0.173 245.28)` (cyan-blue focus rings). Also update `--sidebar-primary` from `oklch(0.488 0.243 264.376)` to `oklch(0.68 0.173 245.28)` to match the new primary.
- [x] T006 [US2] Update button component for pill-shaped primary buttons in `src/components/ui/button.tsx`: remove `rounded-md` from the base CVA class string. Add `rounded-full` to the `default` and `destructive` variant classes. Add `rounded-md` to the `outline`, `secondary`, `ghost`, and `link` variant classes. This makes primary action buttons pill-shaped while keeping other button styles with standard rounding.

**Checkpoint**: All pages show brand colors. Primary buttons are cyan-blue and pill-shaped. Dark mode works with cyan-blue accent.

---

## Phase 4: User Story 3 — Typography and Spacing (Priority: P3)

**Goal**: Typography and spacing convey the same professional, clean tone as eggers-partner.de.

**Independent Test**: Compare application pages side-by-side with eggers-partner.de — consistent professional feel.

### Implementation for User Story 3

- [x] T007 [US3] Review and adjust typography in `src/app/globals.css`: add a subtle `letter-spacing: -0.01em` to headings via a new `@layer base` rule targeting `h1, h2, h3, h4` for tighter heading letter spacing (matching the professional, compact heading style of the company website). Keep Geist font family unchanged. Verify body text line-height is comfortable (Tailwind default `leading-normal` = 1.5 is appropriate).

**Checkpoint**: Typography feels professional and clean. Headings have appropriate weight and spacing.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate all stories work together

- [x] T008 Verify WCAG AA contrast compliance: check cyan-blue (#0693e3) on white background meets 4.5:1 ratio for normal text and 3:1 for large text. Check white text on cyan-blue buttons meets the same. Check dark mode variants. If any fail, adjust the OKLch lightness value in `src/app/globals.css` to achieve compliance while staying as close to brand color as possible.
- [x] T009 Run through `specs/005-brand-design-polish/quickstart.md` testing checklist end-to-end and verify all items pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Setup (T001-T002 for new i18n keys)
- **US2 (Phase 3)**: No dependency on Setup or US1 — can start immediately
- **US3 (Phase 4)**: No dependency on other stories — can start immediately
- **Polish (Phase 5)**: Depends on all stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — no dependency on other stories
- **US2 (P2)**: Independent — no dependency on other stories
- **US3 (P3)**: Independent — no dependency on other stories

All stories touch different files and can be implemented in any order or in parallel.

### Parallel Opportunities

- T001, T002 can run in parallel (both edit i18n files but different languages)
- T004, T005 must be sequential (both edit globals.css, same file)
- T004/T005 and T006 can run in parallel (different files: globals.css vs button.tsx)
- US1 (T003), US2 (T004-T006), and US3 (T007) touch different files and can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: US1 — BPMN Diagram Regeneration (T003)
3. **STOP and VALIDATE**: Test diagram regeneration behavior
4. Deploy/demo if ready

### Incremental Delivery

1. Setup → i18n keys
2. US1 (BPMN Regeneration) → Test → Deploy (MVP!)
3. US2 (Brand Colors + Buttons) → Test → Deploy
4. US3 (Typography) → Test → Deploy
5. Polish → Final validation → Deploy

### Sequential Execution (single developer)

Recommended order: T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- i18n key tasks (T001, T002) edit en.json/de.json respectively — can run in parallel
- T004 and T005 both edit globals.css — must run sequentially
- Commit after each story checkpoint for clean git history
