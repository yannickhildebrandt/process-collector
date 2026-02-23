# Implementation Plan: Platform Foundation

**Branch**: `001-platform-foundation` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-platform-foundation/spec.md`

## Summary

Establish the core technical platform for the Process Collector:
a Next.js 15 full-stack web application with PostgreSQL storage,
Better Auth for dual authentication (email/password for
Consultants, magic links for Employees), an LLM abstraction layer
with Claude and mock adapters, bilingual UI (DE/EN), and bpmn.js
viewer integration. The foundation delivers four independently
testable user stories: project creation, employee dashboard, LLM
round-trip, and process output rendering.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ (LTS)
**Primary Dependencies**: Next.js 15 (App Router), React 19,
Better Auth, Prisma ORM, next-intl, bpmn-js, shadcn/ui
(Radix + Tailwind CSS), Resend (email)
**Storage**: PostgreSQL 15+ with Prisma ORM (JSONB for configs)
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Browser-based web app, EU-hosted Linux server
**Project Type**: Full-stack web application (monolith)
**Performance Goals**: Pages load in <3 seconds, 50 concurrent
users without degradation
**Constraints**: EU hosting (GDPR), PII must not reach LLM
providers, DPA required for LLM providers, bpmn.js bundled
(not CDN)
**Scale/Scope**: ~50 concurrent users, ~5-10 active client
engagements, ~8 primary screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after
Phase 1 design.*

### Pre-Research Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. AI-Guided, Not AI-Replaced | PASS | LLM abstraction layer is a transport mechanism only. No autonomous content generation in foundation — interview flow deferred. |
| II. Self-Service by Design | PASS | Employee dashboard with clear CTA, magic link auth (no password), bilingual UI, non-technical error messages. |
| III. Structured Output over Free Text | PASS | bpmn.js viewer for BPMN 2.0, Markdown renderer. View-only in foundation (editing deferred). |
| IV. Configuration as Data, Not Code | PASS | ProjectConfiguration stored as JSONB. No per-client code branches. Configuration validated at startup. |
| V. LLM-Agnostic by Architecture | PASS | Custom abstraction layer with provider-neutral interface. Claude adapter + mock adapter. No vendor SDK in business logic. Prompt templates provider-neutral. |

### Post-Design Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. AI-Guided | PASS | LLM contract defines normalized request/response. PII stripping ensures human data stays in control. |
| II. Self-Service | PASS | Auth flows (magic link for employees, email/password for consultants) require no external help. i18n supports DE/EN. |
| III. Structured Output | PASS (partial) | Data model includes `markdownContent` and `bpmnXml` fields on ProcessEntry. Rendering pipeline in US4. bpmn.js viewer integrated in view-only mode. Editing capability is explicitly deferred to a future feature spec per Out of Scope. Constitution's editability requirement will be fulfilled when BPMN editing feature is implemented. |
| IV. Config as Data | PASS | JSONB-based ProjectConfiguration with schema validation. Optimistic concurrency control for safe edits. |
| V. LLM-Agnostic | PASS | LLMProvider interface + LLMService orchestrator. DPA gate prevents unapproved providers. credentialRef pattern avoids hardcoded keys. |

No violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-platform-foundation/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: setup and verification guide
├── contracts/
│   ├── api-endpoints.md # Phase 1: REST API contracts
│   └── llm-abstraction.md # Phase 1: LLM interface contract
└── tasks.md             # Phase 2: task breakdown (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                       # Next.js App Router
│   ├── [locale]/              # i18n route group (de, en)
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Landing / login page
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Employee dashboard (US2)
│   │   ├── projects/
│   │   │   ├── page.tsx       # Project list (Consultant)
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # Create project form (US1)
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx   # Project detail
│   │   │       ├── settings/
│   │   │       │   └── page.tsx # Project configuration
│   │   │       └── processes/
│   │   │           └── [processId]/
│   │   │               └── page.tsx # Process view (US4)
│   │   └── settings/
│   │       └── page.tsx       # User preferences (language)
│   └── api/
│       ├── auth/[...all]/
│       │   └── route.ts       # Better Auth catch-all
│       ├── projects/
│       │   └── route.ts       # Project CRUD
│       ├── llm/
│       │   └── route.ts       # LLM completion endpoint
│       └── user/
│           └── route.ts       # User preferences
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── auth/                  # Login, magic link forms
│   ├── projects/              # Project list, create form
│   ├── processes/             # Markdown viewer, BPMN viewer
│   └── layout/                # Header, sidebar, nav
├── lib/
│   ├── auth.ts                # Better Auth configuration
│   ├── db.ts                  # Prisma client singleton
│   ├── llm/
│   │   ├── types.ts           # LLMRequest, LLMResponse, etc.
│   │   ├── service.ts         # LLMService orchestrator
│   │   ├── pii-filter.ts      # PII stripping utility
│   │   └── adapters/
│   │       ├── claude.ts      # Claude API adapter
│   │       └── mock.ts        # Mock adapter for testing
│   └── validators/
│       └── config-schema.ts   # ProjectConfiguration validators
├── i18n/
│   ├── request.ts             # next-intl request config
│   └── messages/
│       ├── de.json            # German translations
│       └── en.json            # English translations
└── prisma/
    ├── schema.prisma          # Database schema
    ├── migrations/            # Prisma migrations
    └── seed.ts                # Demo data seed script

tests/
├── unit/
│   ├── llm/
│   │   ├── service.test.ts    # LLMService tests
│   │   ├── pii-filter.test.ts # PII stripping tests
│   │   └── mock-adapter.test.ts
│   └── validators/
│       └── config-schema.test.ts
├── integration/
│   ├── auth.test.ts           # Auth flow tests
│   ├── projects.test.ts       # Project CRUD tests
│   └── llm-provider-swap.test.ts # Provider swap test (SC-003)
└── e2e/
    ├── consultant-flow.spec.ts # US1: create project
    ├── employee-flow.spec.ts   # US2: login + dashboard
    └── process-view.spec.ts    # US4: Markdown + BPMN render
```

**Structure Decision**: Full-stack Next.js monolith (single
project). The app uses the Next.js App Router with a `[locale]`
route group for bilingual support. API routes handle backend
logic. The LLM abstraction layer lives in `lib/llm/` with a
clean adapter pattern. Prisma schema and migrations live in
`prisma/` at the project root.

## Complexity Tracking

> No constitution violations detected. Table not needed.
