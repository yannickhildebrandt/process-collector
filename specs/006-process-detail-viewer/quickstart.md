# Quickstart: 006-process-detail-viewer

**Branch**: `006-process-detail-viewer`

## Prerequisites

- Node.js 22+
- PostgreSQL running locally
- `.env` configured (copy from `.env.example`)

## Setup

```bash
git checkout 006-process-detail-viewer
npm install
npm run dev
```

No database changes or re-seeding needed.

## Dev Credentials

| Role | Email | Password |
|------|-------|----------|
| Consultant | consultant@demo.com | consultant123 |
| Employee | employee@client.com | employee123 |

## Creating Test Data

To test the process detail viewer, you need a completed process:

1. Log in as employee (employee@client.com / employee123)
2. Start an interview from the dashboard
3. Describe a process with 3-4 steps
4. Request summary, then confirm to create the process
5. Log in as consultant (consultant@demo.com / consultant123)
6. Navigate to the project → click on the created process

## Testing Checklist

### P1: Side-by-Side Layout (Desktop)
1. Open a process with both BPMN and markdown at 1024px+ → large BPMN viewer on left, text summary on right
2. BPMN viewer fills most of the viewport width (~65-75%)
3. Text summary panel scrolls independently
4. BPMN diagram supports pan and zoom
5. Header (title, creator, status, back button) remains above the content area

### P1: Content Variations
1. Process with only BPMN XML → diagram expands to full width
2. Process with only markdown → documentation displays prominently
3. Process with neither (draft) → empty state message shown

### P2: Mobile Layout
1. Open a process at 375px → tabs appear (Diagram / Documentation)
2. Switch between tabs → content swaps without page reload
3. BPMN diagram fills available width on mobile
4. Text summary is readable without horizontal scroll
