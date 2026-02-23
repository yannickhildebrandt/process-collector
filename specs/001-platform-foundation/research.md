# Research: Platform Foundation

**Feature**: 001-platform-foundation
**Date**: 2026-02-23

## Decision Log

### Frontend Framework

**Decision**: Next.js 15 (React 19) with App Router

**Rationale**: bpmn.js has official React examples and a React
wrapper maintained by the bpmn-io team. Next.js provides the most
mature i18n story (next-intl), the strongest auth ecosystem
(Better Auth, Auth.js), and SSR for sub-3-second page loads.
React's ecosystem is the largest for UI component libraries
(shadcn/ui, Radix) which supports building an intuitive
self-service UX.

**Alternatives considered**:
- Nuxt (Vue): Viable second choice. bpmn.js works via DOM mounting
  but official examples target React. Smaller auth/i18n ecosystem.
- SvelteKit: Best bundle size, but smallest ecosystem. No official
  bpmn.js examples. Thinner auth/i18n libraries. Higher risk.

---

### Backend Approach

**Decision**: Next.js API routes (full-stack monolith)

**Rationale**: Single codebase and deployment unit minimizes
operational overhead for a small team at ~50 concurrent users.
Shared TypeScript types between frontend and backend. Auth
libraries (Better Auth) integrate natively. The scale does not
justify the complexity of a separate backend service.

**Alternatives considered**:
- Separate Fastify backend: Clean separation but adds CORS, two
  deployments, and two CI pipelines. Overkill at this scale.
- Next.js + Hono: Best type-safety via RPC client, but adds
  monorepo complexity. Worth revisiting if a mobile client or
  third-party API consumers are added later.

---

### Database

**Decision**: PostgreSQL with Prisma ORM

**Rationale**: Relational integrity for users/projects/entries,
native JSONB for flexible configuration schemas, TEXT columns for
Markdown and BPMN XML. Prisma provides type-safe queries,
auto-generated TypeScript types, and migration tooling. Widely
available as managed EU-hosted service (Supabase Frankfurt,
Neon EU, Railway EU).

**Alternatives considered**:
- SQLite: Single-writer limitation causes SQLITE_BUSY at 50
  concurrent users with writes. No network access for multi-instance
  deployment. Not suitable for production.
- MongoDB: Adds document flexibility that PostgreSQL JSONB already
  provides, while losing relational guarantees. The data model is
  inherently relational (users own projects, projects have configs).

---

### Authentication

**Decision**: Better Auth with magic link plugin + credentials
provider + roles plugin

**Rationale**: Better Auth provides first-class support for the
exact auth pattern needed: email/password for Consultants, magic
links for Employees, and built-in RBAC via the roles plugin.
Session lifetime is configurable (7-day default matches
requirement). Auth.js team has merged into Better Auth, giving it
the strongest long-term maintenance signal. Security defaults
(rate limiting, password policies, secure cookies) are on by
default.

**Alternatives considered**:
- Auth.js v5: Mature and widely deployed. Handles the use case
  but requires more manual wiring (JWT callbacks for roles, email
  provider config alongside credentials). Still a valid choice.
- Lucia Auth: Deprecated in early 2025. Do not use.
- Custom JWT: Unjustifiable at this scale. High security surface
  area, weeks of development, ongoing maintenance burden.

---

### Email Delivery (Magic Links)

**Decision**: Resend

**Rationale**: Best developer experience, native integration with
Better Auth and Auth.js. GDPR compliant via EU-US Data Privacy
Framework certification and Standard Contractual Clauses. Generous
free tier covers the ~50 user scale.

**Alternatives considered**:
- AWS SES (Frankfurt): Genuine EU data residency. Higher setup
  and maintenance overhead. Recommended fallback if DPO requires
  physical EU data residency.
- Postmark: Best deliverability reputation. No free tier, starts
  at $15/month. Good option if deliverability issues arise.
- Self-hosted SMTP: High risk of magic links landing in spam.
  Not recommended for authentication-critical email.

---

### Internationalization

**Decision**: next-intl

**Rationale**: App Router-native, type-safe, actively maintained.
Most mature i18n library for Next.js. Supports German and English
with user-selectable locale and persistent preference.

**Alternatives considered**: No serious alternatives for Next.js
App Router. next-intl is the clear standard.

---

### UI Component Library

**Decision**: shadcn/ui (Radix primitives + Tailwind CSS)

**Rationale**: Copy-paste component library gives full control
over styling. Accessible by default (Radix primitives follow WAI-
ARIA). Works natively with Next.js and Tailwind. No runtime
dependency — components are owned source code. Supports building
an intuitive self-service UX for non-technical users.

**Alternatives considered**:
- MUI: Heavier, opinionated Material Design. Harder to customize
  for a bespoke consulting tool.
- Mantine: Good alternative but smaller ecosystem than shadcn/ui.

---

### LLM Abstraction Layer

**Decision**: Custom service layer (NOT Vercel AI SDK)

**Rationale**: Constitution Principle V requires that no LLM-
vendor-specific concepts leak into business logic and prompt
templates must be provider-neutral. The Vercel AI SDK is
convenient but introduces Vercel ecosystem coupling. A thin
custom abstraction (interface with adapters per provider) gives
full control over the provider-neutral contract and PII stripping
(FR-014).

**Alternatives considered**:
- Vercel AI SDK: Convenient streaming support and multi-provider
  abstraction, but couples to Vercel ecosystem. Could be used as
  an implementation detail inside an adapter if needed later.
- LangChain: Too heavy for the current needs. Adds substantial
  dependency surface for what is essentially a request/response
  wrapper.

---

### Testing

**Decision**: Vitest (unit/integration) + Playwright (E2E)

**Rationale**: Vitest is the modern standard for TypeScript testing
— fast, native ESM, compatible with the Next.js ecosystem.
Playwright provides reliable cross-browser E2E testing for the
self-service UX flows.

---

### EU Hosting

**Decision**: Railway (EU West) for application, Supabase
(Frankfurt) for PostgreSQL database

**Rationale**: Both offer EU regions with managed infrastructure.
Railway supports container deployments with zero-downtime deploys.
Supabase provides managed PostgreSQL with backups and point-in-time
recovery. Alternative: Render (Frankfurt) for app + Neon (EU) for
database.

**Note**: Specific hosting provider can be finalized at deployment
time. The architecture (containerized Next.js + managed
PostgreSQL) is provider-agnostic.
