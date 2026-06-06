import { z } from "zod";

export const ZONE_RESULT_SCHEMA_VERSION = "1.0.0";

export const ZoneMeasurementSchema = z.object({
  antibioticCode: z.string().min(1),
  antibioticName: z.string().min(1),
  discPotency: z.string().min(1),
  diskPosition: z.string().min(1),
  zoneDiameterMm: z.number().min(6).max(50),
  readerConfidence: z.enum(["high", "medium", "low", "manual"]),
  measurementSource: z.enum(["auto_reader", "manual_entry", "reader_then_manual", "imported"]),
  manualEdited: z.boolean(),
  originalValue: z.number().nullable(),
  correctedValue: z.number().nullable(),
  overrideReason: z.string().nullable(),
  reviewStatus: z.enum(["pending", "accepted", "rejected", "needs_repeat"]),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  comment: z.string().optional().default(""),
}).strict();

export const ZoneResultEnvelopeSchema = z.object({
  schemaVersion: z.literal(ZONE_RESULT_SCHEMA_VERSION),
  contractVersion: z.string().min(1),
  sourceSystem: z.literal("DISKDIFF_READER"),
  notForClinicalRelease: z.literal(true),
  releaseAuthority: z.enum(["LIS", "LOCAL"]),
  readerDeviceId: z.string(),
  readerSoftwareVersion: z.string().min(1),
  operator: z.string().min(1),
  readAt: z.string().datetime(),
  accessionId: z.string().min(1),
  accessionNumber: z.string().min(1),
  isolateId: z.string(),
  astPanelId: z.string(),
  method: z.literal("disk_diffusion"),
  standard: z.enum(["EUCAST", "CLSI", "LOCAL"]),
  plateBarcode: z.string(),
  imageReference: z.string(),
  results: z.array(ZoneMeasurementSchema).min(1),
  audit: z
    .array(
      z.object({
        antibioticCode: z.string(),
        originalValue: z.number().nullable(),
        correctedValue: z.number().nullable(),
        overrideReason: z.string(),
        reviewedBy: z.string(),
        reviewedAt: z.string(),
      }).strict(),
    )
    .default([]),
}).strict();

export type ZoneResultEnvelope = z.infer<typeof ZoneResultEnvelopeSchema>;

export function parseZoneResult(input: unknown): ZoneResultEnvelope {
  return ZoneResultEnvelopeSchema.parse(input);
}
