# Data Model: 006-process-detail-viewer

## Overview

This feature involves no database schema changes. The existing `ProcessEntry` table already contains all required fields (`bpmnXml`, `markdownContent`). The change is purely a layout redesign of the process detail page.

## Affected Entities

### ProcessEntry (existing, unchanged)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| title | String | Displayed in header |
| status | ProcessEntryStatus | Displayed as badge |
| markdownContent | Text (nullable) | Rendered in sidebar panel |
| bpmnXml | Text (nullable) | Rendered in main BPMN viewer |
| createdBy | User relation | Display name in header |
| createdAt | DateTime | Metadata |

No new fields, tables, or relationships needed.
