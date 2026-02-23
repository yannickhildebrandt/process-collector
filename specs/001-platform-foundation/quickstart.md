# Quickstart: Platform Foundation

**Feature**: 001-platform-foundation
**Date**: 2026-02-23

## Prerequisites

- Node.js 20+ (LTS)
- npm or pnpm
- PostgreSQL 15+ (local or managed)
- Git

## Setup

1. Clone and install dependencies:
   ```bash
   git clone <repo-url>
   cd process-collector
   npm install
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```

3. Configure `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://user:pass@localhost:5432/process_collector"

   # Better Auth
   BETTER_AUTH_SECRET="generate-a-random-secret"
   BETTER_AUTH_URL="http://localhost:3000"

   # Email (Resend)
   RESEND_API_KEY="re_xxx"

   # LLM Provider (Claude)
   ANTHROPIC_API_KEY="sk-ant-xxx"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. Initialize database:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
   The seed script creates:
   - A demo Consultant account
   - A demo Project with sample configuration
   - A sample ProcessEntry with Markdown + BPMN content
   - A mock LLM provider config (dpaActive=true)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

## Verification Checklist

After setup, verify each user story:

**US1 — Consultant creates project**:
- [ ] Log in as demo consultant (email/password from seed)
- [ ] Create a new project with name, industry, categories
- [ ] Verify project appears in project list
- [ ] Invite an employee (enter email, magic link sent)

**US2 — Employee dashboard**:
- [ ] Check email for magic link (or use Resend dashboard)
- [ ] Click magic link, verify redirect to dashboard
- [ ] Verify dashboard shows project name, categories, CTA

**US3 — LLM round-trip**:
- [ ] Switch LLM config to mock provider (seed default)
- [ ] Trigger a test prompt via API or dev tools
- [ ] Verify normalized response returned
- [ ] Switch to Claude provider (if API key configured)
- [ ] Verify response returned without code changes

**US4 — Process output rendering**:
- [ ] Navigate to the seeded sample process entry
- [ ] Verify Markdown renders with formatting
- [ ] Verify bpmn.js viewer loads sample BPMN diagram
- [ ] Verify pan and zoom work on the diagram

## Common Issues

**Database connection fails**: Ensure PostgreSQL is running and
`DATABASE_URL` is correct. For managed Supabase, use the
connection string from the dashboard.

**Magic link not received**: Check Resend dashboard for delivery
status. In development, Resend logs emails to console if no API
key is set.

**bpmn.js viewer blank**: Check browser console for JS errors.
Ensure the bpmn.js package is installed (`npm ls bpmn-js`).

**LLM calls fail with DPA error**: The provider's `dpaActive`
must be `true` in the database. The mock provider seed sets this
by default.
