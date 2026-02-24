# Feature Specification: Process Detail Viewer

**Feature Branch**: `006-process-detail-viewer`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Add the possibility to see documented processes in a big BPMN viewer with a text summary on the side."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Side-by-Side Process View (Priority: P1)

A consultant or employee navigates to a completed process and sees a redesigned detail page: a large, prominent BPMN diagram viewer occupying the main content area, with the text summary displayed in a sidebar panel. This layout puts the visual process diagram front and center — the primary artifact consultants need for workshops — while keeping the written documentation readily accessible alongside it.

**Why this priority**: The BPMN diagram is the primary deliverable for consulting workshops. Making it the dominant visual element (instead of equal-sized stacked cards) directly improves the usefulness of the tool's output. This is the core of the feature request.

**Independent Test**: Navigate to a completed process that has both BPMN XML and markdown content. The page should show a large diagram filling most of the viewport width, with the text summary in a narrower side panel. The diagram should be pannable and zoomable.

**Acceptance Scenarios**:

1. **Given** a completed process with both BPMN XML and markdown content, **When** a user opens the process detail page, **Then** they see a large BPMN diagram viewer on the left/main area and a text summary panel on the right side.
2. **Given** the side-by-side layout is displayed, **When** the user interacts with the BPMN diagram, **Then** they can pan, zoom, and navigate the diagram within the large viewer area.
3. **Given** the side-by-side layout is displayed, **When** the user scrolls the text summary panel, **Then** the summary scrolls independently of the diagram viewer.
4. **Given** a process with BPMN XML but no markdown content, **When** the user opens the process detail page, **Then** the diagram viewer expands to fill the full width (no empty sidebar).
5. **Given** a process with markdown content but no BPMN XML, **When** the user opens the process detail page, **Then** the text summary is displayed prominently (no empty diagram area).

---

### User Story 2 - Mobile Responsive Layout (Priority: P2)

On viewports below 1024px, the side-by-side layout is not practical. The page switches to a stacked layout where the BPMN diagram is shown above the text summary, or the user can toggle between them using tabs (consistent with the interview page pattern).

**Why this priority**: The application already supports mobile viewports across other pages. The new process detail layout must also work on smaller screens to maintain the self-service design principle.

**Independent Test**: Open a process detail page at 375px width. The diagram and text should be accessible without horizontal scrolling, either stacked vertically or switchable via tabs.

**Acceptance Scenarios**:

1. **Given** a viewport below 1024px, **When** the user opens a process detail page, **Then** the layout switches to a stacked or tabbed view instead of side-by-side.
2. **Given** the mobile layout, **When** the user views the BPMN diagram, **Then** the diagram fills the available width and remains pannable/zoomable.
3. **Given** the mobile layout, **When** the user views the text summary, **Then** the full markdown content is readable without horizontal scrolling.

---

### Edge Cases

- What happens when a process has neither BPMN XML nor markdown content (draft status)? The page should show a meaningful empty state indicating the process is not yet documented.
- What happens when the BPMN XML is malformed and fails to render? The diagram area should show an error message while the text summary remains fully functional.
- What happens when the markdown content is very long? The summary panel should scroll independently without affecting the diagram viewer's position.
- What happens when the BPMN diagram is very large (many steps/lanes)? The diagram viewer's pan and zoom controls allow the user to explore the full diagram.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the BPMN diagram in a large viewer area that occupies the majority of the viewport width on desktop (approximately 65-75% of available space).
- **FR-002**: System MUST display the text summary (markdown content) in a sidebar panel alongside the diagram on desktop viewports (1024px and above).
- **FR-003**: The text summary panel MUST scroll independently of the diagram viewer.
- **FR-004**: The BPMN diagram viewer MUST support pan, zoom, and fit-to-viewport interactions.
- **FR-005**: System MUST adapt the layout for viewports below 1024px, switching to a stacked or tabbed arrangement.
- **FR-006**: System MUST handle missing content gracefully: if only BPMN exists, expand the viewer to full width; if only markdown exists, display it prominently; if neither exists, show an empty state.
- **FR-007**: System MUST preserve the existing process metadata header (title, creator, status, back button) above the content area.
- **FR-008**: The BPMN diagram viewer MUST fill the available vertical space (at least the viewport height minus the header) to maximize the diagram's visual impact.

### Key Entities

- **ProcessEntry**: Existing entity with `title`, `status`, `markdownContent` (nullable text), `bpmnXml` (nullable text), `createdBy` relationship. No schema changes needed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users viewing a process detail page see the BPMN diagram at a minimum of 60% of the viewport width on desktop, compared to the current card-based layout.
- **SC-002**: The text summary is visible alongside the diagram without requiring the user to scroll down or navigate to a separate section.
- **SC-003**: Users can pan and zoom the BPMN diagram within 1 second of page load (no additional clicks required to enter an interactive mode).
- **SC-004**: The process detail page renders correctly at viewports 375px, 768px, 1024px, and 1920px with no content overflow or hidden information.
- **SC-005**: Page load time for a process with both BPMN and markdown content remains under 3 seconds.

## Assumptions

- The existing BPMN viewer component (which uses pan/zoom via NavigatedViewer) can be reused with a larger container size.
- The existing markdown viewer component can be reused in the sidebar panel.
- The process detail API already returns all needed data (`bpmnXml`, `markdownContent`, metadata). No API changes required.
- The header (title, status, back button) retains its current design; only the content area below it changes layout.
- Mobile responsive behavior follows the same tabbed pattern used on the interview page (Chat/Summary tabs).

## Scope Boundaries

### In Scope

- Redesigning the process detail page layout (side-by-side diagram + text)
- Making the BPMN viewer larger and more prominent
- Adding independent scroll for the text summary panel
- Mobile responsive layout (stacked/tabbed below 1024px)
- Handling edge cases for missing content (no BPMN, no markdown, neither)

### Out of Scope

- BPMN diagram editing capabilities (view-only)
- Exporting or downloading the diagram or documentation
- Adding new data fields to the process model
- Changing the process list page or project detail page
- Print-optimized layout
