# Data Model: AI-Guided Interview

**Feature**: 002-ai-guided-interview
**Date**: 2026-02-23

## New Entities

### InterviewSession

Represents an ongoing or completed process interview.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| projectId | UUID | FK → Project, required | The project this interview belongs to |
| employeeId | UUID | FK → User, required | The employee conducting the interview |
| processCategory | String | required | Process category key from project configuration |
| title | String | required | Employee-provided title (e.g., "Raw Materials Procurement") |
| status | Enum | required, default: IN_PROGRESS | Current interview state |
| currentSummaryJson | JSON | nullable | Live evolving process summary (structured JSON) |
| processEntryId | UUID | FK → ProcessEntry, nullable, unique | Link to the generated ProcessEntry upon completion |
| messageRetentionUntil | DateTime | nullable | Date after which messages should be purged (set on completion: completedAt + 90 days configurable) |
| createdAt | DateTime | auto | Interview start timestamp |
| updatedAt | DateTime | auto | Last activity timestamp |

**Status values**: `IN_PROGRESS`, `SUMMARY_REVIEW`, `COMPLETED`, `STALE`

**State transitions**:
```
IN_PROGRESS → SUMMARY_REVIEW  (AI has gathered enough info, presents summary)
SUMMARY_REVIEW → IN_PROGRESS  (Employee requests corrections)
SUMMARY_REVIEW → COMPLETED    (Employee confirms summary)
IN_PROGRESS → STALE           (Idle > 30 days, automated)
STALE → IN_PROGRESS           (Employee resumes with recap)
```

**Uniqueness**: No unique constraint on (projectId, employeeId, processCategory) — employees can create multiple interviews per category, distinguished by title.

### InterviewMessage

A single message in the interview conversation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| interviewSessionId | UUID | FK → InterviewSession, required | Parent interview |
| role | Enum | required | Message sender: `ASSISTANT` or `USER` |
| content | Text | required | Message content |
| orderIndex | Int | required | Chronological ordering within the session |
| createdAt | DateTime | auto | Message timestamp |

**Ordering**: Messages are ordered by `orderIndex` within an InterviewSession.

**Retention**: Messages are purged after `InterviewSession.messageRetentionUntil` date. The InterviewSession metadata and ProcessEntry are preserved.

## Modified Entities

### ProcessEntry (existing)

Add optional back-reference to the source interview:

| Field | Type | Change |
|-------|------|--------|
| interviewSessionId | UUID | NEW — FK → InterviewSession, nullable, unique. Set when a completed interview generates this ProcessEntry. Null for manually-created entries (e.g., seed data). |

## Entity Relationships

```
Project 1──* InterviewSession
User 1──* InterviewSession (as employee)
InterviewSession 1──* InterviewMessage
InterviewSession 1──0..1 ProcessEntry (upon completion)
```

## Process Summary JSON Schema

The `currentSummaryJson` field stores the live evolving process summary. Schema:

```json
{
  "processName": "string",
  "description": "string (optional)",
  "trigger": {
    "description": "string",
    "type": "string (optional, e.g., 'event', 'manual', 'scheduled')"
  },
  "steps": [
    {
      "id": "string (unique within process)",
      "name": "string",
      "description": "string",
      "type": "task | decision | subprocess",
      "actor": "string (optional, role/person responsible)",
      "system": "string (optional, IT system involved)",
      "nextSteps": ["string (IDs of subsequent steps)"],
      "conditions": {
        "conditionText": "targetStepId"
      }
    }
  ],
  "roles": [
    {
      "name": "string",
      "description": "string (optional)"
    }
  ],
  "systems": [
    {
      "name": "string",
      "description": "string (optional)"
    }
  ],
  "metrics": [
    {
      "name": "string",
      "value": "string (optional)"
    }
  ]
}
```

## Indexes

- `InterviewSession`: Index on `(projectId, employeeId)` for dashboard queries
- `InterviewSession`: Index on `(status)` for stale interview cleanup job
- `InterviewMessage`: Index on `(interviewSessionId, orderIndex)` for ordered message retrieval
