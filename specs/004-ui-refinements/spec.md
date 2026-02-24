# Feature Specification: UI Refinements

**Feature Branch**: `004-ui-refinements`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Polish layout, responsiveness, and navigation flows for mobile and desktop"

## Clarifications

### Session 2026-02-24

- Q: What mobile layout pattern should the interview page use for chat and summary on viewports below 1024px? → A: Tabs — chat and summary as switchable tabs; one visible at a time.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mobile Interview Experience (Priority: P1)

An employee opens the interview page on a mobile phone to describe a business process. Currently the summary panel is completely hidden on screens below the `lg` breakpoint, meaning mobile users never see the live summary, BPMN diagram, or the "Generate Diagram" button. After this refinement, the interview page uses a tabbed layout on viewports below 1024px — the user can switch between a "Chat" tab and a "Summary" tab, with one visible at a time. On desktop (1024px+), the side-by-side layout remains unchanged.

**Why this priority**: The interview is the core user-facing feature. Hiding half of it on mobile makes the app unusable for employees who aren't at a desktop. This is the highest-impact fix.

**Independent Test**: Can be tested by opening the interview page on a 375px-wide viewport and verifying both chat and summary content are accessible.

**Acceptance Scenarios**:

1. **Given** an employee on a mobile device (viewport < 1024px), **When** they open an active interview, **Then** the page displays tabbed navigation with "Chat" and "Summary" tabs, defaulting to the Chat tab.
2. **Given** an employee on a mobile device viewing the Chat tab, **When** the summary updates live via SSE, **Then** the Summary tab shows a visual indicator (e.g., dot or badge) that new content is available.
3. **Given** an employee on a tablet device (768px–1023px), **When** they view the interview, **Then** the layout adapts to use available space without content overflow or horizontal scrolling.

---

### User Story 2 - Mobile Navigation (Priority: P2)

A user (employee or consultant) opens the app on a mobile phone. The header navigation currently displays all links, language switcher, and user dropdown in a single row. On narrow screens this is cramped or overflows. After this refinement, navigation collapses into a hamburger menu on mobile with a slide-out or dropdown panel.

**Why this priority**: Navigation is the entry point to all features. Broken navigation on mobile blocks every workflow.

**Independent Test**: Can be tested by resizing to 375px width and verifying all navigation items are reachable through the mobile menu.

**Acceptance Scenarios**:

1. **Given** a user on a viewport narrower than 768px, **When** the page loads, **Then** the navigation links collapse into a hamburger/menu icon.
2. **Given** a user on mobile who taps the hamburger icon, **When** the menu opens, **Then** all navigation links, language switcher, and sign-out option are visible and tappable.
3. **Given** a user on a viewport wider than 768px, **When** the page loads, **Then** the full horizontal navigation displays as it does today.

---

### User Story 3 - Loading State Polish (Priority: P3)

A consultant navigates to the projects list or an employee opens their dashboard. Currently, loading states show plain text like "Loading..." with no visual structure. After this refinement, loading states use skeleton placeholders that match the shape of the content being loaded, giving users a sense of what to expect.

**Why this priority**: Skeleton loaders reduce perceived wait time and make the app feel more polished and professional. They don't add functionality but significantly improve perceived quality.

**Independent Test**: Can be tested by throttling network speed and verifying skeleton placeholders appear before content renders on the projects list, dashboard, and interview pages.

**Acceptance Scenarios**:

1. **Given** a user navigates to the projects list, **When** data is loading, **Then** skeleton placeholders matching the card grid layout are displayed instead of plain text.
2. **Given** an employee opens the dashboard, **When** interviews are loading, **Then** skeleton rows matching the interview list shape are shown.
3. **Given** a user opens any page with a loading state, **When** data arrives, **Then** the skeleton smoothly transitions to the real content without layout shift.

---

### User Story 4 - Responsive Form Layouts (Priority: P4)

A consultant creates a new project or configures project settings on a tablet or mobile device. Currently, form grids use fixed column counts (e.g., 3-column category inputs) that become cramped on narrow screens. After this refinement, form layouts adapt to the viewport width with appropriate column counts per breakpoint.

**Why this priority**: Forms are used less frequently than the interview or dashboard, but broken form layouts on mobile prevent consultants from managing projects outside of a desktop.

**Independent Test**: Can be tested by opening the project creation and settings pages at 375px, 768px, and 1024px viewports and verifying inputs are not truncated or overlapping.

**Acceptance Scenarios**:

1. **Given** a consultant on a mobile device, **When** they open the project creation form, **Then** form fields stack vertically with full-width inputs.
2. **Given** a consultant on a tablet, **When** they edit project settings with category inputs, **Then** the grid adapts to 2 columns instead of 3.
3. **Given** a consultant on desktop, **When** they use any form, **Then** the layout remains unchanged from the current behavior.

---

### User Story 5 - BPMN Viewer Dark Mode (Priority: P5)

A user with dark mode enabled views a process diagram. Currently the BPMN viewer has a hardcoded white background, creating a jarring bright rectangle in an otherwise dark interface. After this refinement, the BPMN viewer respects the active color theme.

**Why this priority**: A cosmetic but noticeable issue. Dark mode users will see it every time they view a diagram, but it doesn't block any workflow.

**Independent Test**: Can be tested by enabling dark mode and viewing a process with a BPMN diagram, verifying the viewer background matches the surrounding card background.

**Acceptance Scenarios**:

1. **Given** a user with dark mode enabled, **When** they view a process diagram, **Then** the BPMN viewer background matches the card's dark background color.
2. **Given** a user with light mode enabled, **When** they view a process diagram, **Then** the BPMN viewer appears as it does today with a light background.

---

### User Story 6 - Employee Password Login for Development (Priority: P6)

A developer testing the app locally needs to log in as an employee. Currently, employee login only supports magic links, requiring the developer to check the server console for the link on every login. After this refinement, the employee login form in the development environment also accepts a name and password, matching the consultant login experience.

**Why this priority**: Quality-of-life improvement for development and testing. Does not affect production behavior. Lowest priority since it only impacts developers, not end users.

**Independent Test**: Can be tested by starting the dev server, navigating to the employee login, and signing in with email and password credentials from the seed data.

**Acceptance Scenarios**:

1. **Given** the app is running in development mode, **When** an employee visits the login page, **Then** the employee login form offers email and password fields (in addition to or instead of magic link).
2. **Given** a seeded employee account exists, **When** the developer enters the employee's email and password, **Then** they are authenticated and redirected to the dashboard.
3. **Given** the app is running in production mode, **When** an employee visits the login page, **Then** only the magic link flow is available (password login is not exposed).

---

### Edge Cases

- What happens when the mobile menu is open and the user rotates the device to landscape? The menu should remain functional and not overflow.
- What happens on very small viewports (< 320px)? Content should not horizontally overflow; a minimum supported width of 320px is assumed.
- What happens when skeleton loaders are shown but the network request fails? The error state should replace the skeleton, not overlay it.
- What happens when the user switches between Chat and Summary tabs rapidly? The tab content should remain stable and not trigger redundant data fetches.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The interview page MUST display a tabbed layout (Chat / Summary tabs) on viewports below 1024px, showing one panel at a time. On viewports 1024px and wider, the existing side-by-side layout MUST be preserved.
- **FR-002**: The header navigation MUST collapse into a toggle-able mobile menu on viewports below 768px wide.
- **FR-003**: The mobile menu MUST include all navigation links, the language switcher, and the sign-out action.
- **FR-004**: Loading states on the projects list, dashboard, and interview pages MUST display skeleton placeholders instead of plain text.
- **FR-005**: Skeleton placeholders MUST match the approximate shape and layout of the content they replace.
- **FR-006**: Form layouts (project creation, project settings) MUST adapt column counts based on viewport width, stacking to single-column on mobile.
- **FR-007**: The BPMN viewer MUST use a background color that respects the active light/dark theme.
- **FR-008**: No layout MUST produce horizontal scrolling on viewports 320px wide or larger.
- **FR-009**: All interactive elements (buttons, links, inputs) MUST have a minimum tap target size of 44x44 pixels on touch devices.
- **FR-010**: Transitions between loading and loaded states MUST not cause visible layout shift (content jumping).
- **FR-011**: When the interview is in tabbed mode and a live summary update arrives while the user is on the Chat tab, the Summary tab MUST display a visual indicator that new content is available.
- **FR-012**: In development mode, the employee login MUST support email and password authentication. In production mode, employee login MUST remain magic-link only.

### Assumptions

- The minimum supported viewport width is 320px (iPhone SE / small Android devices).
- Breakpoints follow standard Tailwind conventions: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- The existing page structure and component hierarchy remain unchanged; this feature only modifies presentation and layout behavior.
- Dark mode is already supported via CSS custom properties; only the BPMN viewer needs correction.
- No new pages, routes, or data models are introduced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All pages are fully usable (no hidden content, no horizontal overflow) at 375px viewport width.
- **SC-002**: The interview page's chat and summary content are both accessible via tabs on mobile without requiring a screen wider than 768px.
- **SC-003**: Navigation is fully functional (all links and actions reachable) on viewports from 320px to 1920px.
- **SC-004**: Loading states display structured skeleton placeholders on all primary pages (projects list, dashboard, interview).
- **SC-005**: The BPMN viewer renders with appropriate background color in both light and dark themes.
- **SC-006**: No page produces horizontal scrolling at any viewport width between 320px and 1920px.
- **SC-007**: Form inputs are not truncated or overlapping on any viewport width between 320px and 1920px.
