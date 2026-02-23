# Data Model: Interview Enhancements

## Existing Entities (no schema changes)

### InterviewSession

No schema changes. Behavioral changes only:
- On creation (POST /interviews), generate a contextual AI greeting and persist it as the first `InterviewMessage` (role: ASSISTANT, orderIndex: 0).
- The `currentSummaryJson` field (already JSON) is used to regenerate BPMN XML client-side on every update.

### InterviewMessage

No schema changes. The auto-greeting is stored as a regular message:
- `role`: ASSISTANT
- `content`: AI-generated greeting referencing title, category, industry
- `orderIndex`: 0

### ProjectConfiguration

No schema changes. The existing schema supports all fields the config chat needs to extract:
- `industryClassification` (JSON): `{ sector: string, subSector?: string }`
- `processCategories` (JSON): `Array<{ key: string, labelDe: string, labelEn: string }>`
- `customTerminology` (JSON, optional): `Record<string, { de: string, en: string }>`
- `interviewTemplateRefs` (JSON, optional): `string[]`
- `version` (Int): Optimistic concurrency control

### ProcessSummary (Zod schema, not DB entity)

Already fixed — `conditions` field changed from `z.record()` to `z.array(z.object({ condition, nextStep }))` to avoid Anthropic schema rejection.

## New Runtime Types (not persisted)

### ConfigChatState (client-side only)

Ephemeral state for the consultant configuration chat. Not stored in DB.

```
ConfigChatState {
  messages: ChatMessage[]           // In-memory conversation history
  extractedConfig: ProjectConfigurationData | null  // Latest extracted config
  isExtracting: boolean             // Whether extraction is in progress
}
```

### ProjectConfigurationSchema (Zod)

New Zod schema mirroring `ProjectConfigurationData` from `src/lib/validators/config-schema.ts`, used for `generateObject` extraction. Must avoid `z.record()` (use arrays instead).

```
ProjectConfigurationSchema = z.object({
  industryClassification: z.object({
    sector: z.string(),
    subSector: z.string().optional()
  }),
  processCategories: z.array(z.object({
    key: z.string(),
    labelDe: z.string(),
    labelEn: z.string()
  })),
  customTerminology: z.array(z.object({
    term: z.string(),
    de: z.string(),
    en: z.string()
  })).optional(),
  interviewTemplateRefs: z.array(z.string()).optional()
})
```

Note: `customTerminology` uses an array-of-objects format for Anthropic compatibility. Must be converted to/from the record format when saving to ProjectConfiguration.

## Validation Rules

- Config extraction output is validated against the existing `validateConfiguration()` from `src/lib/validators/config-schema.ts` before saving.
- The config version must be checked for optimistic concurrency (existing pattern in PATCH /configuration endpoint).
- ProcessSummary must produce valid BPMN XML via `generateBpmnXml()` for any number of steps (0+).
