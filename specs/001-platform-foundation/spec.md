# Feature Specification: Platform Foundation

**Feature Branch**: `001-platform-foundation`
**Created**: 2026-02-23
**Status**: Draft
**Input**: User description: "Platform foundation for the Process Collector — an AI-guided business process capture assistant. This feature establishes the core technical platform: project scaffolding, authentication, database schema, LLM abstraction layer, client/project configuration system, and the base web application shell."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultant Creates a Client Project (Priority: P1)

A consultant logs into the Process Collector admin area and creates a new client project (engagement). They provide the client name, industry, relevant process categories, and any custom terminology or interview templates. The system stores this as configuration data. The consultant then receives a shareable link or access credentials to distribute to the client's employees.

**Why this priority**: Without a way to set up a client project, no other functionality can be used. This is the entry point for every engagement and validates the "configuration as data" principle.

**Independent Test**: Can be fully tested by a consultant logging in, creating a project with sample configuration, and verifying the project appears in their dashboard with correct settings.

**Acceptance Scenarios**:

1. **Given** a consultant is authenticated, **When** they fill in the project setup form (client name, industry, process categories), **Then** a new client project is created and visible in their project list.
2. **Given** a client project exists, **When** the consultant views its details, **Then** all configured settings (industry, categories, terminology) are displayed correctly.
3. **Given** a client project is created, **When** the consultant generates access credentials for employees, **Then** shareable access details are produced that employees can use to log in.

---

### User Story 2 - Employee Logs In and Sees the Dashboard (Priority: P2)

A client employee receives access credentials from their consultant. They open the web application in their browser, authenticate, and land on a dashboard showing their assigned project context. The dashboard displays a welcome message, the list of process categories relevant to their engagement, and a clear call-to-action to start documenting a process. The interface is intuitive enough that no training beyond the onboarding text is needed.

**Why this priority**: Employees are the primary users of the tool. They must be able to access the system and understand what to do before any interview or process capture can happen. This validates the "self-service by design" principle.

**Independent Test**: Can be fully tested by an employee logging in with valid credentials and verifying they see their project context, process categories, and the option to start capturing a process.

**Acceptance Scenarios**:

1. **Given** an employee has valid credentials, **When** they navigate to the application URL and log in, **Then** they see a dashboard showing their project name, industry context, and available process categories.
2. **Given** an employee is on the dashboard, **When** they look for next steps, **Then** a prominent call-to-action to "Document a new process" is visible without scrolling.
3. **Given** an employee enters invalid credentials, **When** they attempt to log in, **Then** a clear, non-technical error message is displayed with guidance on how to get help.

---

### User Story 3 - System Sends a Prompt to the LLM and Receives a Response (Priority: P3)

A developer (or the system itself during an interview flow) sends a structured prompt through the LLM abstraction layer. The abstraction layer routes the request to the configured LLM provider (initially Claude API), handles the response, and returns a normalized result. If the provider fails or is unavailable, the system returns a clear error. The provider can be swapped by changing configuration without modifying business logic.

**Why this priority**: The LLM abstraction layer is the technical backbone for the AI-guided interview feature (a future spec). Validating it early de-risks the most architecturally novel component and proves the "LLM-agnostic" principle.

**Independent Test**: Can be fully tested by sending a sample prompt through the abstraction layer and verifying a normalized response is returned. Can also be tested with a mock provider to verify swap capability without requiring a live API key.

**Acceptance Scenarios**:

1. **Given** the LLM abstraction layer is configured with a provider (e.g., Claude API), **When** a prompt is submitted, **Then** the system returns a normalized response containing the LLM's output.
2. **Given** the LLM provider is unavailable or returns an error, **When** a prompt is submitted, **Then** the system returns a user-friendly error message without exposing provider internals.
3. **Given** a mock LLM provider is configured instead of a real one, **When** a prompt is submitted, **Then** the system returns the mock response, proving the provider is swappable via configuration alone.

---

### User Story 4 - Consultant Views Process Output Placeholder (Priority: P4)

A consultant navigates to a completed process entry (stubbed/placeholder in this foundation feature) and sees the structured output area: a Markdown-rendered process description and an embedded bpmn.js diagram viewer. In this foundation phase, the content is sample/demo data, but the rendering infrastructure is fully functional. The BPMN viewer allows basic pan and zoom on the sample diagram.

**Why this priority**: Establishing the output rendering pipeline (Markdown + bpmn.js) early validates the "structured output" principle and proves the front-end integration with bpmn.js works before real process data flows through the system.

**Independent Test**: Can be tested by navigating to a demo process page and verifying that sample Markdown renders correctly and the bpmn.js viewer loads and displays a sample BPMN diagram with pan/zoom.

**Acceptance Scenarios**:

1. **Given** a demo process entry exists, **When** a user navigates to its detail page, **Then** the Markdown process description renders with proper formatting (headings, lists, bold text).
2. **Given** a demo process entry exists, **When** a user views the BPMN section, **Then** the bpmn.js viewer loads and displays a sample BPMN 2.0 diagram.
3. **Given** the bpmn.js viewer is loaded, **When** the user pans or zooms, **Then** the diagram responds to these interactions smoothly.

---

### Edge Cases

- What happens when a consultant tries to create a project with a duplicate client name? The system MUST warn and require confirmation or a unique identifier.
- What happens when an employee's access credentials expire or are revoked mid-session? The system MUST redirect to login with a clear message.
- What happens when the LLM provider API key is missing or invalid at startup? The system MUST log the configuration error and display a maintenance message rather than crashing.
- What happens when the bpmn.js library fails to load (e.g., network issue for CDN)? The system MUST show a fallback message indicating the diagram is temporarily unavailable.
- What happens when multiple consultants try to edit the same project configuration simultaneously? The system MUST prevent silent overwrites (last-write-wins without warning).

## Out of Scope

The following capabilities are explicitly deferred to future feature specifications:

- **AI interview flow**: The structured conversational interview that guides employees through process capture.
- **Process validation/approval**: Workflow for consultants to review and approve captured processes.
- **Data export**: Exporting process models as standalone files (PDF, BPMN XML, etc.) for workshop use.
- **Reporting and analytics**: Dashboards showing engagement progress, completion rates, or process statistics.
- **Admin analytics**: System-wide usage metrics or operational dashboards.
- **BPMN diagram editing**: The foundation phase renders BPMN diagrams in view-only mode (pan/zoom). Full editing capability is deferred.

## Clarifications

### Session 2026-02-23

- Q: What language should the UI be presented in? → A: Bilingual from the start (German + English, user-selectable).
- Q: What are the GDPR/data constraints for sending process data to the LLM? → A: DPA required with LLM provider; no personally identifiable information (PII) in prompts.
- Q: Can an Employee belong to multiple Projects simultaneously? → A: No. Each Employee belongs to exactly one Project.
- Q: How long should user sessions last before requiring re-authentication? → A: 7-day sessions; Employees re-authenticate weekly via magic link.
- Q: What is explicitly out of scope for the platform foundation? → A: AI interview flow, process validation/approval, data export, reporting, admin analytics, and BPMN editing (foundation renders/views only).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support two user roles: Consultant (creates and manages projects) and Employee (documents processes within a project).
- **FR-002**: System MUST authenticate Consultants via email and password. System MUST authenticate Employees via email-based magic links (passwordless). Magic links MUST expire after a single use or a short time window (e.g., 15 minutes).
- **FR-003**: System MUST allow consultants to create client projects with configurable attributes: client name, industry, process categories, and custom terminology.
- **FR-004**: System MUST store all client-specific configuration as data, with no code changes required to onboard a new client.
- **FR-005**: System MUST provide an LLM abstraction layer that normalizes requests and responses across different providers.
- **FR-006**: System MUST support at least two LLM provider adapters: one real provider (Claude API) and one mock provider for testing.
- **FR-007**: System MUST render Markdown content with standard formatting (headings, lists, emphasis, links).
- **FR-008**: System MUST embed the bpmn.js viewer for displaying BPMN 2.0 diagrams in view-only mode (pan and zoom). BPMN diagram editing is out of scope for the foundation phase.
- **FR-009**: System MUST serve the web application over HTTPS.
- **FR-010**: System MUST persist all data (users, projects, configurations, process entries) in a durable data store.
- **FR-011**: System MUST display clear, non-technical error messages when operations fail.
- **FR-012**: System MUST support session continuity with a 7-day session lifetime. Users can close the browser and return within 7 days without re-authenticating. After 7 days, Employees MUST re-authenticate via a new magic link; Consultants MUST re-authenticate via email and password.
- **FR-013**: System MUST support bilingual UI (German and English) from the foundation phase. Users MUST be able to select their preferred language. The selected language MUST persist across sessions.
- **FR-014**: System MUST strip or anonymize personally identifiable information (PII) from all data sent to external LLM providers. Names, email addresses, and other personal identifiers MUST NOT appear in LLM prompts.
- **FR-015**: System MUST only use LLM providers that have a signed Data Processing Agreement (DPA) in place. The LLM provider configuration MUST include a DPA-status flag; the system MUST refuse to send requests to providers without an active DPA.

### Key Entities

- **User**: Represents a person who accesses the system. Has a role (Consultant or Employee), display name, email, preferred language (German or English), and authentication credentials. Consultants can belong to one or more Projects. Employees belong to exactly one Project.
- **Project**: Represents a client engagement. Has a name, industry, creation date, and status (active/archived). Owned by one or more Consultants. Contains configuration data and process entries.
- **ProjectConfiguration**: The data-driven settings for a Project. Includes industry classification, process categories, custom terminology overrides, and interview template references. Stored as structured data, not code.
- **ProcessEntry**: Represents a single documented business process within a Project. Has a title, status (draft/in-progress/completed/validated), Markdown description, and BPMN diagram data. Created by an Employee.
- **LLMProviderConfig**: The configuration for a specific LLM provider adapter. Includes provider identifier, API endpoint, credentials reference, model selection, rate limit settings, and DPA status (active/inactive). The system MUST refuse requests to providers without active DPA status. Swappable without code changes.

### Assumptions

- The initial deployment targets a single EU-based hosting environment; multi-region is not required for the foundation.
- The expected user scale for the foundation is up to 50 concurrent users (a handful of active client engagements).
- Session duration for employees is assumed to be 30 minutes to 2 hours per sitting, with the ability to return across multiple days.
- The bpmn.js library is bundled with the application (not loaded from an external CDN) to ensure availability and EU data residency compliance.
- Email addresses are used as the unique identifier for user accounts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consultant can create a new client project and generate employee access credentials in under 5 minutes.
- **SC-002**: An employee with no prior training can log in and reach the dashboard with a clear next-step action in under 2 minutes.
- **SC-003**: The LLM abstraction layer successfully returns a response from both a real provider and a mock provider without any business-logic code changes between swaps.
- **SC-004**: A sample BPMN diagram renders in the bpmn.js viewer and supports pan/zoom interaction within 3 seconds of page load.
- **SC-005**: All user-facing error messages are written in plain language (no stack traces, technical codes, or provider-specific terminology visible to the user).
- **SC-006**: The system supports at least 50 concurrent authenticated users without degradation in page load times (pages load in under 3 seconds).
- **SC-007**: Adding a new client project requires zero code changes — configuration data alone drives all project-specific behavior.
