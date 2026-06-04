import { z } from "zod";

export const LIMS_WORKLIST_SCHEMA_VERSION = "1.0.0";

export const ExpectedDiscSchema = z.object({
  antibioticCode: z.string().min(1),
  antibioticName: z.string().min(1),
  discPotency: z.string().min(1),
  plateHint: z.string().optional(),
});

export const LimsWorklistSchema = z.object({
  schemaVersion: z.literal(LIMS_WORKLIST_SCHEMA_VERSION),
  sourceSystem: z.string().min(1),
  worklistId: z.string().min(1),
  accessionId: z.string().min(1),
  accessionNumber: z.string().min(1),
  patientDisplayId: z.string().min(1),
  isolateId: z.string().min(1),
  specimenType: z.string().min(1),
  organismName: z.string().min(1),
  organismCode: z.string().min(1),
  organismGroup: z.string().min(1),
  astPanelId: z.string().min(1),
  astPanelName: z.string().min(1),
  standard: z.enum(["EUCAST", "CLSI", "LOCAL"]),
  expectedDiscs: z.array(ExpectedDiscSchema).min(1),
  createdAt: z.string().datetime(),
});

export type LimsWorklist = z.infer<typeof LimsWorklistSchema>;

export function parseLimsWorklist(input: unknown): LimsWorklist {
  return LimsWorklistSchema.parse(input);
}
