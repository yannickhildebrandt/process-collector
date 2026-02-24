# Implementation Plan: UI Refinements

**Branch**: `004-ui-refinements` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ui-refinements/spec.md`

## Summary

Polish layout, responsiveness, and navigation for mobile and desktop. Six stories: (P1) tabbed interview layout on mobile, (P2) hamburger mobile navigation, (P3) skeleton loading states, (P4) responsive form grids, (P5) BPMN dark mode fix, (P6) employee password login in dev mode. All changes are presentation-layer except the seed data update for P6.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22+
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS, shadcn/ui (Radix UI), bpmn-js 18, Better Auth, next-intl 4
**Storage**: PostgreSQL via Prisma (seed change only — no migration)
**Testing**: Manual viewport testing (no E2E framework yet)
**Target Platform**: Browser-based web application (desktop + mobile)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 60fps tab/menu transitions, no layout shift on skeleton→content swap
**Constraints**: Min viewport 320px, standard Tailwind breakpoints (sm/md/lg/xl)
**Scale/Scope**: ~15 files modified, 2 new shadcn/ui components installed (Sheet, Skeleton)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. AI-Guided, Not AI-Replaced | PASS | No AI behavior changes. UI-only. |
| II. Self-Service by Design | PASS | Directly improves self-service: mobile users can now complete interviews, navigate, and manage projects without desktop. |
| III. Structured Output over Free Text | PASS | No output format changes. BPMN dark mode fix improves diagram visibility. |
| IV. Configuration as Data, Not Code | PASS | No config changes. Dev-mode employee login uses env detection, not code branch. |
| V. LLM-Agnostic by Architecture | PASS | No LLM integration changes. |

**Post-Phase 1 re-check**: All gates still PASS. No new dependencies violate any principle.

## Project Structure

### Documentation (this feature)

```text
specs/004-ui-refinements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (files touched)

```text
src/
├── app/
│   └── [locale]/
│       ├── page.tsx                                    # P6: login page (env check)
│       ├── dashboard/
│       │   └── loading.tsx                             # P3: skeleton update
│       ├── interview/
│       │   └── [interviewId]/
│       │       ├── page.tsx                            # P1: tabbed layout
│       │       └── loading.tsx                         # P3: skeleton update
│       └── projects/
│           ├── loading.tsx                             # P3: skeleton update
│           └── [projectId]/
│               ├── settings/page.tsx                   # P4: responsive grid
│               └── processes/[processId]/loading.tsx   # P3: skeleton update
├── components/
│   ├── layout/
│   │   └── header.tsx                                  # P2: mobile nav
│   ├── auth/
│   │   └── magic-link-form.tsx                         # P6: dev password fields
│   ├── interview/
│   │   └── summary-panel.tsx                           # (no changes needed)
│   ├── processes/
│   │   └── bpmn-viewer.tsx                             # P5: dark mode bg
│   ├── projects/
│   │   └── project-form.tsx                            # P4: responsive grid
│   └── ui/
│       ├── sheet.tsx                                   # P2: NEW (shadcn install)
│       └── skeleton.tsx                                # P3: NEW (shadcn install)
├── i18n/
│   └── messages/
│       ├── en.json                                     # P1/P2: new keys
│       └── de.json                                     # P1/P2: new keys
prisma/
└── seed.ts                                             # P6: employee password
```

**Structure Decision**: No new directories or architectural changes. All modifications happen within the existing Next.js App Router structure. Two new shadcn/ui primitives are installed into the existing `src/components/ui/` directory.

## Implementation by Story

### P1: Mobile Interview Tabs

**Files**: `interview/[interviewId]/page.tsx`, `en.json`, `de.json`

**Approach**:
1. Import existing `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` from `src/components/ui/tabs`
2. In the main content area, wrap chat + summary in a `<Tabs>` component
3. Render `<TabsList>` with two triggers ("Chat" / "Summary") — visible only below `lg` via `lg:hidden`
4. On `lg+`, render both panels side-by-side as today (tabs component still wraps but tabs strip is hidden, both TabsContent panels render)
5. Track `summaryHasUpdate` state: set `true` on SSE event when active tab is "chat"; clear on tab switch to "summary"
6. Render a small dot indicator on the Summary tab trigger when `summaryHasUpdate` is true

**i18n keys**:
- `interview.tabChat`: "Chat" / "Chat"
- `interview.tabSummary`: "Summary" / "Zusammenfassung"

### P2: Mobile Navigation

**Files**: `header.tsx`, `en.json`, `de.json`, NEW `ui/sheet.tsx`

**Approach**:
1. Install Sheet: `npx shadcn@latest add sheet`
2. Add a hamburger `<Button>` (Menu icon from lucide-react) visible below `md` (768px) via `md:hidden`
3. Wrap existing nav links, language switcher, and user actions in a `<Sheet>` that opens from the left
4. Hide the inline desktop nav below `md` via `hidden md:flex`
5. Inside Sheet: stack items vertically with spacing, include language switcher and sign-out

**i18n keys**:
- `common.menu`: "Menu" / "Menü"

### P3: Skeleton Loading States

**Files**: 4 `loading.tsx` files, NEW `ui/skeleton.tsx`

**Approach**:
1. Install Skeleton: `npx shadcn@latest add skeleton`
2. Update each `loading.tsx` to use `<Skeleton>` with dimensions matching the real content:
   - Projects: 3-column card grid with skeleton cards (title + 3 text lines)
   - Dashboard: Welcome card skeleton + interview list rows
   - Interview: Chat area skeleton (message bubbles) + sidebar skeleton
   - Process detail: Title + markdown block + BPMN placeholder
3. Existing `loading.tsx` files already have rough structure — refine with `<Skeleton>` component

### P4: Responsive Form Grids

**Files**: `project-form.tsx`, `settings/page.tsx`

**Approach**:
1. Change `grid grid-cols-3 gap-2` → `grid grid-cols-1 md:grid-cols-3 gap-2`
2. On mobile (< 768px): fields stack vertically, delete button appears after the English label input
3. On desktop: unchanged 3-column layout
4. Both files have identical grid markup — apply same change to both

### P5: BPMN Viewer Dark Mode

**Files**: `bpmn-viewer.tsx`

**Approach**:
1. Change `bg-white` → `bg-white dark:bg-card`
2. One-line change. The SVG diagram elements (dark strokes/fills) remain visible on both backgrounds.

### P6: Employee Password Login (Dev Mode)

**Files**: `magic-link-form.tsx`, `seed.ts`, `en.json`, `de.json`

**Approach**:
1. **Seed**: Add credential-provider account for employee with hashed password `employee123` (same pattern as consultant seed)
2. **Login form**: Detect dev mode via `process.env.NODE_ENV === "development"` (available at build time in Next.js)
3. In dev mode: show email + password fields and a "Sign In" button. On submit, call `signIn.email({ email, password })` then redirect to dashboard
4. In production: show existing magic-link flow unchanged
5. Could be a conditional branch within `magic-link-form.tsx` or a separate `EmployeeDevLoginForm` component rendered conditionally on the login page

**i18n keys**: Reuse existing `auth.email`, `auth.password`, `auth.signIn` keys — no new translations needed.

## Complexity Tracking

No constitution violations. No complexity justification needed.
