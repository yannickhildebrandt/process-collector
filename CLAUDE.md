# process-collector Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-23

## Active Technologies
- TypeScript 5.x, Node.js 18+ + Next.js 16 (App Router), Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), bpmn-moddle, bpmn-auto-layout, zod, Prisma 6 (002-ai-guided-interview)
- PostgreSQL (via Prisma ORM) — new InterviewSession and InterviewMessage tables (002-ai-guided-interview)
- TypeScript 5.x, Node.js 22+ + Next.js 16.1.6, React 19, Vercel AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`), Prisma 6, bpmn-js 18, next-intl 4, Zod 4, Better Auth (003-interview-enhancements)
- PostgreSQL via Prisma ORM (003-interview-enhancements)
- TypeScript 5.x, Node.js 22+ + Next.js 16, React 19, Tailwind CSS, shadcn/ui (Radix UI), bpmn-js 18, Better Auth, next-intl 4 (004-ui-refinements)
- PostgreSQL via Prisma (seed change only — no migration) (004-ui-refinements)
- TypeScript 5.x, Node.js 22+ + Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, bpmn-js 18 (005-brand-design-polish)
- N/A (no database changes) (005-brand-design-polish)
- TypeScript 5.x, Node.js 22+ + Next.js 16.1.6, React 19, bpmn-js 18 (NavigatedViewer), next-intl 4, Tailwind CSS v4 (006-process-detail-viewer)
- N/A (no schema changes) (006-process-detail-viewer)

- TypeScript 5.x, Node.js 20+ (LTS) + Next.js 15 (App Router), React 19, (001-platform-foundation)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x, Node.js 20+ (LTS): Follow standard conventions

## Recent Changes
- 006-process-detail-viewer: Added TypeScript 5.x, Node.js 22+ + Next.js 16.1.6, React 19, bpmn-js 18 (NavigatedViewer), next-intl 4, Tailwind CSS v4
- 005-brand-design-polish: Added TypeScript 5.x, Node.js 22+ + Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, bpmn-js 18
- 004-ui-refinements: Added TypeScript 5.x, Node.js 22+ + Next.js 16, React 19, Tailwind CSS, shadcn/ui (Radix UI), bpmn-js 18, Better Auth, next-intl 4


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
