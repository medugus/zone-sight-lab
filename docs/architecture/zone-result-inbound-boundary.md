# ZoneResult inbound boundary (Medugu-owned)

## Scope

This boundary is the first intentionally boring live integration point for Zone Reader results coming into Medugu. It is inbound-only and request/response-only:

- no polling
- no sockets
- no bidirectional sync
- no webhook verification flow
- no device control
- no background jobs

Zone Reader remains a measurement source. Medugu remains the owner of interpretation, stewardship, IPC, validation, and release.

## Server intake path

- HTTP path: `POST /api/medugu/zone-results`
- Route file: `src/routes/api/medugu/zone-results.ts`
- Handler function: `handleMeduguZoneResultInboundRequest()`
- Core import function: `ingestZoneResultPayload()`
- Authentication helper: `authenticateZoneResultInboundRequest()`
- Required credential: `Authorization: Bearer <MEDUGU_ZONE_RESULT_INTAKE_TOKEN>`

The route is a TanStack Start server route. The handler accepts a single JSON request, processes it synchronously, and returns the accepted/rejected intake outcome. It does not subscribe, poll, enqueue background work, verify webhooks, or call back to Zone Reader.

## Schema contract

Incoming payloads are validated with `ZoneResultEnvelopeSchema` at `schemaVersion: "1.0.0"`. The envelope, measurement rows, and audit rows are strict Zod objects; unknown fields are rejected rather than silently accepted.

Required envelope guardrails include:

- `sourceSystem: "DISKDIFF_READER"`
- `notForClinicalRelease: true`
- `method: "disk_diffusion"`
- `standard: "EUCAST" | "CLSI" | "LOCAL"`
- at least one result row

## Identity gates before writes

Medugu does not write any AST measurements until all identity checks pass:

1. `accessionId` must resolve to an existing Medugu accession.
2. `accessionNumber` must match the Medugu accession.
3. `isolateId` must match rows on that accession.
4. `astPanelId` must match rows for that isolate.
5. Each accepted row must match an AST row by:
   - `isolateId`
   - `astPanelId`
   - `antibioticCode`
   - `method`
   - `standard`

Only result rows with `reviewStatus: "accepted"` are mapped.

## Audit/inbound artefacts

Every received payload creates a `ZoneResultInboundAuditRecord` before clinical mapping is attempted. The audit record stores:

- `id`
- `receivedAt`
- `authenticated`
- `rawPayload` (parsed JSON for valid JSON bodies, or the raw request body string when JSON parsing fails)
- `parseOutcome`
  - `not_parsed`
  - `valid`
  - `invalid_json`
  - `invalid_schema`
- `validationOutcome`
  - `not_validated`
  - `accepted`
  - `rejected`

This preserves raw inbound content and the parse/validation outcome for both accepted and rejected submissions.

## Fields directly mapped into Medugu AST rows

Accepted rows may directly change only raw measurement/provenance fields:

- `rawValue` = Zone Reader `zoneDiameterMm`
- `rawUnit` = `"mm"`
- `zoneMm` = Zone Reader `zoneDiameterMm`
- `method` = ZoneResult envelope `method`
- `measurementProvenance`
  - `sourceSystem`
  - `inboundAuditId`
  - `readerDeviceId`
  - `readerSoftwareVersion`
  - `operator`
  - `readAt`
  - `plateBarcode`
  - `imageReference`
  - `diskPosition`
  - `antibioticName`
  - `discPotency`
  - `readerConfidence`
  - `measurementSource`
  - `manualEdited`
  - `originalValue`
  - `correctedValue`
  - `overrideReason`
  - `reviewStatus`
  - `reviewedBy`
  - `reviewedAt`
  - `comment`
- `lastRawMeasurementAuditId`

## Protected fields

Inbound ZoneResult data must not directly set or alter:

- interpreted S/I/R (`interpretation`)
- `phenotype`
- `cascadeReporting`
- `selectiveReporting`
- `stewardshipOutputs`
- `ipcOutputs`
- `validationState`
- `releaseState`

These fields are deliberately excluded from the mapping list and covered by tests.

## Downstream Medugu-owned recomputation

After a successful accepted import, Medugu immediately records synchronous reruns of the downstream paths from accession state:

1. `ast_interpretation`
2. `stewardship`
3. `ipc`
4. `validation_release_gating`

These are Medugu-owned paths represented by `rerunMeduguDownstreamLogic()`. The inbound request cannot set their output fields directly.

## Idempotency

Re-importing the same accepted measurements for the same accession/isolate/panel/row set is accepted and marked idempotent. It stores a new inbound audit record but does not duplicate AST rows or rewrite already-equivalent raw measurement/provenance content.
