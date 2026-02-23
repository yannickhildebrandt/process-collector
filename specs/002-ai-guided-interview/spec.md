# Feature Specification: AI-Guided Interview

**Feature Branch**: `002-ai-guided-interview`
**Created**: 2026-02-23
**Status**: Draft
**Input**: User description: "AI-guided interview flow where employees describe their business processes through a conversational AI interface, producing structured Markdown + BPMN output"

## Clarifications

### Session 2026-02-23

- Q: When an interview is completed, what is the relationship to ProcessEntry? → A: Completing an interview creates a ProcessEntry (Markdown + BPMN). The Interview Session is retained as the source/audit trail linked to that ProcessEntry. One interview produces exactly one process; pause/resume covers multi-session work on the same process.
- Q: Should employees see intermediate results during the interview? → A: Yes — a live summary panel is displayed alongside the conversation, updated after each answer. Employees can track progress and spot errors early.
- Q: Should conversation history be retained permanently after interview completion? → A: Retain for a configurable period (default 90 days) after completion, then automatically purge messages while keeping the Process Entry.
- Q: Can an employee create multiple interviews for the same process category? → A: Yes. Each interview has an employee-provided title (e.g., "Raw Materials Procurement") to distinguish them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Employee Completes a Process Interview (Priority: P1)

An employee logs into the Process Collector, navigates to their dashboard, and starts a new process interview by selecting a process category (e.g., "Procurement" or "Quality Assurance"). The system opens a conversational interface where the AI greets the employee, explains the goal, and begins asking structured questions about the process: What triggers it? What are the main steps? Who is involved? What systems are used? What decisions need to be made?

The employee answers in their own words — short or long, formal or informal. As the conversation progresses, a live summary panel displays the evolving process structure, updated after each answer — allowing the employee to track progress and spot errors early. The AI follows up with clarifying questions when answers are vague ("You mentioned approvals — who approves and what criteria do they use?"). The AI never invents details; it only asks, structures, and confirms. When the AI has gathered enough information, it presents the final summary for the employee to review. The employee can confirm, correct, or add to the summary before finalizing. Upon confirmation, the system creates a Process Entry containing the structured Markdown and BPMN output, with the Interview Session retained as the audit trail.

**Why this priority**: This is the core value proposition of the entire product. Without a working interview flow, there is no process capture. This validates Principle I (AI-Guided, Not AI-Replaced) and Principle II (Self-Service by Design).

**Independent Test**: Can be fully tested by an employee starting an interview, answering a series of AI questions about a sample process, reviewing the generated summary, and confirming the result. The final output should contain only information the employee explicitly provided.

**Acceptance Scenarios**:

1. **Given** an employee is on their dashboard, **When** they click "Document a new process", select a process category, and provide a title for the process, **Then** a conversational interview interface opens with an AI greeting and the first question.
2. **Given** an interview is in progress, **When** the employee answers a question, **Then** the live summary panel updates to reflect the newly captured information.
3. **Given** an interview is in progress, **When** the employee provides a vague answer (e.g., "someone checks it"), **Then** the AI asks a specific follow-up question to clarify (e.g., "Who specifically performs the check, and what are they looking for?").
3. **Given** the AI has gathered sufficient information, **When** it presents the process summary, **Then** every detail in the summary is traceable to something the employee said during the interview.
4. **Given** the employee reviews the summary, **When** they request a correction ("Actually, the manager approves, not the team lead"), **Then** the AI updates the summary accordingly and confirms the change.
5. **Given** the employee is satisfied with the summary, **When** they confirm it, **Then** the system creates a Process Entry (Markdown + BPMN), retains the Interview Session as audit trail, and returns the employee to their dashboard with a success message.

---

### User Story 2 - Employee Pauses and Resumes an Interview (Priority: P2)

An employee starts an interview but cannot complete it in one sitting — they get called into a meeting, their lunch break starts, or they need to gather information from a colleague. They close the browser or navigate away. When they return later (minutes, hours, or days later), they find their in-progress interview on their dashboard. They resume exactly where they left off, with all previous questions and answers preserved. The AI provides a brief recap and continues the conversation.

**Why this priority**: Employees are busy professionals who rarely have 30+ uninterrupted minutes. If interviews cannot be paused and resumed, completion rates will drop significantly. This directly supports Principle II (Self-Service by Design) which mandates session continuity.

**Independent Test**: Can be fully tested by an employee starting an interview, answering several questions, closing the browser, reopening it, and verifying the interview resumes with all previous context intact.

**Acceptance Scenarios**:

1. **Given** an employee has an in-progress interview, **When** they close the browser and reopen the application later, **Then** they see the in-progress interview on their dashboard with a "Resume" option.
2. **Given** an employee resumes a paused interview, **When** the conversation loads, **Then** all previous questions and answers are visible and the AI provides a brief recap before continuing.
3. **Given** an employee has multiple in-progress interviews (for different process categories), **When** they view their dashboard, **Then** each in-progress interview is listed separately with its category, last activity date, and progress indication.

---

### User Story 3 - Interview Produces Structured Markdown and BPMN Output (Priority: P3)

When an employee confirms the process summary, the system generates two structured artifacts: a detailed Markdown document describing the process (with sections for trigger, steps, roles, systems, decisions, and metrics) and a BPMN 2.0 diagram representing the process flow. Both artifacts are stored as a completed process entry. The consultant can later view, review, and use these artifacts in their consulting workshop.

**Why this priority**: Structured output is the deliverable that justifies the tool's existence. Without it, the interview is just a chat. This validates Principle III (Structured Output over Free Text). It depends on US1 (the interview must complete before output is generated).

**Independent Test**: Can be fully tested by completing an interview and verifying the generated Markdown follows a consistent structure and the BPMN diagram contains the correct process elements (start event, tasks, gateways, end event) matching the described process.

**Acceptance Scenarios**:

1. **Given** an employee confirms their process summary, **When** the system generates the output, **Then** a Markdown document is produced with clearly labeled sections (Trigger, Process Steps, Roles/Responsibilities, Systems Used, Decision Points, Key Metrics).
2. **Given** the system generates BPMN output, **When** a consultant views the diagram, **Then** it contains a valid start event, task nodes for each process step, gateway nodes for each decision point, and an end event, all connected by sequence flows.
3. **Given** the structured output is generated, **When** compared to the employee's interview answers, **Then** every element in the output is directly traceable to an explicit employee response — no fabricated steps, roles, or details.
4. **Given** a completed process entry exists, **When** a consultant opens it from the project detail page, **Then** they can view both the Markdown description and the BPMN diagram side by side.

---

### User Story 4 - AI Adapts to Project Configuration (Priority: P4)

The AI interview adapts its behavior based on the project's configuration. It uses the correct industry terminology (configured by the consultant), asks about the relevant process categories, and follows any interview templates associated with the project. For example, in a manufacturing project the AI might ask about quality gates and production lines, while in a finance project it might focus on approval chains and compliance checkpoints.

**Why this priority**: This validates Principle IV (Configuration as Data). The AI must behave differently per project without code changes. It depends on US1 working first.

**Independent Test**: Can be fully tested by creating two projects with different configurations (e.g., Manufacturing vs. Finance), running interviews in each, and verifying the AI's questions and terminology differ according to the configuration.

**Acceptance Scenarios**:

1. **Given** a project is configured with industry "Manufacturing" and custom terminology, **When** the AI conducts an interview, **Then** it uses the configured terminology (e.g., "Vorgang" instead of "Process" in German mode) and asks industry-relevant questions.
2. **Given** a project has defined process categories, **When** the employee starts an interview, **Then** only the categories configured for that project are available for selection.
3. **Given** two projects with different configurations exist, **When** interviews are conducted in each, **Then** the AI's questions, terminology, and focus areas reflect the respective project configuration without any code changes.

---

### Edge Cases

- What happens when the AI cannot understand an employee's response? The AI asks the employee to rephrase, offering a specific prompt ("Could you describe that step in simpler terms?"). After two failed attempts, it acknowledges the difficulty and moves to the next topic, flagging the unclear area for later review.
- What happens when the employee provides contradictory information? The AI detects the contradiction and presents both statements, asking the employee to clarify which is correct.
- What happens when the employee wants to go back and change a previous answer? The AI allows the employee to reference any previous question and update their answer, adjusting the running summary accordingly.
- What happens when the LLM provider is temporarily unavailable? The system displays a friendly error message ("The assistant is temporarily unavailable. Your progress has been saved. Please try again in a few minutes.") and preserves all interview state.
- What happens when an interview has been idle for more than 30 days? The system marks it as stale and prompts the employee to either resume with a recap or discard it.
- What happens when the generated BPMN is too complex for a single diagram? The system generates the best-effort diagram and flags it for consultant review, noting which aspects may need manual refinement.
- What happens when the employee's preferred language differs from the project language? The AI conducts the interview in the employee's preferred language as set in their profile.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a conversational chat interface where the AI asks questions and the employee responds in natural language.
- **FR-002**: The AI MUST follow a structured interview approach: identifying the process trigger, main steps, involved roles, systems used, decision points, and relevant metrics.
- **FR-003**: The AI MUST ask follow-up questions when employee responses are vague, incomplete, or ambiguous.
- **FR-004**: The AI MUST NOT invent, assume, or fabricate any process details that the employee did not explicitly provide.
- **FR-005**: The AI MUST present a process summary for employee review before finalizing, and the employee MUST be able to request corrections.
- **FR-006**: System MUST persist all interview state (questions, answers, partial summary) so that interviews can be paused and resumed across sessions.
- **FR-007**: System MUST generate a structured Markdown document from the confirmed interview summary, with consistent sections (Trigger, Process Steps, Roles, Systems, Decisions, Metrics).
- **FR-008**: System MUST generate a BPMN 2.0 XML diagram from the confirmed interview summary, containing appropriate start events, tasks, gateways, sequence flows, and end events.
- **FR-009**: The AI MUST adapt its questions, terminology, and focus areas based on the project's configuration (industry, process categories, custom terminology, interview templates).
- **FR-010**: System MUST support interviews in both German and English, determined by the employee's preferred language setting.
- **FR-011**: System MUST display in-progress interviews on the employee's dashboard with category, last activity date, and progress indication.
- **FR-012**: When an interview is resumed, the AI MUST provide a brief recap of what was discussed before continuing.
- **FR-013**: System MUST allow employees to go back and correct previous answers during an active interview.
- **FR-014**: System MUST handle LLM provider unavailability gracefully, preserving interview state and displaying a user-friendly error message.
- **FR-015**: Every element in the generated Markdown and BPMN output MUST be traceable to an explicit employee response from the interview.
- **FR-016**: System MUST display a live summary panel alongside the conversation that updates after each employee answer, showing the evolving process structure.
- **FR-017**: Upon interview confirmation, the system MUST create a Process Entry (reusing the existing ProcessEntry entity from Feature 001) containing the generated Markdown and BPMN. The Interview Session MUST be retained and linked to the Process Entry as an audit trail.
- **FR-018**: System MUST automatically purge interview conversation messages after a configurable retention period (default 90 days) following interview completion, while preserving the Process Entry and Interview Session metadata.

### Key Entities

- **Interview Session**: Represents an ongoing or completed interview. Linked to a project, an employee, and a process category. Has an employee-provided title (e.g., "Raw Materials Procurement") to distinguish multiple interviews within the same category. Contains the conversation history (messages), current status (in-progress, summary-review, completed, stale), and timestamps. Upon completion, linked to the resulting Process Entry as an audit trail. One interview produces exactly one process; pause/resume covers multi-session work. Conversation messages are automatically purged after a configurable retention period (default 90 days) post-completion.
- **Interview Message**: A single message in the interview conversation. Has a sender (AI or employee), content, and timestamp. Messages are ordered chronologically.
- **Process Summary**: A live, evolving structured representation of the captured process, generated and updated by the AI after each employee answer. Displayed alongside the conversation in a summary panel. Contains sections for trigger, steps, roles, systems, decisions, and metrics. Serves as the basis for the final Markdown and BPMN generation.
- **Process Entry** *(existing from Feature 001)*: The final output artifact created when an interview is confirmed. Contains the structured Markdown document and BPMN 2.0 XML. Linked back to the source Interview Session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An employee with no prior training can complete a process interview (from start to confirmed summary) within 30 minutes for a process with up to 10 steps.
- **SC-002**: 90% of completed interviews produce a structured Markdown document and BPMN diagram without manual intervention.
- **SC-003**: 100% of details in the generated output are traceable to explicit employee responses — zero fabricated content.
- **SC-004**: Employees can pause and resume interviews with zero data loss, even after closing the browser.
- **SC-005**: The same interview system works across different project configurations (industry, terminology) without any code changes — only configuration data changes.
- **SC-006**: Interview responses appear within 5 seconds of the employee submitting their message under normal conditions.
- **SC-007**: 80% of employees who start an interview successfully complete it (measured as conversion from first question to confirmed summary).

## Assumptions

- The platform foundation (Feature 001) is fully implemented: authentication, project management, LLM abstraction layer, i18n, and process entry storage are available.
- The LLM abstraction layer supports multi-turn conversation context (sending conversation history with each request).
- The mock LLM adapter can simulate structured interview responses for testing without a live API key.
- Interview templates (referenced in project configuration) are optional for the initial implementation — the AI uses a default structured approach if no template is configured.
- BPMN generation from natural language is best-effort; complex processes may require consultant refinement of the generated diagram.
- The employee interacts with one interview at a time (no concurrent interviews in multiple browser tabs for the same user).

## Scope Boundaries

**In scope**:
- Conversational AI interview interface for employees
- Structured question flow (trigger, steps, roles, systems, decisions, metrics)
- AI follow-up questions for vague or incomplete answers
- Live summary panel updated after each answer
- Final process summary review and employee correction
- Pause and resume capability with full state persistence
- Markdown document generation from confirmed summary
- BPMN 2.0 diagram generation from confirmed summary
- Configuration-driven AI behavior (industry, terminology, categories)
- Bilingual interview support (DE/EN)

**Out of scope**:
- BPMN diagram editing by employees (view-only; editing is a future feature)
- Consultant review/approval workflow for completed processes
- Audio/video input (text-only interview)
- Real-time collaboration (multiple people in one interview)
- Interview analytics or reporting dashboards
- Custom interview template authoring by consultants (uses configured templates or defaults)

## Dependencies

- Feature 001 (Platform Foundation): Authentication, project management, LLM abstraction layer, process entry storage, i18n infrastructure
