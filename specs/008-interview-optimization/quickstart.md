# Quickstart: 008-interview-optimization

**Branch**: `008-interview-optimization`

## Prerequisites

- Node.js 22+
- PostgreSQL running locally
- `.env` configured (copy from `.env.example`)

## Setup

```bash
git checkout 008-interview-optimization
npm install
npx prisma migrate dev
npm run dev
```

New migration: adds `lastSummarizedIndex` field to InterviewSession.

## Dev Credentials

| Role | Email | Password |
|------|-------|----------|
| Consultant | consultant@demo.com | consultant123 |
| Employee | employee@client.com | employee123 |

## Testing Checklist

### P1: Batched Summary Extraction
1. Log in as employee, start a new interview
2. Send 3 messages describing a process (trigger, 2 steps)
3. After message 3: summary panel should update (extraction triggered)
4. Send messages 4 and 5: summary panel should NOT update yet
5. Send message 6: summary panel should update again (batch boundary)
6. Click "Request Summary": summary should update immediately regardless of batch position
7. Verify summary contains information from ALL messages (no data loss from batching)

### P2a: Conversation Windowing
1. Conduct a 20+ message interview (describe a complex process with many steps, roles, systems)
2. After message 20, ask the AI about a detail mentioned in message 3
3. AI should answer correctly (information captured in summary, not dependent on windowed-out messages)
4. Verify AI response time for message 20 is similar to message 5 (no noticeable degradation)
5. Conduct a short interview (< 15 messages): all messages should be sent to AI (no windowing)

### P2b: Chat Visual Polish & Markdown Rendering
1. Start an interview and send a few messages
2. AI messages should display with an AI icon/avatar and formatted rich text
3. When the AI produces a bullet list, it should render as actual bullets (not raw `- ` syntax)
4. When the AI uses **bold** text, it should render as bold
5. User messages should show with a user icon and clean bubble styling (no markdown rendering)
6. During streaming, markdown should render progressively (formatted text builds up, not raw syntax)

### P3: Configuration Caching
1. Start an interview, send 3 messages
2. Verify in server logs that project configuration is fetched once (not per message)
3. In a separate tab, update project configuration as consultant
4. Send another message in the interview
5. Verify the updated configuration is picked up (cache invalidated)

### Edge Cases
1. Close browser mid-interview and resume: verify context rebuilds correctly
2. Send messages rapidly (3 in quick succession): all should be captured, extraction on batch boundary
3. If AI service is down during extraction: interview should continue, extraction retried on next batch
