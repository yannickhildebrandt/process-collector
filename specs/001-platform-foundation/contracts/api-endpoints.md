# API Contracts: Platform Foundation

**Feature**: 001-platform-foundation
**Date**: 2026-02-23
**Protocol**: REST over HTTPS (Next.js API routes)
**Format**: JSON request/response

## Authentication Endpoints

Authentication is handled by Better Auth's built-in routes.
The following are the key endpoints exposed:

### POST /api/auth/sign-up

Create a new Consultant account.

**Request**:
```json
{
  "email": "consultant@example.com",
  "password": "securePassword123",
  "name": "Anna Schmidt"
}
```

**Response (201)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "consultant@example.com",
    "name": "Anna Schmidt"
  },
  "session": {
    "id": "uuid",
    "token": "session-token",
    "expiresAt": "2026-03-02T12:00:00Z"
  }
}
```

**Error (400)**: `{ "error": "Email already registered" }`

---

### POST /api/auth/sign-in/email

Consultant sign-in with email and password.

**Request**:
```json
{
  "email": "consultant@example.com",
  "password": "securePassword123"
}
```

**Response (200)**: Session object (same as sign-up).
**Error (401)**: `{ "error": "Invalid credentials" }`

---

### POST /api/auth/magic-link/send

Send a magic link to an Employee's email.

**Request**:
```json
{
  "email": "employee@client.com"
}
```

**Response (200)**: `{ "message": "Magic link sent" }`
**Error (404)**: `{ "error": "No account found for this email" }`

**Notes**: Magic link expires after 15 minutes. Single use.

---

### GET /api/auth/magic-link/verify?token=xxx

Verify magic link token and create session.

**Response (302)**: Redirects to dashboard with session cookie.
**Error (400)**: `{ "error": "Invalid or expired link" }`

---

### POST /api/auth/sign-out

End the current session.

**Response (200)**: `{ "message": "Signed out" }`

---

## Project Management Endpoints

### GET /api/projects

List projects for the authenticated user.

**Auth**: Required (Consultant or Employee).
**Response (200)**:
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Acme Corp Process Capture",
      "industry": "Manufacturing",
      "status": "ACTIVE",
      "memberCount": 12,
      "createdAt": "2026-02-20T10:00:00Z"
    }
  ]
}
```

**Notes**: Consultants see all their projects. Employees see
only their single assigned project.

---

### POST /api/projects

Create a new client project.

**Auth**: Required (Consultant only).
**Request**:
```json
{
  "name": "Acme Corp Process Capture",
  "industry": "Manufacturing",
  "configuration": {
    "industryClassification": { "sector": "Manufacturing", "subSector": "Automotive" },
    "processCategories": [
      { "key": "procurement", "labelDe": "Beschaffung", "labelEn": "Procurement" },
      { "key": "quality", "labelDe": "Qualitaetssicherung", "labelEn": "Quality Assurance" }
    ],
    "customTerminology": null,
    "interviewTemplateRefs": null
  }
}
```

**Response (201)**:
```json
{
  "project": {
    "id": "uuid",
    "name": "Acme Corp Process Capture",
    "industry": "Manufacturing",
    "status": "ACTIVE",
    "createdAt": "2026-02-23T12:00:00Z"
  }
}
```

**Error (400)**: Validation errors (missing required fields).
**Error (409)**: `{ "warning": "A project with this name already exists", "existingProjectId": "uuid" }`

---

### GET /api/projects/:projectId

Get project details including configuration.

**Auth**: Required (project member).
**Response (200)**:
```json
{
  "project": {
    "id": "uuid",
    "name": "Acme Corp Process Capture",
    "industry": "Manufacturing",
    "status": "ACTIVE",
    "createdAt": "2026-02-20T10:00:00Z",
    "configuration": {
      "industryClassification": { "sector": "Manufacturing", "subSector": "Automotive" },
      "processCategories": [...],
      "customTerminology": {...},
      "interviewTemplateRefs": [...]
    }
  }
}
```

---

### PATCH /api/projects/:projectId/configuration

Update project configuration.

**Auth**: Required (Consultant only, project member).
**Request**:
```json
{
  "version": 1,
  "configuration": {
    "processCategories": [...]
  }
}
```

**Response (200)**: Updated project configuration.
**Error (409)**: `{ "error": "Configuration has been modified by another user", "currentVersion": 2 }`

**Notes**: `version` field enables optimistic concurrency control.

---

### POST /api/projects/:projectId/invite

Invite an employee to the project via magic link.

**Auth**: Required (Consultant only, project member).
**Request**:
```json
{
  "email": "employee@client.com",
  "displayName": "Max Mueller"
}
```

**Response (201)**:
```json
{
  "invitation": {
    "email": "employee@client.com",
    "magicLinkSent": true
  }
}
```

**Error (400)**: `{ "error": "This employee is already assigned to another project" }`

**Notes**: Creates User (role=EMPLOYEE) if not exists, creates
ProjectMember, and sends magic link email.

---

## Process Entry Endpoints (Foundation Stubs)

### GET /api/projects/:projectId/processes

List process entries for a project.

**Auth**: Required (project member).
**Response (200)**:
```json
{
  "processes": [
    {
      "id": "uuid",
      "title": "Order-to-Cash",
      "status": "COMPLETED",
      "createdBy": { "id": "uuid", "displayName": "Max Mueller" },
      "createdAt": "2026-02-21T14:00:00Z"
    }
  ]
}
```

---

### GET /api/projects/:projectId/processes/:processId

Get a single process entry with full content.

**Auth**: Required (project member).
**Response (200)**:
```json
{
  "process": {
    "id": "uuid",
    "title": "Order-to-Cash",
    "status": "COMPLETED",
    "markdownContent": "# Order-to-Cash Process\n\n## Trigger\n...",
    "bpmnXml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
    "createdBy": { "id": "uuid", "displayName": "Max Mueller" },
    "createdAt": "2026-02-21T14:00:00Z",
    "updatedAt": "2026-02-22T09:30:00Z"
  }
}
```

---

## LLM Abstraction Endpoints (Internal)

### POST /api/llm/complete

Send a prompt through the LLM abstraction layer.

**Auth**: Required (system-internal, authenticated user).
**Request**:
```json
{
  "prompt": "Summarize the following process steps...",
  "systemMessage": "You are a business process analyst...",
  "options": {
    "maxTokens": 2048,
    "temperature": 0.3
  }
}
```

**Response (200)**:
```json
{
  "result": {
    "content": "The process consists of 5 main steps...",
    "provider": "claude",
    "model": "claude-sonnet-4-6",
    "usage": {
      "promptTokens": 150,
      "completionTokens": 200
    }
  }
}
```

**Error (503)**:
```json
{
  "error": "LLM service temporarily unavailable",
  "retryAfter": 30
}
```

**Error (403)**:
```json
{
  "error": "LLM provider does not have an active DPA"
}
```

**Notes**: The abstraction layer strips PII before sending to
the provider (FR-014). Provider selection is based on
LLMProviderConfig.isDefault or explicit provider override.

---

## User Preferences Endpoint

### PATCH /api/user/preferences

Update the authenticated user's preferences.

**Auth**: Required.
**Request**:
```json
{
  "preferredLang": "DE"
}
```

**Response (200)**:
```json
{
  "user": {
    "id": "uuid",
    "preferredLang": "DE"
  }
}
```

---

## Common Response Patterns

**Error format** (all endpoints):
```json
{
  "error": "Human-readable error message in user's preferred language",
  "code": "VALIDATION_ERROR"
}
```

**HTTP status codes used**:
- 200: Success
- 201: Created
- 302: Redirect (magic link verification)
- 400: Validation error
- 401: Not authenticated
- 403: Not authorized / DPA violation
- 404: Resource not found
- 409: Conflict (duplicate / version mismatch)
- 503: Service unavailable (LLM provider down)
