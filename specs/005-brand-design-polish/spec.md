# Feature Specification: Brand Design Polish

**Feature Branch**: `005-brand-design-polish`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "UI and design refinements. Design should match the general design of our company https://eggers-partner.de/. Further, every time I hit the button 'generate diagram' the diagram should be regenerated based on the current summary."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - BPMN Diagram Regeneration (Priority: P1)

During an interview, the consultant or employee reviews the live text summary and wants to see an up-to-date process diagram. They click the "Generate Diagram" button and the system generates a new BPMN diagram based on the **current** summary content, replacing any previously displayed diagram. Each subsequent click regenerates the diagram from scratch using the latest summary state.

**Why this priority**: The current diagram generation may show stale results if the summary has changed since the last generation. Ensuring each click produces a fresh diagram from the current summary is a functional correctness issue that directly affects the core interview workflow.

**Independent Test**: Start an interview, send several messages, click "Generate Diagram" to see initial diagram, send more messages so the summary updates, click "Generate Diagram" again — the diagram should reflect the updated summary content (new steps, changed process flow).

**Acceptance Scenarios**:

1. **Given** an interview with an existing summary and no diagram displayed, **When** the user clicks "Generate Diagram", **Then** a BPMN diagram is generated from the current summary and displayed in the diagram area.
2. **Given** an interview with a previously generated diagram and a summary that has been updated since, **When** the user clicks "Generate Diagram", **Then** the old diagram is replaced with a new one reflecting the updated summary.
3. **Given** an interview where the summary is currently being extracted (SSE in progress), **When** the user clicks "Generate Diagram", **Then** the diagram is generated from whatever summary content is currently available.
4. **Given** an interview with no summary yet (no messages exchanged), **When** the user views the diagram section, **Then** the "Generate Diagram" button is visible but disabled, with placeholder text indicating no summary is available yet.

---

### User Story 2 - Brand Color Scheme (Priority: P2)

All users of the application see a visual design that reflects the Eggers & Partner corporate identity. The color palette shifts from generic defaults to the company brand colors: a clean white background, dark charcoal text, and cyan-blue accent colors for interactive elements and highlights. The overall aesthetic conveys professionalism and modern corporate design.

**Why this priority**: Brand alignment builds trust with clients and creates a cohesive experience between the company website and the internal tool. This is the most visible design change.

**Independent Test**: Open any page in the application — the primary colors, backgrounds, and accent colors should visually match the Eggers & Partner website (white backgrounds, dark text, cyan-blue accents, rounded buttons).

**Acceptance Scenarios**:

1. **Given** a user opens the application, **When** they view any page, **Then** the background is predominantly white, text is dark charcoal, and interactive elements use cyan-blue accent coloring.
2. **Given** a user views buttons throughout the application, **When** they see primary action buttons, **Then** the buttons have rounded styling (pill shape) consistent with the company website design.
3. **Given** a user switches to dark mode, **When** they view the application, **Then** the dark mode palette uses complementary tones derived from the brand colors (dark backgrounds with appropriate contrast, cyan-blue accents preserved).

---

### User Story 3 - Typography and Spacing (Priority: P3)

Text throughout the application uses clean, professional typography consistent with the Eggers & Partner website. Headings are bold and appropriately sized, body text is legible and well-spaced, and the overall spacing between elements creates a refined, uncluttered layout.

**Why this priority**: Typography and spacing refinements complete the brand alignment after colors are applied, creating the full professional impression.

**Independent Test**: Compare any page of the application side-by-side with eggers-partner.de — the text styling, heading hierarchy, and whitespace rhythm should feel consistent and professional.

**Acceptance Scenarios**:

1. **Given** a user views page headings, **When** they compare to the company website, **Then** the heading style (weight, size, spacing) conveys the same professional tone.
2. **Given** a user views body text and form labels, **When** they read content, **Then** the text is legible, appropriately sized, and has comfortable line height and spacing.
3. **Given** a user views cards and content sections, **When** they assess the layout, **Then** the spacing between elements is generous and consistent, avoiding a cramped appearance.

---

### Edge Cases

- What happens when the summary is empty and the user clicks "Generate Diagram"? The button should be disabled or show a message indicating no summary is available to generate from.
- What happens when diagram generation fails (e.g., the summary content cannot be parsed into valid BPMN)? An error message should be displayed in the diagram area, and the user can retry.
- What happens when the user rapidly clicks "Generate Diagram" multiple times? Only the latest request should be processed; earlier in-flight requests should be superseded.
- What happens when brand colors conflict with accessibility requirements (contrast ratios)? Accessibility takes precedence — colors must meet WCAG AA contrast standards.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST regenerate the BPMN diagram from the current summary content each time the user clicks the "Generate Diagram" button, replacing any previously displayed diagram.
- **FR-002**: System MUST disable the "Generate Diagram" button when no summary content exists yet.
- **FR-003**: System MUST show a loading indicator while diagram generation is in progress.
- **FR-004**: System MUST display an error message in the diagram area if generation fails, with the ability to retry.
- **FR-005**: System MUST cancel any in-progress diagram generation when a new generation is requested (debounce rapid clicks).
- **FR-006**: System MUST apply the Eggers & Partner brand color palette across all pages: white (#ffffff) backgrounds, dark charcoal (#212121) text, cyan-blue (#0693e3) accents for interactive elements.
- **FR-007**: System MUST style primary action buttons with rounded (pill-shaped) corners and brand-appropriate colors, matching the company website button style.
- **FR-008**: System MUST maintain WCAG AA contrast compliance for all text and interactive elements after brand color changes.
- **FR-009**: System MUST provide a dark mode variant that preserves brand accent colors while using dark backgrounds with sufficient contrast.
- **FR-010**: System MUST use clean, professional typography with appropriate heading hierarchy, body text sizing, and consistent spacing throughout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can regenerate the BPMN diagram within 5 seconds of clicking the "Generate Diagram" button, and the diagram reflects the current summary content.
- **SC-002**: 100% of pages in the application display the brand color scheme (white backgrounds, dark text, cyan-blue accents) — no pages retain the old default styling.
- **SC-003**: All text and interactive elements meet WCAG AA contrast ratio (minimum 4.5:1 for normal text, 3:1 for large text).
- **SC-004**: Users comparing the application side-by-side with eggers-partner.de perceive a consistent visual identity (same color family, button style, and typographic tone).
- **SC-005**: Dark mode preserves brand accent colors and maintains the same WCAG AA contrast standards.

## Assumptions

- The Eggers & Partner website design language (as observed February 2026) serves as the visual reference: white dominant backgrounds, dark charcoal text (#212121), cyan-blue accents (#0693e3), pill-shaped buttons, clean sans-serif typography.
- The existing dark mode toggle functionality remains; only the color tokens are updated.
- The "Generate Diagram" button already exists in the summary panel; the change ensures it always regenerates from current (not cached) summary data.
- No new fonts need to be licensed — the system sans-serif stack (matching the company website approach) is sufficient.
- Brand color changes apply globally via theme tokens, not on a per-component basis.

## Scope Boundaries

### In Scope

- BPMN diagram regeneration behavior (always from current summary)
- Brand color palette application (all pages)
- Button styling (rounded/pill shape)
- Typography refinement (sizing, spacing, hierarchy)
- Dark mode color adaptation
- Accessibility compliance for new colors

### Out of Scope

- Adding the Eggers & Partner logo to the application header
- Redesigning page layouts or information architecture
- Adding new pages or features
- Changing the application's functionality beyond diagram regeneration behavior
- Custom font licensing or embedding
