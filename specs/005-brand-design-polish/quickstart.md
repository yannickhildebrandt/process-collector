# Quickstart: 005-brand-design-polish

**Branch**: `005-brand-design-polish`

## Prerequisites

- Node.js 22+
- PostgreSQL running locally
- `.env` configured (copy from `.env.example`)

## Setup

```bash
git checkout 005-brand-design-polish
npm install
npm run dev
```

No database changes or re-seeding needed.

## Dev Credentials

| Role | Email | Password |
|------|-------|----------|
| Consultant | consultant@demo.com | consultant123 |
| Employee | employee@client.com | employee123 |

## Testing Checklist

### P1: BPMN Diagram Regeneration
1. Log in as employee, start an interview, send 3-4 messages describing a process
2. Switch to Summary tab (mobile) or view sidebar (desktop) → click "Generate Diagram" → diagram appears
3. Send 2 more messages describing additional process steps → summary updates
4. Click "Generate Diagram" again → diagram regenerates with the new steps visible
5. When no summary exists (fresh interview, no messages) → button is disabled

### P2: Brand Color Scheme
1. Open the login page → background white, text dark, accent elements cyan-blue
2. Log in → dashboard shows white background, dark text, cyan-blue primary buttons
3. Navigate to Projects → buttons are pill-shaped (rounded-full) for primary actions
4. Check all pages: Projects, Dashboard, Interview, Settings → consistent brand colors
5. Toggle dark mode → dark backgrounds, cyan-blue accent preserved, text readable

### P3: Typography and Spacing
1. Compare heading sizes and weights across pages → consistent hierarchy
2. Check body text legibility → comfortable line height, appropriate size
3. Compare side-by-side with eggers-partner.de → similar professional tone

### Accessibility Validation
1. Use browser DevTools or axe extension to check contrast ratios
2. All normal text: minimum 4.5:1 contrast ratio
3. All large text and UI components: minimum 3:1 contrast ratio
4. Focus indicators: visible cyan-blue ring on all interactive elements
