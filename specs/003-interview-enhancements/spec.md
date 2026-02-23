# Feature Specification: Interview Enhancements — Live BPMN, Contextual AI & Consultant Configuration Chat

**Feature Branch**: `003-interview-enhancements`
**Created**: 2026-02-23
**Status**: Draft
**Input**: User description: "Ich möchte, dass sich eigentlich sowohl textuell als auch live ein BPMN Modell aufbaut. Außerdem möchte ich, dass der KI assistent schon den Titel des Prozesses sowie seine Kategorie usw berücksichtigt als Kontext (+ die Basiskonfiguration die wir aus Beratersicht gesetzt haben, ggf. würde ich diese Basiskonfiguration auch gerne in Form einer Konversation herausarbeiten und setzen)"

## Clarifications

### Session 2026-02-23

- Q: Where should the "Configure via AI" entry point be placed for consultants? → A: Button on the existing project settings page (alongside the form).
- Q: When should the auto-greeting be generated? → A: Server-side at interview creation time (POST /interviews), stored as the first message before the employee opens the page.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Live Summary & BPMN During Interview (Priority: P1)

As an employee conducting a process interview, I want to see both a textual process summary and a live BPMN diagram in the sidebar that updates automatically after each message exchange, so I can visually track the process being documented as I describe it.

**Why this priority**: This is the core visual feedback loop. Without real-time updates to the summary and diagram, the employee has no sense of progress or accuracy during the interview. The BPMN diagram gives immediate visual confirmation that the AI understood the process structure correctly.

**Independent Test**: Start an interview, describe a process with 3+ steps including a decision point. After each message, verify the textual summary updates and the BPMN diagram grows to reflect newly captured steps, roles, and decision gateways.

**Acceptance Scenarios**:

1. **Given** an employee is in an active interview, **When** they describe a process trigger and the AI responds, **Then** the summary panel updates to show the trigger and the BPMN diagram shows a start event within 5 seconds.
2. **Given** an ongoing interview with 2 steps captured, **When** the employee describes a third step, **Then** the BPMN diagram adds a new task node connected to the existing flow after the next AI response.
3. **Given** an interview where the employee describes a decision point, **When** the AI captures it in the summary, **Then** the BPMN diagram renders an exclusive gateway with labeled outgoing paths.
4. **Given** the summary has no steps yet (beginning of interview), **When** the BPMN area is displayed, **Then** a placeholder message is shown instead of an empty diagram.

---

### User Story 2 — Contextual AI Greeting with Process Context (Priority: P1)

As an employee starting a new interview, I want the AI assistant to automatically greet me with a message that references the specific process title, category, and relevant industry context, so the conversation begins with clear focus and I understand what the AI already knows.

**Why this priority**: A contextual greeting immediately establishes trust and relevance. Without it, the employee must explain from scratch what process they want to document, leading to wasted time and a generic experience.

**Independent Test**: Create a new interview with title "Raw Materials Procurement" in category "Procurement" for a Manufacturing project. Verify the AI immediately sends a greeting that mentions procurement, manufacturing context, and the specific process title.

**Acceptance Scenarios**:

1. **Given** an employee creates a new interview titled "Invoice Approval" in category "Finance" for a finance-sector project, **When** the interview page loads, **Then** the AI sends an automatic greeting within 3 seconds that references the title "Invoice Approval", the finance category, and relevant industry context.
2. **Given** a project with custom terminology configured (e.g., "Vorgang" instead of "Process"), **When** a new interview starts, **Then** the AI greeting uses the custom terminology.
3. **Given** the employee's preferred language is German, **When** the interview starts, **Then** the greeting is in German and uses German custom terms.
4. **Given** the AI service is temporarily unavailable, **When** a new interview starts, **Then** a fallback static greeting is displayed and the employee can still type their first message.

---

### User Story 3 — Consultant Configures Project via AI Conversation (Priority: P2)

As a consultant, I want to configure a project's base settings (industry classification, process categories, custom terminology, interview template references) through an AI-guided conversation as an alternative to the existing form, so I can set up complex configurations more intuitively by describing my client's needs in natural language.

**Why this priority**: This improves consultant experience and reduces configuration errors. The existing form remains available for quick edits. The conversational approach is especially valuable for initial project setup where consultants may not yet know the exact categories and terminology to use.

**Independent Test**: Navigate to the project configuration page, choose the "Configure via AI" option, describe the client's industry, processes, and terminology in a conversation. Verify the AI extracts structured configuration and the consultant can review and save it.

**Acceptance Scenarios**:

1. **Given** a consultant is on a project's settings page (existing form view), **When** they click a "Configure via AI" button placed alongside the form, **Then** a conversational interface opens on the same page where they can describe the project's industry and processes.
2. **Given** the consultant tells the AI "We're a healthcare company doing patient intake and discharge processes", **When** the AI processes this, **Then** it suggests industry classification (Healthcare), categories (patient-intake, discharge), and relevant terminology displayed in a structured preview panel.
3. **Given** the AI has extracted a configuration, **When** the consultant clicks "Apply Configuration", **Then** the project configuration is updated with the extracted values (validated against the existing configuration schema).
4. **Given** the consultant is not satisfied with the AI suggestion, **When** they provide corrections in the chat, **Then** the configuration preview updates to reflect the corrections.
5. **Given** a project already has an existing configuration, **When** the consultant opens the AI configuration chat, **Then** the AI acknowledges the current configuration and asks what they'd like to change.

---

### User Story 4 — Fix Summary Panel Updates (Priority: P1)

As an employee in an active interview, I want the process summary panel to reliably update after each message exchange, so I can see the AI's structured understanding of my process in real-time.

**Why this priority**: This is a bug fix for a core feature that is currently broken. The summary panel does not update during interviews, making the right sidebar useless.

**Independent Test**: Start an interview, send a message describing a process. After the AI responds, verify the summary panel shows the extracted information within 5 seconds.

**Acceptance Scenarios**:

1. **Given** an employee is chatting in an interview, **When** the AI finishes responding, **Then** the summary panel refreshes with the latest extracted summary within 5 seconds.
2. **Given** the summary extraction fails (e.g., AI service error), **When** the chat message succeeds, **Then** the previous summary remains displayed and no error is shown to the user.
3. **Given** the interview has progressed to include trigger, steps, and roles, **When** the summary is displayed, **Then** all captured sections (trigger, steps, roles, systems, metrics) are shown in a structured format.

---

### Edge Cases

- What happens when the BPMN diagram becomes very large (20+ steps)? The diagram should be scrollable and zoomable within the sidebar panel.
- What happens if summary extraction fails repeatedly? The textual summary shows the last successful extraction; the BPMN shows the last valid diagram.
- What happens when the consultant closes the configuration chat without saving? Unsaved configuration changes are discarded with a confirmation prompt.
- What happens when two consultants configure the same project simultaneously? Optimistic concurrency control (existing version check) prevents conflicts.
- What happens when the AI greeting request fails? A static fallback greeting is shown using localized strings.
- What happens when the employee sends a message before the auto-greeting finishes? Since the greeting is generated server-side at creation time, the employee only sees the interview page after the greeting is already stored. If greeting generation fails, the fallback static greeting is used and the interview is still created.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST update the process summary panel after each successful AI response during an interview.
- **FR-002**: System MUST display a live BPMN diagram below the textual summary in the interview sidebar that regenerates from the current summary after each message exchange.
- **FR-003**: The BPMN diagram MUST support zoom and pan interactions within the sidebar.
- **FR-004**: System MUST send an automatic contextual AI greeting when a new interview is opened, referencing the process title, category, industry, and configured terminology.
- **FR-005**: The AI greeting MUST be generated server-side at interview creation time and persisted as the first assistant message, so it is immediately visible when the employee opens the interview page.
- **FR-006**: The AI system prompt MUST include the process title, category, and full project base configuration (industry, sector, custom terminology, interview template references).
- **FR-007**: System MUST provide a conversational AI interface for consultants to configure project settings as an alternative to the existing form.
- **FR-008**: The consultant configuration chat MUST extract structured project configuration (industry classification, process categories, custom terminology) from the conversation.
- **FR-009**: The consultant MUST be able to review the extracted configuration in a structured preview before applying it.
- **FR-010**: The consultant MUST be able to correct and refine the configuration through further conversation.
- **FR-011**: Applying the configuration MUST validate it against the existing configuration schema before saving.
- **FR-012**: System MUST show a placeholder in the BPMN area when no process steps have been captured yet.
- **FR-013**: All new user-facing text MUST be available in both German and English.
- **FR-014**: When the AI service is unavailable, the auto-greeting MUST fall back to a static localized message.

### Key Entities

- **InterviewSession**: Extended behavior — now triggers auto-greeting on creation and includes BPMN regeneration on each summary update.
- **ProjectConfiguration**: Unchanged schema — now additionally editable via AI conversation (same validation rules apply).
- **ConsultantConfigChat**: Ephemeral conversation state for the configuration chat (not persisted long-term — only the resulting ProjectConfiguration is saved).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of interview message exchanges result in an updated summary panel within 5 seconds of the AI response completing.
- **SC-002**: The BPMN diagram accurately reflects all process steps, decisions, and flows from the current summary after every update.
- **SC-003**: New interviews display a contextual AI greeting within 3 seconds of page load, referencing the process title and category.
- **SC-004**: Consultants can fully configure a new project via conversation in under 5 minutes (industry, 3+ categories, custom terminology).
- **SC-005**: The configuration extracted from consultant conversation passes the existing configuration validation schema on first attempt in 90%+ of cases.
- **SC-006**: Both textual summary and BPMN diagram are visible on screens 1280px wide or larger without horizontal scrolling.

## Assumptions

- The existing BPMN viewer component is suitable for rendering within a sidebar panel and supports dynamic re-rendering with new XML.
- The existing BPMN generator produces valid output from any ProcessSummary, including partial summaries with only 1-2 steps.
- The existing configuration validation schema is sufficient for validating AI-extracted configurations.
- The consultant configuration chat does not require its own persistent message history — it is a session-level interaction.
- The auto-greeting is generated by the same AI model used for the interview, using the interview's system prompt.
