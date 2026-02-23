# API Contracts: AI-Guided Interview

**Feature**: 002-ai-guided-interview
**Date**: 2026-02-23

## Interview Session Endpoints

### POST /api/projects/[projectId]/interviews

Create a new interview session.

**Auth**: Employee, must be project member.

**Request body**:
```json
{
  "processCategory": "procurement",
  "title": "Raw Materials Procurement"
}
```

**Response 201**:
```json
{
  "interview": {
    "id": "uuid",
    "projectId": "uuid",
    "processCategory": "procurement",
    "title": "Raw Materials Procurement",
    "status": "IN_PROGRESS",
    "currentSummaryJson": null,
    "createdAt": "2026-02-23T12:00:00Z"
  }
}
```

**Errors**: 400 (missing fields), 403 (not project member), 404 (project not found)

---

### GET /api/projects/[projectId]/interviews

List interviews for the current employee in a project.

**Auth**: Employee, must be project member.

**Response 200**:
```json
{
  "interviews": [
    {
      "id": "uuid",
      "processCategory": "procurement",
      "title": "Raw Materials Procurement",
      "status": "IN_PROGRESS",
      "messageCount": 12,
      "updatedAt": "2026-02-23T14:00:00Z",
      "createdAt": "2026-02-23T12:00:00Z"
    }
  ]
}
```

---

### GET /api/projects/[projectId]/interviews/[interviewId]

Get full interview detail including messages and current summary.

**Auth**: Employee who owns the interview, or Consultant project member.

**Response 200**:
```json
{
  "interview": {
    "id": "uuid",
    "projectId": "uuid",
    "processCategory": "procurement",
    "title": "Raw Materials Procurement",
    "status": "IN_PROGRESS",
    "currentSummaryJson": { "processName": "...", "steps": [...] },
    "messages": [
      { "id": "uuid", "role": "ASSISTANT", "content": "...", "createdAt": "..." },
      { "id": "uuid", "role": "USER", "content": "...", "createdAt": "..." }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## Chat Streaming Endpoint

### POST /api/projects/[projectId]/interviews/[interviewId]/chat

Send a message and stream the AI response.

**Auth**: Employee who owns the interview. Interview status must be IN_PROGRESS or SUMMARY_REVIEW.

**Request body**:
```json
{
  "message": "The process starts when a purchase request is submitted by a department head."
}
```

**Response**: Server-Sent Events (SSE) stream via Vercel AI SDK data stream protocol.

Stream contains:
- Text chunks (AI's response)
- On stream completion, server persists both the user message and the AI response as InterviewMessages, then triggers a summary update.

**After stream completion**: The summary panel should refetch the interview to get the updated `currentSummaryJson`.

**Errors**: 403 (not interview owner), 404 (interview not found), 409 (interview not in valid status), 503 (LLM unavailable — interview state preserved)

---

## Interview Lifecycle Endpoints

### POST /api/projects/[projectId]/interviews/[interviewId]/request-summary

Transition interview to SUMMARY_REVIEW state. The AI generates a final summary.

**Auth**: Employee who owns the interview.

**Response 200**:
```json
{
  "interview": {
    "id": "uuid",
    "status": "SUMMARY_REVIEW",
    "currentSummaryJson": { "processName": "...", "steps": [...], ... }
  }
}
```

---

### POST /api/projects/[projectId]/interviews/[interviewId]/confirm

Confirm the summary. Generates ProcessEntry (Markdown + BPMN) and transitions to COMPLETED.

**Auth**: Employee who owns the interview. Interview must be in SUMMARY_REVIEW status.

**Response 200**:
```json
{
  "interview": {
    "id": "uuid",
    "status": "COMPLETED",
    "processEntryId": "uuid"
  },
  "processEntry": {
    "id": "uuid",
    "title": "Raw Materials Procurement",
    "status": "COMPLETED",
    "markdownContent": "# Raw Materials Procurement\n\n## Trigger\n...",
    "bpmnXml": "<?xml version=\"1.0\" ...?>"
  }
}
```

**Errors**: 409 (not in SUMMARY_REVIEW status), 500 (BPMN generation failed — marked for consultant review)

---

### POST /api/projects/[projectId]/interviews/[interviewId]/resume

Resume a STALE interview. AI provides a recap.

**Auth**: Employee who owns the interview. Interview must be in STALE status.

**Response 200**:
```json
{
  "interview": {
    "id": "uuid",
    "status": "IN_PROGRESS"
  }
}
```

---

### DELETE /api/projects/[projectId]/interviews/[interviewId]

Discard an in-progress or stale interview.

**Auth**: Employee who owns the interview. Interview must not be COMPLETED.

**Response 204**: No content.
