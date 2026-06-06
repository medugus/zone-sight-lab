# Zone Reader — Baseline Receipt (Current)

Date: 2026-06-06
Scope: Inventory-only freeze-baseline pass. No runtime code was changed.

## A. Current file/module map

Workflow routes (`src/routes/`):
- `__root.tsx` — root layout
- `index.tsx` — landing
- `login.tsx`, `access-denied.tsx` — auth gating
- `capture.tsx` — plate/image capture metadata
- `qc-plate.tsx` — plate + image QC checklist
- `qc-strains.tsx` — QC strains screen
- `measure.tsx` — manual zone entry
- `interpret.tsx` — interpretation view (gated by mode)
- `reports.tsx` — draft report + Zone Result JSON export
- `audit.tsx` — audit log view
- `settings.tsx` — settings

Domain modules (`src/lib/`):
- `diskdiff-store.ts` — localStorage-backed workflow store (single source of truth)
- `schemas/lims-worklist.schema.ts` — frozen import contract (Zod)
- `schemas/zone-result.schema.ts` — frozen export contract (Zod)
- `schemas/__fixtures__/worklist.sample.json` — golden LIMS worklist fixture
- `schemas/__tests__/round-trip.test.ts` — import → measure → export round-trip test
- `auth.tsx`, `access-control.ts`, `roles.ts`, `roles.tsx` — auth/RBAC
- `audit/log-audit-event.ts` — audit logging helper
- `mock-data.ts`, `utils.ts`

No `src/routes/api/**` endpoints. No edge/server functions. No network clients.

## B. Current data model summary

`StoreData` (localStorage key `diskdiff_workflow_store_v1`):
- `currentPlate: PlateRecord | null`
- `plateQc: PlateQc | null`
- `measurements: DiskMeasurement[]`
- `discLayout: DiscLayout[]`

`PlateRecord`: id, accessionNumber, patientIdentifier, specimenType,
organismName, organismGroup, organismCode, plateSizeMm (90|150), mediumType,
mediumLot, incubationTemperature, incubationAtmosphere, incubationDurationHours,
inoculumStandard, imageUrl, captureDevice, plateStatus (Draft|QC Complete),
createdAt, createdBy, operatingMode (standalone | medugu_lims_connected |
third_party_lis_connected), interpretationAuthority (measurement_only |
zone_reader_interprets | lis_interprets), worklistId, isolateId,
externalLisAccessionId, externalLisIsolateId, astPanelId, astPanelName,
standard (EUCAST|CLSI|LOCAL), plateBarcode, imageQualityStatus
(acceptable|needs_review|rejected).

`DiscLayout`: id, diskPosition, antibioticCode, antibioticName, discPotency,
discLot, discExpiryDate, expectedOnPlate.

`PlateQc`: 13 checklist booleans + qcComment + qcStatus (Acceptable for
automated reading | Readable with manual review required | Reject image or
repeat plate).

`DiskMeasurement`: id, diskPosition, antimicrobialName, diskContent,
zoneDiameterMm, measurementMethod ("Manual ruler" only), comment,
antibioticCode, antibioticName, discPotency, readerConfidence
(high|medium|low|manual), measurementSource (auto_reader|manual_entry|
reader_then_manual|imported), manualEdited, originalValue, correctedValue,
overrideReason, reviewedBy, reviewedAt, reviewStatus (pending|accepted|
rejected|needs_repeat).

## C. Current schema/fixture/test status

- `LimsWorklistSchema` — frozen at `schemaVersion: "1.0.0"`. Validates
  sourceSystem, worklistId, accessionId/Number, patientDisplayId, isolateId,
  specimenType, organism{Name,Code,Group}, astPanel{Id,Name}, standard
  (EUCAST|CLSI|LOCAL), createdAt (ISO datetime), `expectedDiscs[]` (≥1) with
  antibioticCode/Name/discPotency.
- `ZoneResultEnvelopeSchema` — frozen at `schemaVersion: "1.0.0"`,
  `contractVersion: "1.0.0"`. Enforces `sourceSystem: "DISKDIFF_READER"`,
  `notForClinicalRelease: true`, `releaseAuthority: LIS|LOCAL`,
  `method: "disk_diffusion"`, `results[]` (≥1) of `ZoneMeasurementSchema`,
  and `audit[]` of override records.
- Fixture: `worklist.sample.json` (E. coli urine, 4 discs: AMP, CIP, GEN, TMP-SMX).
- Test: `round-trip.test.ts` — 3 cases (fixture parses; import → measure →
  export validates; manual override populates audit). All 3 passing.

## D. Current export envelope status

`exportZoneResultJson()` in `src/lib/diskdiff-store.ts` builds the envelope and
re-validates it via `ZoneResultEnvelopeSchema.parse(...)` before returning, so
contract drift fails loudly. `validateZoneResultExport()` provides a
pre-export readiness check used by `reports.tsx` (blocks export with a
user-visible warning list if any check fails).

Hardcoded envelope fields:
- `schemaVersion: "1.0.0"`, `contractVersion: "1.0.0"`
- `sourceSystem: "DISKDIFF_READER"`
- `notForClinicalRelease: true`
- `releaseAuthority`: `"LIS"` when plate is LIMS-connected, `"LOCAL"` when standalone
- `method: "disk_diffusion"`, `readerSoftwareVersion: "DiskDiff Reader v1"`
- `audit[]` derived from measurements where `manualEdited === true`

## E. Current offline-only boundary

- Measurement-side app only: confirmed.
- Import/export validated by schema: confirmed (Zod parse on both directions).
- `notForClinicalRelease: true`: confirmed (literal in schema and envelope).
- `releaseAuthority` remains `"LIS"` for LIMS-connected plates (`"LOCAL"` for
  standalone — existing behaviour, not new).
- No live HTTP/API/webhook/device integration: confirmed.
  - No files under `src/routes/api/**`.
  - No `createServerFn`, no `fetch(`, no websocket, no device driver code.
  - All persistence is `localStorage`.

## F. Typecheck/test/build status

- Tests: `bunx vitest run` → 3/3 passing (`round-trip.test.ts`).
- Typecheck/build: handled by the Lovable harness; no manual changes were
  required in this pass.
- No runtime code edited in this pass.

## G. Freeze recommendation: YES

Reasons:
1. Import and export contracts are versioned (`schemaVersion 1.0.0`) and
   enforced by Zod on both sides.
2. Golden fixture + round-trip test cover the happy path and the manual-
   override audit path, and both pass.
3. Offline boundary holds: no server routes, no network code, all state in
   `localStorage`.
4. Clinical-release guardrails are literals in the schema
   (`notForClinicalRelease: true`, `releaseAuthority: LIS|LOCAL`), so they
   cannot silently drift.
5. Export readiness is gated by `validateZoneResultExport()` before the
   envelope is built.

Recommended next step (out of scope for this receipt): offline hardening —
add negative-path tests (reject-QC blocks export; missing overrideReason on
manualEdited; schema drift detection) before any live-integration work.

## Deliverable summary

- Files created: `docs/acceptance/zone-reader-baseline-receipt-current.md`
- Files updated: none
- Runtime code changed: no
- Build ready for offline hardening: yes
