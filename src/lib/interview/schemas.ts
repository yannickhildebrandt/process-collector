import { z } from "zod";

export const ProcessStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(["task", "decision", "subprocess"]),
  actor: z.string().optional(),
  system: z.string().optional(),
  nextSteps: z.array(z.string()).optional(),
  conditions: z.array(z.object({ condition: z.string(), nextStep: z.string() })).optional(),
});

export const ProcessSummarySchema = z.object({
  processName: z.string(),
  description: z.string().optional(),
  trigger: z
    .object({
      description: z.string(),
      type: z.string().optional(),
    })
    .optional(),
  steps: z.array(ProcessStepSchema),
  roles: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  systems: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  metrics: z
    .array(
      z.object({
        name: z.string(),
        value: z.string().optional(),
      })
    )
    .optional(),
});

export type ProcessSummary = z.infer<typeof ProcessSummarySchema>;
export type ProcessStep = z.infer<typeof ProcessStepSchema>;
