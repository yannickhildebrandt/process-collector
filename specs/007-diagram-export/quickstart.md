# Quickstart: 007-diagram-export

**Branch**: `007-diagram-export`

## Prerequisites

- Node.js 22+
- PostgreSQL running locally
- `.env` configured (copy from `.env.example`)

## Setup

```bash
git checkout 007-diagram-export
npm install
npm run dev
```

New dependencies: `jspdf`, `svg2pdf.js` (installed via npm install).

## Dev Credentials

| Role | Email | Password |
|------|-------|----------|
| Consultant | consultant@demo.com | consultant123 |
| Employee | employee@client.com | employee123 |

## Creating Test Data

To test diagram export, you need a completed process with BPMN:

1. Log in as employee (employee@client.com / employee123)
2. Start an interview from the dashboard
3. Describe a process with 3-4 steps
4. Request summary, then confirm to create the process
5. Log in as consultant (consultant@demo.com / consultant123)
6. Navigate to the project → click on the created process

## Testing Checklist

### P1: PNG Export
1. Open a process with a BPMN diagram → export button visible near the diagram
2. Click export → select PNG → PNG file downloads within 3 seconds
3. Open the PNG → contains the complete diagram (not just visible portion)
4. File name includes the process title (e.g., "Raw-Materials-Procurement.png")
5. Image resolution is high quality (2x scale, minimum 1920px wide)
6. Open a process with no BPMN (markdown only) → export button not shown

### P2: PDF Export with Paper Sizes
1. Click export → select PDF → paper size options appear (A0, A1, A2, A3, A4)
2. Select A4 → PDF downloads within 5 seconds
3. Open the PDF → landscape orientation, diagram fitted to page
4. Diagram labels and annotations are readable
5. Repeat for A3, A2, A1, A0 → each produces correct page dimensions
6. Export a simple diagram (2-3 elements) to A0 → diagram centered, not stretched

### Edge Cases
1. Click export while diagram is loading → button is disabled
2. Test on mobile viewport (375px) → export button accessible and functional
