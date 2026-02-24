# Quickstart: 004-ui-refinements

**Branch**: `004-ui-refinements`

## Prerequisites

- Node.js 22+
- PostgreSQL running locally
- `.env` configured (copy from `.env.example`)

## Setup

```bash
git checkout 004-ui-refinements
npm install
npx shadcn@latest add sheet skeleton   # New UI components
npx prisma db push                      # No migration needed
npx prisma db seed                      # Re-seed for employee password
npm run dev
```

## Dev Credentials

| Role | Email | Password |
|------|-------|----------|
| Consultant | consultant@demo.com | consultant123 |
| Employee | employee@client.com | employee123 |

## Testing Checklist

### P1: Mobile Interview Tabs
1. Open interview at 375px width → Chat/Summary tabs visible
2. Switch tabs → content swaps, no scroll reset
3. Trigger SSE update while on Chat tab → dot appears on Summary tab
4. Resize to 1024px+ → tabs disappear, side-by-side layout restored

### P2: Mobile Navigation
1. Open any page at 375px → hamburger icon visible
2. Tap hamburger → Sheet opens with nav links, language, sign-out
3. Resize to 768px+ → inline nav restored, hamburger hidden

### P3: Skeleton Loaders
1. Throttle network (Slow 3G) → navigate to Projects → card grid skeletons
2. Navigate to Dashboard → interview list skeletons
3. Navigate to Interview → chat + sidebar skeletons

### P4: Responsive Forms
1. Open project creation at 375px → single-column inputs
2. Open project settings at 768px → 3-column category grid restored

### P5: BPMN Dark Mode
1. Enable dark mode → view process with diagram → background matches card

### P6: Employee Dev Login
1. Start dev server → Employee tab shows email + password fields
2. Login with employee@client.com / employee123 → redirects to dashboard
3. In production build (`npm run build && npm start`), employee tab shows magic link only
