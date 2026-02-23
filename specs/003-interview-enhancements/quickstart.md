# Quickstart: Interview Enhancements

## Testing Scenarios

### Scenario 1: Summary Panel + Live BPMN (US1 + US4)

1. Login as employee (`employee@client.com` via magic link)
2. Go to Dashboard → Start a new interview (title: "Order Processing", category: "Procurement")
3. Observe: The AI greeting should appear immediately (already there on page load)
4. Send message: "The process starts when a purchase request is submitted by a department head"
5. Wait for AI response + 2-3 seconds
6. **Verify**: Summary panel shows "Trigger" section; BPMN diagram shows start event
7. Send message: "The request goes to the purchasing department who checks the budget"
8. **Verify**: Summary adds a step; BPMN diagram now shows Start → Task
9. Send message: "If the budget is over 5000 EUR it needs director approval, otherwise the manager approves it"
10. **Verify**: BPMN diagram shows a gateway with two outgoing paths

### Scenario 2: Contextual AI Greeting (US2)

1. Login as employee
2. Note the project is "Acme Corp" in Manufacturing/Automotive industry
3. Start a new interview: title "Quality Inspection", category "Quality Assurance"
4. **Verify**: First message from AI mentions "Quality Inspection", "Quality Assurance", manufacturing/automotive context
5. Check the message is in the employee's preferred language
6. Close and reopen the interview page
7. **Verify**: The greeting is still there (persisted, not regenerated)

### Scenario 3: Consultant Config Chat (US3)

1. Login as consultant (`consultant@demo.com` / `consultant123`)
2. Go to Projects → Acme Corp → Settings
3. Click "Configure via AI" button (alongside the existing form)
4. **Verify**: Chat interface opens with AI greeting about the current project config
5. Type: "We need to add a customer complaints category and update terminology: use 'Reklamation' for complaints in German"
6. **Verify**: Preview panel shows updated categories + terminology
7. Click "Apply Configuration"
8. **Verify**: Settings page form now shows the new category and terminology
9. Refresh the page to confirm persistence

### Scenario 4: Error Handling

1. Stop the AI service (set invalid API key in .env.local)
2. Start a new interview
3. **Verify**: Static fallback greeting is displayed (not an error)
4. Send a message
5. **Verify**: Error message appears with retry button
6. Restore valid API key
7. Click retry → **Verify**: AI responds normally

## Prerequisites

- PostgreSQL running (docker-compose up -d)
- Database seeded (`npx prisma db seed`)
- `.env.local` with valid `ANTHROPIC_API_KEY`
- Dev server running (`npx next dev`)
- Default LLM provider set to "claude" (isDefault: true in seed)
