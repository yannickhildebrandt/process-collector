# Data Model: 007-diagram-export

## Overview

This feature involves no database schema changes. The export is performed entirely client-side using the BPMN XML already loaded in the viewer. No data is persisted — the exported files are downloaded directly to the user's device.

## Affected Entities

### ProcessEntry (existing, unchanged)

| Field | Type | Notes |
|-------|------|-------|
| bpmnXml | Text (nullable) | Source for SVG extraction via bpmn-js viewer |
| title | String | Used for export file naming |

No new fields, tables, or relationships needed.
