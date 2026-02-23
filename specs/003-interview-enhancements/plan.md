# Implementation Plan: Interview Enhancements

**Branch**: `003-interview-enhancements` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-interview-enhancements/spec.md`

## Summary

Enhance the AI interview experience with four changes: (1) fix the broken summary panel by debugging the extractSummary → refetch → render pipeline, (2) add a live BPMN diagram below the textual summary that regenerates after each message, (3) generate a contextual AI greeting at interview creation time using the process title, category, and project configuration, and (4) add a conversational AI interface on the project settings page for consultants to configure project settings as an alternative to the existing form.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22+
**Primary Dependencies**: Next.js 16.1.6, React 19, Vercel AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`), Prisma 6, bpmn-js 18, next-intl 4, Zod 4, Better Auth
**Storage**: PostgreSQL via Prisma ORM
**Testing**: Vitest (unit/integration)
**Target Platform**: Browser-based web application (EU-hosted)
**Project Type**: Full-stack Next.js web application (App Router)
**Performance Goals**: Summary + BPMN update within 5 seconds of AI response; greeting visible on interview page load
**Constraints**: Anthropic API does not support `propertyNames` in JSON schema (no `z.record()` with key schemas); bpmn-js is client-only (requires dynamic import); bilingual DE/EN
**Scale/Scope**: Single-tenant SaaS per consulting engagement, ~10-50 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. AI-Guided, Not AI-Replaced | PASS | AI generates greeting and extracts config from conversation, but all data comes from user input. BPMN is generated deterministically from user-provided summary. |
| II. Self-Service by Design | PASS | Live BPMN + summary give employees immediate visual feedback. Auto-greeting removes friction. Consultant config chat is intuitive alternative to form. |
| III. Structured Output over Free Text | PASS | BPMN diagram is generated in real-time from structured ProcessSummary. Config chat extracts structured ProjectConfiguration. |
| IV. Configuration as Data, Not Code | PASS | Consultant config chat produces the same data-driven ProjectConfiguration — no code changes per client. |
| V. LLM-Agnostic by Architecture | PASS | All AI calls go through the existing `getAIProvider()` abstraction. Prompt templates remain provider-neutral. Config extraction uses `generateObject` with Zod schemas. |

## Project Structure

### Documentation (this feature)

```text
specs/003-interview-enhancements/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-endpoints.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (files to create/modify)

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── interview/[interviewId]/
│   │   │   └── page.tsx                          # MODIFY: add BPMN to summary panel, handle auto-greeting
│   │   └── projects/[projectId]/settings/
│   │       └── page.tsx                          # MODIFY: add "Configure via AI" button + chat UI
│   └── api/
│       └── projects/[projectId]/
│           ├── interviews/
│           │   └── route.ts                      # MODIFY: generate greeting at creation
│           └── configure-chat/
│               └── route.ts                      # CREATE: streaming config chat endpoint
├── components/
│   ├── interview/
│   │   ├── summary-panel.tsx                     # MODIFY: add live BPMN viewer below summary
│   │   └── chat-interface.tsx                    # MODIFY: (already fixed for AI SDK v6)
│   └── projects/
│       ├── config-chat-interface.tsx              # CREATE: consultant config chat component
│       └── config-preview-panel.tsx               # CREATE: structured config preview
├── lib/
│   ├── interview/
│   │   ├── prompt-builder.ts                     # MODIFY: add process title to system prompt
│   │   ├── greeting-generator.ts                 # CREATE: generates contextual greeting
│   │   └── summary-extractor.ts                  # VERIFY: ensure extractSummary works with Anthropic
│   └── config-chat/
│       ├── config-prompt-builder.ts              # CREATE: system prompt for config conversation
│       └── config-extractor.ts                   # CREATE: extract ProjectConfiguration from chat
├── i18n/messages/
│   ├── en.json                                   # MODIFY: add config chat strings
│   └── de.json                                   # MODIFY: add config chat strings
└── tests/
    └── integration/
        ├── bpmn-generation.test.ts               # EXISTING: verify still passes
        ├── config-driven-prompts.test.ts          # EXISTING: verify still passes
        └── greeting-generation.test.ts            # CREATE: test contextual greeting
```

**Structure Decision**: Follows existing Next.js App Router conventions. New config chat follows the same patterns as the interview chat (streaming endpoint + client component + preview panel). New utilities go under `src/lib/config-chat/` to mirror `src/lib/interview/`.

## Complexity Tracking

No constitution violations to justify.
