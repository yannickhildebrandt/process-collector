# Data Model: Platform Foundation

**Feature**: 001-platform-foundation
**Date**: 2026-02-23
**Storage**: PostgreSQL with Prisma ORM

## Entity Relationship Overview

```text
User ──────┐
  │        │
  │ (1:N)  │ (N:M via ProjectMember)
  │        │
  ▼        ▼
Session  Project ──── ProjectConfiguration (1:1)
           │
           │ (1:N)
           ▼
        ProcessEntry

LLMProviderConfig (standalone, system-level)
```

## Entities

### User

| Field           | Type     | Constraints                          |
|-----------------|----------|--------------------------------------|
| id              | UUID     | Primary key, auto-generated          |
| email           | String   | Unique, not null, lowercase          |
| displayName     | String   | Not null                             |
| role            | Enum     | CONSULTANT or EMPLOYEE               |
| preferredLang   | Enum     | DE or EN, default EN                 |
| passwordHash    | String   | Nullable (null for Employees)        |
| emailVerified   | Boolean  | Default false                        |
| createdAt       | DateTime | Auto-set on creation                 |
| updatedAt       | DateTime | Auto-updated                         |

**Rules**:
- Email is the unique identity across the system.
- Employees have no password (magic link only); passwordHash
  is null for role=EMPLOYEE.
- Consultants MUST have a passwordHash.
- preferredLang persists across sessions (FR-013).

**State transitions**: None (Users are active or soft-deleted).

---

### Session

| Field      | Type     | Constraints                       |
|------------|----------|-----------------------------------|
| id         | UUID     | Primary key                       |
| userId     | UUID     | Foreign key → User.id, not null   |
| token      | String   | Unique, not null                  |
| expiresAt  | DateTime | Not null (createdAt + 7 days)     |
| createdAt  | DateTime | Auto-set                          |

**Rules**:
- Sessions expire after 7 days (FR-012).
- Single-use magic link tokens are separate from sessions
  (handled by Better Auth's magic link plugin internally).

---

### Project

| Field       | Type     | Constraints                        |
|-------------|----------|------------------------------------|
| id          | UUID     | Primary key, auto-generated        |
| name        | String   | Not null                           |
| industry    | String   | Not null                           |
| status      | Enum     | ACTIVE or ARCHIVED, default ACTIVE |
| createdAt   | DateTime | Auto-set                           |
| updatedAt   | DateTime | Auto-updated                       |

**Rules**:
- Project name need not be globally unique, but a duplicate
  name within the same consultant's projects triggers a warning
  (edge case from spec).
- A Project MUST have at least one Consultant member.

**State transitions**:
```text
ACTIVE → ARCHIVED (consultant action, no reverse in foundation)
```

---

### ProjectMember

Join table for User ↔ Project relationship.

| Field     | Type     | Constraints                          |
|-----------|----------|--------------------------------------|
| id        | UUID     | Primary key                          |
| projectId | UUID     | Foreign key → Project.id, not null   |
| userId    | UUID     | Foreign key → User.id, not null      |
| role      | Enum     | CONSULTANT or EMPLOYEE               |

**Rules**:
- Unique constraint on (projectId, userId).
- An Employee MUST belong to exactly one Project (enforced at
  application level: reject addMember if role=EMPLOYEE and
  user already has a ProjectMember row).
- A Consultant can belong to multiple Projects.

---

### ProjectConfiguration

| Field                | Type     | Constraints                       |
|----------------------|----------|-----------------------------------|
| id                   | UUID     | Primary key                       |
| projectId            | UUID     | Foreign key → Project.id, unique  |
| industryClassification | JSONB  | Not null                          |
| processCategories    | JSONB    | Not null, array of objects        |
| customTerminology    | JSONB    | Nullable, key-value overrides     |
| interviewTemplateRefs | JSONB   | Nullable, array of references     |
| updatedAt            | DateTime | Auto-updated                      |
| version              | Int      | Optimistic lock counter, default 1|

**Rules**:
- One-to-one with Project (unique projectId).
- JSONB fields validated at application level against a schema
  before persisting (constitution: configuration schemas MUST be
  validated; invalid configs MUST produce clear error messages).
- `version` field enables optimistic concurrency control to
  prevent silent overwrites (edge case: concurrent edits).

**JSONB structure examples**:

`processCategories`:
```json
[
  { "key": "procurement", "labelDe": "Beschaffung", "labelEn": "Procurement" },
  { "key": "hr-onboarding", "labelDe": "Einstellung", "labelEn": "HR Onboarding" }
]
```

`customTerminology`:
```json
{
  "process": { "de": "Vorgang", "en": "Process" },
  "step": { "de": "Schritt", "en": "Step" }
}
```

---

### ProcessEntry

| Field          | Type     | Constraints                         |
|----------------|----------|-------------------------------------|
| id             | UUID     | Primary key, auto-generated         |
| projectId      | UUID     | Foreign key → Project.id, not null  |
| createdById    | UUID     | Foreign key → User.id, not null     |
| title          | String   | Not null                            |
| status         | Enum     | DRAFT, IN_PROGRESS, COMPLETED, VALIDATED |
| markdownContent | Text    | Nullable (empty until populated)    |
| bpmnXml        | Text     | Nullable (empty until populated)    |
| createdAt      | DateTime | Auto-set                            |
| updatedAt      | DateTime | Auto-updated                        |

**Rules**:
- createdById MUST reference a User with role=EMPLOYEE.
- In the foundation phase, ProcessEntry is a stub with sample
  data for rendering validation (US4). The full lifecycle is
  out of scope.

**State transitions** (foundation: informational only):
```text
DRAFT → IN_PROGRESS → COMPLETED → VALIDATED
```

---

### LLMProviderConfig

| Field          | Type     | Constraints                       |
|----------------|----------|-----------------------------------|
| id             | UUID     | Primary key                       |
| providerKey    | String   | Unique, not null (e.g., "claude") |
| displayName    | String   | Not null                          |
| apiEndpoint    | String   | Not null                          |
| credentialRef  | String   | Not null (env var name or secret) |
| modelId        | String   | Not null                          |
| maxTokens      | Int      | Not null, default 4096            |
| rateLimitRpm   | Int      | Nullable (requests per minute)    |
| dpaActive      | Boolean  | Not null, default false           |
| isDefault      | Boolean  | Not null, default false           |
| createdAt      | DateTime | Auto-set                          |

**Rules**:
- System MUST refuse to send requests to providers where
  dpaActive=false (FR-015).
- Exactly one provider SHOULD be marked isDefault=true.
- credentialRef points to an environment variable or secret
  store key — the actual API key is never stored in the database.
- providerKey is the adapter identifier used by the LLM
  abstraction layer to select the correct adapter implementation.

## Indexes

- `User.email` — unique index
- `ProjectMember(projectId, userId)` — unique composite index
- `ProjectConfiguration.projectId` — unique index
- `ProcessEntry(projectId, status)` — composite index for
  listing entries by project and status
- `LLMProviderConfig.providerKey` — unique index
