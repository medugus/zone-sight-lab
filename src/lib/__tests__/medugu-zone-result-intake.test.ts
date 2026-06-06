import { describe, expect, it } from "vitest";
import {
  authenticateZoneResultInboundRequest,
  handleMeduguZoneResultInboundRequest,
  ingestZoneResultPayload,
  MEDUGU_ZONE_RESULT_MAPPED_FIELDS,
  MEDUGU_ZONE_RESULT_PROTECTED_FIELDS,
  type MeduguAccessionState,
  type ZoneResultIntakeStore,
} from "../medugu-zone-result-intake";
import type { ZoneResultEnvelope } from "../schemas/zone-result.schema";

const NOW = "2026-06-06T12:00:00.000Z";
const TOKEN = "reader-intake-token";

function payload(overrides: Partial<ZoneResultEnvelope> = {}): ZoneResultEnvelope {
  return {
    schemaVersion: "1.0.0",
    contractVersion: "1.0.0",
    sourceSystem: "DISKDIFF_READER",
    notForClinicalRelease: true,
    releaseAuthority: "LIS",
    readerDeviceId: "ZR-01",
    readerSoftwareVersion: "Zone Reader v1",
    operator: "tech.alice",
    readAt: "2026-06-06T11:30:00.000Z",
    accessionId: "ACC-2026-000123",
    accessionNumber: "A123456",
    isolateId: "ISO-1",
    astPanelId: "PANEL-EUCAST-URINE-ECO",
    method: "disk_diffusion",
    standard: "EUCAST",
    plateBarcode: "PB-0001",
    imageReference: "zone-reader://images/PB-0001.png",
    results: [
      {
        antibioticCode: "AMP",
        antibioticName: "Ampicillin",
        discPotency: "10 µg",
        diskPosition: "A1",
        zoneDiameterMm: 18,
        readerConfidence: "high",
        measurementSource: "auto_reader",
        manualEdited: false,
        originalValue: null,
        correctedValue: null,
        overrideReason: null,
        reviewStatus: "accepted",
        reviewedBy: "tech.alice",
        reviewedAt: "2026-06-06T11:35:00.000Z",
        comment: "",
      },
    ],
    audit: [],
    ...overrides,
  };
}

function accession(overrides: Partial<MeduguAccessionState> = {}): MeduguAccessionState {
  return {
    accessionId: "ACC-2026-000123",
    accessionNumber: "A123456",
    interpretation: "R",
    phenotype: "ESBL screen negative",
    cascadeReporting: { retained: true },
    selectiveReporting: { retained: true },
    stewardshipOutputs: { advice: "existing advice" },
    ipcOutputs: { alert: false },
    validationState: "pending_validation",
    releaseState: "not_released",
    astRows: [
      {
        id: "ast-row-amp",
        isolateId: "ISO-1",
        astPanelId: "PANEL-EUCAST-URINE-ECO",
        antibioticCode: "AMP",
        method: "disk_diffusion",
        standard: "EUCAST",
        interpretation: "S",
        phenotype: "unchanged row phenotype",
        cascadeReporting: { row: "cascade" },
        selectiveReporting: { row: "selective" },
        stewardshipOutputs: { row: "stewardship" },
        ipcOutputs: { row: "ipc" },
        validationState: "row_pending_validation",
        releaseState: "row_not_released",
      },
    ],
    ...overrides,
  };
}

function store(state = accession()): ZoneResultIntakeStore {
  return { accessions: [state], inboundAudit: [] };
}

function ingest(input: unknown, targetStore = store(), authenticated = true) {
  return ingestZoneResultPayload(input, targetStore, {
    authenticated,
    now: () => NOW,
  });
}

describe("Medugu authenticated ZoneResult inbound boundary", () => {
  it("accepts an authenticated valid upload, stores audit, maps raw fields, and reruns downstream paths", async () => {
    const targetStore = store();
    const request = new Request("https://medugu.local/api/medugu/zone-results", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(payload()),
    });

    expect(authenticateZoneResultInboundRequest(request, TOKEN)).toBe(true);
    const response = await handleMeduguZoneResultInboundRequest(request, targetStore, {
      intakeToken: TOKEN,
      now: () => NOW,
    });

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.mappedRowIds).toEqual(["ast-row-amp"]);
    expect(body.downstreamRuns.map((run: { path: string }) => run.path)).toEqual([
      "ast_interpretation",
      "stewardship",
      "ipc",
      "validation_release_gating",
    ]);

    expect(targetStore.inboundAudit).toHaveLength(1);
    expect(targetStore.inboundAudit[0].rawPayload).toEqual(payload());
    expect(targetStore.inboundAudit[0].parseOutcome).toMatchObject({ status: "valid" });
    expect(targetStore.inboundAudit[0].validationOutcome).toMatchObject({ status: "accepted" });

    const row = targetStore.accessions[0].astRows[0];
    expect(row.rawValue).toBe(18);
    expect(row.rawUnit).toBe("mm");
    expect(row.zoneMm).toBe(18);
    expect(row.method).toBe("disk_diffusion");
    expect(row.measurementProvenance).toMatchObject({
      sourceSystem: "DISKDIFF_READER",
      readerConfidence: "high",
      measurementSource: "auto_reader",
      reviewStatus: "accepted",
    });
    expect(row.lastRawMeasurementAuditId).toBe(targetStore.inboundAudit[0].id);
  });

  it("rejects invalid schema before accession mapping and stores the parse outcome", () => {
    const targetStore = store();
    const invalid = { ...payload(), schemaVersion: "2.0.0", unexpectedField: true };
    const result = ingest(invalid, targetStore);

    expect(result).toMatchObject({ ok: false, status: 422, reason: "invalid_schema" });
    expect(targetStore.inboundAudit).toHaveLength(1);
    expect(targetStore.inboundAudit[0].rawPayload).toEqual(invalid);
    expect(targetStore.inboundAudit[0].parseOutcome.status).toBe("invalid_schema");
    expect(targetStore.accessions[0].astRows[0].rawValue).toBeUndefined();
  });

  it("rejects accession identity mismatch before row writes", () => {
    const targetStore = store(accession({ accessionNumber: "A999999" }));
    const result = ingest(payload(), targetStore);

    expect(result).toMatchObject({ ok: false, status: 409, reason: "accession_mismatch" });
    expect(targetStore.inboundAudit[0].validationOutcome).toMatchObject({
      status: "rejected",
      reason: "accession_mismatch",
    });
    expect(targetStore.accessions[0].astRows[0].rawValue).toBeUndefined();
  });

  it("rejects isolate identity mismatch before row writes", () => {
    const targetStore = store();
    const result = ingest(payload({ isolateId: "ISO-OTHER" }), targetStore);

    expect(result).toMatchObject({ ok: false, status: 409, reason: "isolate_mismatch" });
    expect(targetStore.accessions[0].astRows[0].rawValue).toBeUndefined();
  });

  it("rejects astPanel identity mismatch before row writes", () => {
    const targetStore = store();
    const result = ingest(payload({ astPanelId: "PANEL-OTHER" }), targetStore);

    expect(result).toMatchObject({ ok: false, status: 409, reason: "ast_panel_mismatch" });
    expect(targetStore.accessions[0].astRows[0].rawValue).toBeUndefined();
  });

  it("treats re-importing the same accepted payload as idempotent and does not duplicate rows", () => {
    const targetStore = store();
    const first = ingest(payload(), targetStore);
    const auditIdAfterFirst = targetStore.accessions[0].astRows[0].lastRawMeasurementAuditId;
    const second = ingest(payload(), targetStore);

    expect(first).toMatchObject({ ok: true, idempotent: false });
    expect(second).toMatchObject({ ok: true, idempotent: true });
    expect(targetStore.accessions[0].astRows).toHaveLength(1);
    expect(targetStore.inboundAudit).toHaveLength(2);
    expect(targetStore.accessions[0].astRows[0].lastRawMeasurementAuditId).toBe(auditIdAfterFirst);
  });

  it("only directly changes raw measurement and provenance fields, never protected clinical fields", () => {
    const targetStore = store();
    const beforeAccession = structuredClone(targetStore.accessions[0]);
    const beforeRow = structuredClone(targetStore.accessions[0].astRows[0]);
    const result = ingest(payload(), targetStore);

    expect(result.ok).toBe(true);
    const afterAccession = targetStore.accessions[0];
    const afterRow = afterAccession.astRows[0];

    MEDUGU_ZONE_RESULT_PROTECTED_FIELDS.forEach((field) => {
      expect(afterAccession[field]).toEqual(beforeAccession[field]);
      expect(afterRow[field]).toEqual(beforeRow[field]);
    });

    expect(MEDUGU_ZONE_RESULT_MAPPED_FIELDS).toEqual([
      "rawValue",
      "rawUnit",
      "zoneMm",
      "method",
      "measurementProvenance",
      "lastRawMeasurementAuditId",
    ]);
    expect(afterRow.rawValue).not.toEqual(beforeRow.rawValue);
    expect(afterRow.measurementProvenance).toBeTruthy();
  });

  it("rejects unauthenticated uploads and still stores an inbound audit record", () => {
    const targetStore = store();
    const result = ingest(payload(), targetStore, false);

    expect(result).toMatchObject({ ok: false, status: 401, reason: "unauthenticated" });
    expect(targetStore.inboundAudit).toHaveLength(1);
    expect(targetStore.inboundAudit[0]).toMatchObject({
      authenticated: false,
      parseOutcome: { status: "not_parsed", issues: [] },
      validationOutcome: { status: "rejected", reason: "unauthenticated" },
    });
    expect(targetStore.accessions[0].astRows[0].rawValue).toBeUndefined();
  });
});
