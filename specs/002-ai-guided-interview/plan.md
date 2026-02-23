# Implementation Plan: AI-Guided Interview

**Branch**: `002-ai-guided-interview` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-ai-guided-interview/spec.md`

## Summary

Implement the AI-guided interview flow where employees describe their business processes through a conversational AI interface. The system conducts a structured interview via streaming chat (Vercel AI SDK), maintains a live process summary panel (updated via tool_use after each exchange), supports pause/resume across browser sessions, and generates structured output (Markdown + BPMN 2.0 XML) upon interview confirmation. All AI behavior adapts to project configuration (industry, terminology, categories) without code changes.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+
**Primary Dependencies**: Next.js 16 (App Router), Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), bpmn-moddle, bpmn-auto-layout, zod, Prisma 6
**Storage**: PostgreSQL (via Prisma ORM) — new InterviewSession and InterviewMessage tables
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Browser-based web application
**Project Type**: Web application (full-stack Next.js)
**Performance Goals**: AI responses begin streaming within 2 seconds; complete within 5 seconds (SC-006)
**Constraints**: LLM-agnostic (Principle V), configuration-as-data (Principle IV), EU hosting preferred
**Scale/Scope**: Typical interviews: 30-50 exchanges, 5-15K tokens. Conversations bounded by interview scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. AI-Guided, Not AI-Replaced | PASS | System prompt explicitly forbids fabrication (FR-004). tool_use extracts only employee-provided details. Every output element traceable (FR-015). |
| II. Self-Service by Design | PASS | Chat UI requires no training. Pause/resume supported (FR-006). Error states guide users (FR-014). Live summary provides constant feedback (FR-016). |
| III. Structured Output over Free Text | PASS | Confirmed summary generates Markdown + BPMN (FR-007, FR-008). Chat is intermediate; final deliverable is always structured. |
| IV. Configuration as Data, Not Code | PASS | System prompt parameterized by project config (FR-009). Process categories from config (data-model). No per-customer code. |
| V. LLM-Agnostic by Architecture | PASS | Vercel AI SDK provides provider abstraction. Prompts are provider-neutral plain text. Provider swappable via configuration. No vendor-specific concepts in business logic. |

**Post-design re-check**: All gates PASS. BPMN generation is deterministic code (bpmn-moddle), not LLM-dependent. Prompt templates are plain text, parameterized by config. Vercel AI SDK supports multiple providers via adapter packages.

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-guided-interview/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── api-endpoints.md # API contracts
│   └── prompt-contracts.md # Prompt templates and tool schemas
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── dashboard/
│   │   │   └── page.tsx              # MODIFIED: add interview list, "new process" action
│   │   └── interview/
│   │       └── [interviewId]/
│   │           └── page.tsx          # NEW: interview chat page with summary panel
│   └── api/
│       └── projects/
│           └── [projectId]/
│               └── interviews/
│                   ├── route.ts              # NEW: POST create, GET list
│                   └── [interviewId]/
│                       ├── route.ts          # NEW: GET detail, DELETE discard
│                       ├── chat/
│                       │   └── route.ts      # NEW: POST streaming chat (SSE)
│                       ├── request-summary/
│                       │   └── route.ts      # NEW: POST transition to review
│                       ├── confirm/
│                       │   └── route.ts      # NEW: POST confirm + generate output
│                       └── resume/
│                           └── route.ts      # NEW: POST resume stale interview
├── components/
│   ├── interview/
│   │   ├── chat-interface.tsx        # NEW: chat UI with message list + input
│   │   ├── message-bubble.tsx        # NEW: individual message display
│   │   ├── summary-panel.tsx         # NEW: live process summary sidebar
│   │   └── new-interview-dialog.tsx  # NEW: category selection + title input
│   └── dashboard/
│       └── interview-list.tsx        # NEW: in-progress interviews on dashboard
├── lib/
│   ├── interview/
│   │   ├── prompt-builder.ts         # NEW: builds system prompt from project config
│   │   ├── summary-extractor.ts      # NEW: tool_use call to extract/update summary
│   │   ├── markdown-generator.ts     # NEW: generates Markdown from summary JSON
│   │   └── bpmn-generator.ts         # NEW: converts summary JSON to BPMN 2.0 XML
│   └── llm/
│       └── ai-sdk-provider.ts        # NEW: configures Vercel AI SDK provider from DB config
├── i18n/
│   └── messages/
│       ├── en.json                   # MODIFIED: add interview strings
│       └── de.json                   # MODIFIED: add interview strings
prisma/
│   └── schema.prisma                 # MODIFIED: add InterviewSession, InterviewMessage
tests/
├── integration/
│   ├── interview-crud.test.ts        # NEW
│   ├── interview-chat.test.ts        # NEW
│   ├── bpmn-generation.test.ts       # NEW
│   └── summary-extraction.test.ts    # NEW
```

**Structure Decision**: Extends the existing Next.js App Router structure from Feature 001. New files are organized under `src/lib/interview/` for business logic, `src/components/interview/` for UI, and `src/app/api/projects/[projectId]/interviews/` for API routes. This follows the established patterns.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
