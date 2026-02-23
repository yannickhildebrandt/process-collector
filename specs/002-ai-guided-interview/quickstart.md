# Quickstart: AI-Guided Interview

**Feature**: 002-ai-guided-interview
**Date**: 2026-02-23

## Prerequisites

- Feature 001 (Platform Foundation) fully implemented and running
- PostgreSQL database with seed data
- Node.js 18+

## Setup

```bash
# Install new dependencies
npm install ai @ai-sdk/anthropic bpmn-moddle bpmn-auto-layout zod

# Run database migration (adds InterviewSession, InterviewMessage tables)
npx prisma migrate dev --name add-interview-tables

# Start dev server
npm run dev
```

## Test Scenarios

### Scenario 1: Complete Interview Flow (Happy Path)

1. Log in as employee: `employee@client.com` (magic link)
2. On dashboard, click "Document a new process"
3. Select process category "Procurement"
4. Enter title "Office Supplies Ordering"
5. Answer AI questions about the process:
   - Trigger: "A department submits a purchase request"
   - Steps: "Manager approves, then purchasing creates a PO, supplier ships, we receive and verify"
   - Roles: "Department head, manager, purchasing clerk, warehouse staff"
   - Systems: "SAP, email"
   - Decisions: "Manager approves if under 5000 EUR, director if above"
   - Metrics: "Average processing time 3 days"
6. Review the live summary panel (should update after each answer)
7. When AI presents final summary, verify all details match your answers
8. Confirm the summary
9. Verify: ProcessEntry created with Markdown + BPMN
10. Verify: Returned to dashboard with success message

**Expected result**: Markdown document with sections for Trigger, Steps, Roles, Systems, Decisions, Metrics. BPMN diagram with start event, task nodes, gateway for approval decision, end event.

### Scenario 2: Pause and Resume

1. Log in as employee
2. Start a new interview, answer 3-4 questions
3. Close the browser tab
4. Reopen http://localhost:3000
5. Verify the in-progress interview appears on dashboard
6. Click "Resume"
7. Verify all previous messages are visible
8. Verify AI provides a recap before continuing

**Expected result**: Full conversation preserved, AI continues from where left off.

### Scenario 3: Vague Answer Follow-up

1. Start an interview
2. When asked about process steps, answer vaguely: "someone checks it and then it gets approved"
3. Verify AI asks a specific follow-up: who checks, what are the criteria, who approves

**Expected result**: AI never accepts vague answers without clarification.

### Scenario 4: Configuration-Driven Behavior

1. Log in as consultant, create two projects:
   - "Auto Corp" with industry "Manufacturing", categories: production, quality
   - "Finanz AG" with industry "Finance", categories: compliance, reporting
2. Invite an employee to both projects
3. Log in as employee, start interviews in each
4. Verify AI asks manufacturing-specific questions in Auto Corp
5. Verify AI asks finance-specific questions in Finanz AG

**Expected result**: Same codebase, different AI behavior driven by configuration.

### Scenario 5: LLM Unavailability

1. Set ANTHROPIC_API_KEY to an invalid value
2. Ensure mock provider is not the default (or disable it)
3. Start an interview and send a message
4. Verify: Friendly error message displayed
5. Verify: All previous messages preserved
6. Fix the API key and retry

**Expected result**: No data loss, clear error message.

### Scenario 6: Mock Provider Testing

1. Ensure mock provider is set as default in LLMProviderConfig
2. Run the full interview flow
3. Verify the system works end-to-end with canned responses

**Expected result**: Full flow testable without a live API key.

## Integration Tests to Implement

1. **Interview CRUD**: Create, list, get, delete interview sessions
2. **Chat flow**: Send messages, verify persistence, verify summary updates
3. **State transitions**: IN_PROGRESS → SUMMARY_REVIEW → COMPLETED
4. **BPMN generation**: Process JSON → valid BPMN 2.0 XML
5. **Message retention**: Verify purge logic after retention period
6. **Provider swap**: Interview works with both mock and Claude adapters
7. **PII filtering**: Verify PII is stripped before sending to LLM
8. **Configuration injection**: System prompt adapts to project configuration
