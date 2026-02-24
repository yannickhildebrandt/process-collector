# Feature Specification: Diagram Export

**Feature Branch**: `007-diagram-export`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Add function to export the diagram out of the detail view as PNG, or PDF (if PDF, A0, A1, A2, A3, A4 format for print)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export Diagram as PNG (Priority: P1)

A consultant or employee opens the process detail page and wants to share or embed the BPMN diagram in a presentation or document. They click an export button near the diagram viewer, select "PNG", and a high-resolution PNG image of the full diagram is downloaded to their device.

**Why this priority**: PNG is the most universally supported image format and covers the broadest set of use cases (presentations, emails, messaging, wikis). It requires no additional configuration from the user — one click and done.

**Independent Test**: Open a process with a BPMN diagram, click the export button, select PNG, and verify a PNG file downloads containing the complete diagram.

**Acceptance Scenarios**:

1. **Given** a process detail page with a BPMN diagram, **When** the user clicks the export button and selects PNG, **Then** a PNG image of the complete diagram is downloaded.
2. **Given** a BPMN diagram with many elements that extends beyond the visible viewport, **When** the user exports as PNG, **Then** the exported image includes the full diagram (not just the visible portion).
3. **Given** a process with no BPMN diagram (markdown only or empty), **When** the user views the page, **Then** the export button is not shown.

---

### User Story 2 - Export Diagram as PDF with Paper Size (Priority: P2)

A consultant needs to print the BPMN diagram for a workshop. They click the export button, select "PDF", choose a paper size (A0, A1, A2, A3, or A4), and a PDF is downloaded that fits the diagram to the selected paper dimensions in landscape orientation. The PDF is ready for printing at the chosen size.

**Why this priority**: PDF export with paper size selection is the core requirement for print-ready workshop materials. It builds on the same export mechanism as PNG but adds format and sizing options. A0–A4 coverage handles everything from wall posters to handouts.

**Independent Test**: Open a process with a BPMN diagram, click export, select PDF, choose A3 paper size, and verify a landscape A3 PDF downloads with the diagram fitted to the page.

**Acceptance Scenarios**:

1. **Given** a process detail page with a BPMN diagram, **When** the user clicks export and selects PDF, **Then** a paper size selection appears offering A0, A1, A2, A3, and A4.
2. **Given** the user selects PDF with A4 paper size, **When** the export completes, **Then** a PDF file is downloaded with A4 landscape dimensions and the diagram fitted to the page.
3. **Given** a large diagram exported as A4, **When** the user opens the PDF, **Then** the diagram is scaled to fit the page while remaining legible (labels and annotations are readable).
4. **Given** the user selects A0 paper size, **When** the export completes, **Then** the PDF dimensions match A0 (841 × 1189 mm landscape) and the diagram fills the available space.

---

### Edge Cases

- What happens when the diagram is very simple (2-3 elements) and exported to A0? The diagram should be centered on the page with appropriate whitespace, not stretched to fill the entire area.
- What happens if the export fails (e.g., rendering issue)? The user should see an error message and be able to retry.
- What happens if the user exports while the diagram is still loading? The export button should be disabled until the diagram has fully rendered.
- What happens when the user is on a mobile device? The export button should still be accessible and functional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an export button on the process detail page when a BPMN diagram is present.
- **FR-002**: System MUST support exporting the diagram as a PNG image.
- **FR-003**: The PNG export MUST capture the complete diagram at a resolution suitable for presentations (minimum 2x display resolution).
- **FR-004**: System MUST support exporting the diagram as a PDF document.
- **FR-005**: When PDF is selected, the system MUST offer paper size selection: A0, A1, A2, A3, and A4.
- **FR-006**: The PDF MUST use landscape orientation and fit the diagram to the selected paper dimensions.
- **FR-007**: The exported diagram (PNG or PDF) MUST include all elements, labels, and annotations — not just the visible viewport.
- **FR-008**: The export button MUST be hidden when no BPMN diagram is available.
- **FR-009**: The export button MUST be disabled while the diagram is still loading or rendering.
- **FR-010**: The exported file name MUST include the process title for easy identification (e.g., "Raw-Materials-Procurement.png").

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can export a BPMN diagram as PNG within 3 seconds of clicking the export button.
- **SC-002**: Users can export a BPMN diagram as PDF with a selected paper size within 5 seconds.
- **SC-003**: 100% of diagram elements visible in the viewer are present in the exported file.
- **SC-004**: PDF exports at all 5 paper sizes (A0–A4) produce correctly dimensioned documents with the diagram fitted to the page.
- **SC-005**: Exported PNG images have sufficient resolution for full-screen presentation display (minimum 1920px wide for standard diagrams).

## Assumptions

- The export is performed entirely in the browser (client-side). No server-side rendering is needed since the BPMN diagram is already rendered in the client via bpmn-js.
- Landscape orientation is the default for PDF exports, as BPMN diagrams are typically wider than they are tall.
- The export captures the diagram in its current visual state (light background, standard BPMN styling).
- The process title is available on the page and can be used for the exported file name.
- Both consultants and employees have access to the export functionality (same permissions as viewing the process).

## Scope Boundaries

### In Scope

- Export button on the process detail page
- PNG export of the full BPMN diagram
- PDF export with A0, A1, A2, A3, A4 paper size selection
- Landscape orientation for PDF
- File naming based on process title
- Disabling export while diagram loads

### Out of Scope

- Exporting the text summary / markdown content
- Batch export of multiple processes
- Custom paper sizes beyond A0–A4
- Portrait orientation option
- Watermarks or branding on exports
- BPMN XML file download (raw data export)
- Server-side rendering or generation
