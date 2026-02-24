# Tasks: Diagram Export

**Input**: Design documents from `/specs/007-diagram-export/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. US1 (PNG export) is the MVP. US2 (PDF export) adds paper size selection and builds on the same export infrastructure.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Dependencies & i18n)

**Purpose**: Install new dependencies and add i18n keys

- [x] T001 Install jspdf and svg2pdf.js dependencies by running npm install jspdf svg2pdf.js
- [x] T002 [P] Add export-related i18n keys (export, exportPng, exportPdf, exportPaperSize, exporting, exportError) to src/i18n/messages/en.json under the processes namespace
- [x] T003 [P] Add export-related i18n keys (export, exportPng, exportPdf, exportPaperSize, exporting, exportError) to src/i18n/messages/de.json under the processes namespace

**Checkpoint**: Dependencies installed, i18n keys available

---

## Phase 2: Foundational (BpmnViewer Callback + Export Utility)

**Purpose**: Core infrastructure that both user stories depend on

- [x] T004 Add optional onViewerReady callback prop to src/components/processes/bpmn-viewer.tsx: accept onViewerReady?: (viewer: unknown) => void, call it after successful importXML and zoom("fit-viewport") in initViewer(), pass null on destroy cleanup
- [x] T005 Create the export utility file src/lib/export/diagram-export.ts with a helper function sanitizeTitle(title: string) that converts a process title to a safe file name (lowercase, spaces to hyphens, remove special characters)

**Checkpoint**: BpmnViewer exposes viewer via callback, export utility file exists with shared helpers

---

## Phase 3: User Story 1 — Export Diagram as PNG (Priority: P1) 🎯 MVP

**Goal**: Users can export the BPMN diagram as a high-resolution PNG image with one click.

**Independent Test**: Open a process with a BPMN diagram, click export, select PNG, verify a PNG file downloads containing the complete diagram at 2x resolution.

### Implementation for User Story 1

- [x] T006 [US1] Implement exportDiagramAsPng(viewer: unknown, title: string) function in src/lib/export/diagram-export.ts: call saveSVG() on the viewer, parse SVG dimensions, create a Canvas at 2x scale with white background, load SVG as Image via Blob URL, draw to canvas, export via canvas.toBlob("image/png"), trigger download with sanitized file name
- [x] T007 [US1] Add an export button to the process detail page header in src/app/[locale]/projects/[projectId]/processes/[processId]/page.tsx: store viewer ref via onViewerReady callback from BpmnViewer, show an "Export as PNG" button when hasBpmn is true and viewer is ready, call exportDiagramAsPng on click, disable button while diagram is loading, hide when no BPMN

**Checkpoint**: PNG export works end-to-end. Users can download a high-res PNG of the full diagram.

---

## Phase 4: User Story 2 — Export Diagram as PDF with Paper Size (Priority: P2)

**Goal**: Users can export the BPMN diagram as a PDF with selectable paper size (A0–A4) in landscape orientation.

**Independent Test**: Open a process with a BPMN diagram, click export, select PDF, choose A3, verify a landscape A3 PDF downloads with the diagram fitted to the page.

**Depends on**: US1 (same page file, extends export UI)

### Implementation for User Story 2

- [x] T008 [US2] Implement exportDiagramAsPdf(viewer: unknown, title: string, paperSize: string) function in src/lib/export/diagram-export.ts: call saveSVG(), parse SVG to DOM element, create jsPDF with landscape orientation and selected paper size, use svg2pdf.js to render SVG as vector content fitted to page with margins, center the diagram, trigger download with sanitized file name
- [x] T009 [US2] Extend the export UI in src/app/[locale]/projects/[projectId]/processes/[processId]/page.tsx: replace the single PNG button with a dropdown/popover offering "Export as PNG" and "Export as PDF" options, when PDF is selected show paper size sub-options (A0, A1, A2, A3, A4), show loading state during export, show error toast on failure

**Checkpoint**: Both PNG and PDF export work. PDF produces correctly dimensioned landscape documents at all 5 paper sizes.

---

## Phase 5: Polish & Validation

**Purpose**: Final verification

- [x] T010 Run linting with npm run lint and fix any errors introduced by the new code
- [x] T011 Validate implementation against quickstart.md testing checklist (P1 PNG export, P2 PDF export with all paper sizes, edge cases)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — install deps and add i18n keys
- **Foundational (Phase 2)**: Depends on Phase 1 (needs deps installed)
- **US1 (Phase 3)**: Depends on Phase 2 (needs viewer callback and export utility)
- **US2 (Phase 4)**: Depends on Phase 2 + modifies same page file as US1, so runs after US1
- **Polish (Phase 5)**: Depends on all user stories

### Parallel Opportunities

```text
# Phase 1: i18n files in parallel (after T001)
T001 → T002 (en.json) || T003 (de.json)

# Phase 2: Sequential (T005 depends on file created, T004 is independent)
T004 || T005

# Phase 3-4: Sequential (same files)
T006 → T007 → T008 → T009

# Phase 5: Sequential
T010 → T011
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Install deps, add i18n keys (T001–T003)
2. Complete Phase 2: BpmnViewer callback + export utility (T004–T005)
3. Complete Phase 3: PNG export function + button on page (T006–T007)
4. **STOP and VALIDATE**: Test PNG export at various diagram sizes
5. Proceed to US2 for PDF support

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 PNG export → Core export value delivered
3. US2 PDF with paper sizes → Print-ready workshop materials
4. Polish → Lint clean, checklist validated

---

## Notes

- jsPDF and svg2pdf.js should be dynamically imported (code-split) to avoid adding ~300KB to the initial page bundle
- BpmnViewer's onViewerReady callback must also handle the destroy case (pass null) to prevent stale refs
- SVG viewBox parsing: check both `viewBox` and `width`/`height` attributes since bpmn-js may use either
- File name sanitization: remove characters invalid in file names across OS (\ / : * ? " < > |)
