# API Contracts: Interview Enhancements

## Modified Endpoints

### POST /api/projects/[projectId]/interviews

**Change**: Now generates a contextual AI greeting and persists it as the first message before returning.

**Request**: Unchanged — `{ processCategory: string, title: string }`

**Response** (201): Unchanged shape — `{ interview: { id, processCategory, title, status } }`

**Behavior change**:
1. Create InterviewSession (existing)
2. Build system prompt from project config (title, category, industry, terminology)
3. Call `generateText` with greeting instruction to produce contextual greeting
4. Persist greeting as InterviewMessage (role: ASSISTANT, orderIndex: 0)
5. If AI call fails, persist static fallback greeting from i18n
6. Return interview (existing)

**Latency impact**: ~1-3 seconds additional due to AI call. Fallback ensures creation never fails.

---

## New Endpoints

### POST /api/projects/[projectId]/configure-chat

**Purpose**: Streaming chat endpoint for consultant project configuration conversation.

**Auth**: Session required, user must be CONSULTANT and project member.

**Request body** (Vercel AI SDK protocol):
```json
{
  "messages": [
    { "role": "user", "parts": [{ "type": "text", "text": "..." }] }
  ]
}
```

**Response**: SSE stream (Vercel AI SDK `toUIMessageStreamResponse()` format)

**Behavior**:
1. Validate consultant is project member with CONSULTANT role
2. Load existing project configuration (if any) for context
3. Build config chat system prompt (project name, current config)
4. Stream AI response via `streamText`
5. In `onFinish`: extract structured config via `generateObject` with ProjectConfigurationSchema
6. Return extracted config in a custom header or separate endpoint

**Error responses**:
- 401: Not authenticated
- 403: Not a consultant / not project member
- 503: AI service unavailable

### POST /api/projects/[projectId]/configure-chat/apply

**Purpose**: Apply the extracted configuration to the project.

**Auth**: Session required, CONSULTANT role, project member.

**Request body**:
```json
{
  "configuration": {
    "industryClassification": { "sector": "Healthcare", "subSector": "Hospital" },
    "processCategories": [
      { "key": "patient-intake", "labelDe": "Patientenaufnahme", "labelEn": "Patient Intake" }
    ],
    "customTerminology": [
      { "term": "process", "de": "Vorgang", "en": "Process" }
    ],
    "interviewTemplateRefs": ["ISO 27001"]
  },
  "version": 1
}
```

**Response** (200):
```json
{
  "configuration": { ... },
  "version": 2
}
```

**Behavior**:
1. Convert array-format customTerminology to record format for storage
2. Validate against `validateConfiguration()`
3. Check version for optimistic concurrency (409 on conflict)
4. Update ProjectConfiguration (or create if none exists)
5. Return updated configuration with new version

**Error responses**:
- 400: Validation failed (with details)
- 409: Version conflict
- 401/403: Auth errors
