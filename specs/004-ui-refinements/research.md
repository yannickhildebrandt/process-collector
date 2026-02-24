# Research: 004-ui-refinements

**Date**: 2026-02-24

## R1: Mobile Interview Layout Pattern

**Decision**: Use shadcn/ui `<Tabs>` component (already installed) to create a Chat/Summary tabbed view on viewports below `lg` (1024px). On desktop, preserve the existing side-by-side flex layout.

**Rationale**: The Tabs component (`src/components/ui/tabs.tsx`) is already installed with Radix UI underpinnings and supports both "default" and "line" variants. It integrates natively with the existing component library — no new dependency needed. Tabs give each panel full viewport width on mobile, which is essential for both the chat input area and the BPMN diagram.

**Alternatives considered**:
- Stacked scroll (summary below chat): Both panels visible but each gets half height — cramped on phones. Chat auto-scroll conflicts with page scroll.
- Collapsible accordion: Unfamiliar pattern for a primary view; hides content by default and takes extra taps.

**Implementation notes**:
- Current layout: `flex flex-1 overflow-hidden` → chat (`flex-1`) + sidebar (`w-80 hidden lg:block`)
- New layout: Wrap in `<Tabs defaultValue="chat">` on mobile. Use CSS to show tabs strip only below `lg`, and render both panels simultaneously on `lg+`.
- New i18n keys needed: `interview.tabChat` and `interview.tabSummary`
- SSE update indicator: Track a `summaryHasUpdate` boolean state. Set to `true` when SSE fires while on Chat tab. Clear when user switches to Summary tab. Render as a small dot on the Summary tab trigger.

## R2: Mobile Navigation Pattern

**Decision**: Use shadcn/ui `Sheet` component (slide-out drawer) for mobile navigation. Need to install Sheet first — it does not exist at `src/components/ui/sheet.tsx`.

**Rationale**: Sheet (slide-out drawer) is the standard mobile navigation pattern. It's part of the shadcn/ui library (Radix Dialog-based) and follows the same styling conventions as the existing components. A dropdown menu would work but feels cramped for nav + language + sign-out.

**Alternatives considered**:
- Dropdown menu: Already used for user/language. Adding all nav items to a dropdown would create a deep, crowded menu.
- Full-screen overlay: Overkill for 3-4 navigation items.

**Implementation notes**:
- Header is at `src/components/layout/header.tsx`
- Current layout: `flex h-14 items-center justify-between` with no breakpoints
- Install Sheet: `npx shadcn@latest add sheet`
- Add hamburger button (`Menu` icon from lucide-react) visible below `md` (768px)
- Existing nav links, language switcher, and sign-out move into Sheet content on mobile
- Desktop layout unchanged (hide hamburger, show inline nav)

## R3: Skeleton Loading Component

**Decision**: Install shadcn/ui `Skeleton` component and create page-specific skeleton compositions. Update existing `loading.tsx` files.

**Rationale**: The project already has `loading.tsx` files with basic `bg-muted animate-pulse` divs, but no reusable Skeleton primitive. Adding the shadcn/ui Skeleton gives a consistent API and animation. Existing `loading.tsx` files serve as the right place for page-level skeletons (Next.js streaming).

**Alternatives considered**:
- Keep inline `bg-muted animate-pulse` divs: Works but inconsistent sizing and no shared animation timing.
- Third-party skeleton library: Unnecessary overhead when shadcn/ui provides one.

**Implementation notes**:
- Install: `npx shadcn@latest add skeleton`
- Update these `loading.tsx` files:
  - `src/app/[locale]/projects/loading.tsx` — card grid skeleton
  - `src/app/[locale]/dashboard/loading.tsx` — welcome card + interview list skeleton
  - `src/app/[locale]/interview/[interviewId]/loading.tsx` — chat + sidebar skeleton
  - `src/app/[locale]/projects/[projectId]/processes/[processId]/loading.tsx` — process detail skeleton
- Also update runtime loading states in `interview/[interviewId]/page.tsx` (the `if (loading)` block)

## R4: Responsive Form Grid

**Decision**: Change category input grids from fixed `grid-cols-3` to responsive `grid-cols-1 md:grid-cols-3`.

**Rationale**: Minimal change with maximum impact. On mobile (< 768px), inputs stack vertically. On tablet and desktop, the existing 3-column layout remains. The delete button moves below the English label input on mobile.

**Alternatives considered**:
- 2-column intermediate at `sm`: Category inputs have 3 related fields (key, DE label, EN label) — splitting across 2 columns breaks the logical grouping.

**Implementation notes**:
- Files: `src/components/projects/project-form.tsx` and `src/app/[locale]/projects/[projectId]/settings/page.tsx`
- Change: `grid grid-cols-3 gap-2` → `grid grid-cols-1 md:grid-cols-3 gap-2`
- Delete button: Currently in col 3 with `mt-auto`. On mobile single-column, move to a row below or inline with the last field.

## R5: BPMN Viewer Dark Mode

**Decision**: Replace hardcoded `bg-white` with `bg-white dark:bg-card` (or `bg-background`) on the viewer container.

**Rationale**: The project already uses CSS custom properties for dark mode via OKLch color space in `globals.css`. The `bg-card` or `bg-background` utility maps to the correct dark mode color automatically. bpmn-js renders SVG elements which inherit the container background.

**Alternatives considered**:
- Invert SVG colors for dark mode: Complex, fragile, and bpmn-js doesn't support it natively.
- Keep white background with rounded border: Looks intentional but jarring in dark theme.

**Implementation notes**:
- File: `src/components/processes/bpmn-viewer.tsx`
- Current: `className="border rounded-md bg-white"`
- Change to: `className="border rounded-md bg-white dark:bg-card"` (or `bg-background`)
- Note: BPMN diagram lines/shapes are typically dark-colored SVG paths — they remain visible on both light and dark backgrounds.

## R6: Employee Password Login (Dev Mode)

**Decision**: Show email+password fields on the employee login tab when `NODE_ENV === "development"`. Reuse the existing `signIn.email()` flow from Better Auth. Add a hashed password to the employee seed account.

**Rationale**: Better Auth already supports email/password authentication — it's what the consultant login uses. The employee account just needs a password in the database. The UI change is to conditionally show password fields in dev mode. No auth configuration changes needed.

**Alternatives considered**:
- Environment variable toggle (e.g., `ENABLE_EMPLOYEE_PASSWORD`): More flexible but unnecessary complexity for a dev-only convenience.
- Reuse ConsultantLoginForm for employees: Different redirect target and role expectations — better to keep forms separate.

**Implementation notes**:
- Seed file (`prisma/seed.ts`): Employee account currently has no password. Need to add one (e.g., `employee123`).
- Better Auth stores credentials in the `account` table with `providerId: "credential"`. The seed already creates this for the consultant — replicate for employee.
- Login form (`src/components/auth/magic-link-form.tsx`): Add conditional password field when `process.env.NODE_ENV === "development"`. Use `signIn.email()` instead of `signIn.magicLink()` when password is provided.
- Alternative: Create a new `EmployeeDevLoginForm` component shown only in dev mode. Simpler separation of concerns.
- Pass `NODE_ENV` to client via `NEXT_PUBLIC_DEV_MODE` or check at build time.
