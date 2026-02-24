# Data Model Changes: Interview Assistant Optimization

**Feature**: 008-interview-optimization | **Date**: 2026-02-24

## Schema Changes

### InterviewSession — Add `lastSummarizedIndex` field

A new integer field to track which messages have already been processed for summary extraction. This enables batched and incremental extraction.

**New field**:
- `lastSummarizedIndex` (Int, default: -1) — The `orderIndex` of the last message included in the most recent summary extraction. Value of -1 means no extraction has been performed yet.

**How it's used**:
- On each chat message, the system checks: `(currentMessageCount - lastSummarizedIndex) >= 3`
- If true: extract summary using messages with `orderIndex > lastSummarizedIndex`, then update `lastSummarizedIndex` to the current max orderIndex
- If false: skip extraction (will happen on the next batch boundary)
- On explicit "Request Summary": always extract regardless of count, update `lastSummarizedIndex`

### No other schema changes

- No new tables required
- No changes to InterviewMessage, ProcessEntry, or ProjectConfiguration
- The configuration cache is server-side in-memory only (no persistence needed)
- Chat UI changes are purely frontend (no data model impact)
