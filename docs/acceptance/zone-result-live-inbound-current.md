# ZoneResult live inbound acceptance — current state

## Current acceptance scope

The current Medugu-side live boundary supports a single authenticated inbound JSON upload:

- Endpoint: `POST /api/medugu/zone-results`
- Server route: `src/routes/api/medugu/zone-results.ts`
- Request handler: `handleMeduguZoneResultInboundRequest()`
- Core intake function: `ingestZoneResultPayload()`
- Auth helper: `authenticateZoneResultInboundRequest()`
- Token source: `MEDUGU_ZONE_RESULT_INTAKE_TOKEN`

The endpoint accepts Zone Reader `ZoneResult` JSON only. It does not control devices, verify webhooks, poll, open sockets, run background jobs, or synchronize data back to Zone Reader.

## Accepted payload contract

Payloads must validate against the strict `ZoneResultEnvelopeSchema`:

- `schemaVersion` must be `"1.0.0"`
- `sourceSystem` must be `"DISKDIFF_READER"`
- `notForClinicalRelease` must be `true`
- envelope and row objects reject unknown fields
- at least one result row is required

## Identity checks required before any write

The importer requires all of the following to match Medugu accession state before writing AST measurements:

- `accessionId`
- `accessionNumber`
- `isolateId`
- `astPanelId`

Accepted result rows are then matched to AST rows by `isolateId + astPanelId + antibioticCode + method + standard`.

## Stored audit/inbound artefacts

For every received payload, the importer stores a `ZoneResultInboundAuditRecord` before row mapping. It includes:

- raw inbound payload
- authentication outcome
- parse outcome
- validation outcome
- accepted mapped row IDs or rejection reason/details

Rejected uploads therefore remain auditable even when no AST row is changed. Invalid JSON is rejected with `invalid_json` before schema validation while preserving the raw request body in the audit record.

## Exact inbound fields mapped

For each accepted row, Medugu directly maps only:

- `results[].zoneDiameterMm` to `rawValue`
- constant `"mm"` to `rawUnit`
- `results[].zoneDiameterMm` to `zoneMm`
- envelope `method` to row `method`
- envelope/result provenance into `measurementProvenance`
- audit record ID into `lastRawMeasurementAuditId`

The provenance object stores device, software, operator, read time, image/barcode reference, disk position, antibiotic identity, confidence, source, manual-edit audit values, review status, reviewer, reviewed time, and row comment.

## Exact protected fields

The importer does not directly map inbound data into:

- `interpretation`
- `phenotype`
- `cascadeReporting`
- `selectiveReporting`
- `stewardshipOutputs`
- `ipcOutputs`
- `validationState`
- `releaseState`

## Downstream Medugu ownership

After a successful import, Medugu reruns these synchronous downstream paths from accession state:

- `ast_interpretation`
- `stewardship`
- `ipc`
- `validation_release_gating`

The inbound ZoneResult can trigger recomputation, but it cannot directly set interpretation, stewardship, IPC, validation, or release outputs.

## Test coverage

The refreshed tests cover:

- authenticated valid upload
- invalid schema
- accession mismatch
- isolate mismatch
- astPanel mismatch
- idempotent re-import behaviour
- proof that only raw measurement/provenance fields are directly changed
- unauthenticated upload audit/rejection
- invalid JSON audit/rejection with raw body preservation
