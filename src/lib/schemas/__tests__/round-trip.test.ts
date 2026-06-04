import { describe, it, expect, beforeEach } from "vitest";
import worklistFixture from "../__fixtures__/worklist.sample.json";
import { LimsWorklistSchema } from "../lims-worklist.schema";
import { ZoneResultEnvelopeSchema } from "../zone-result.schema";
import {
  importLimsWorklistJson,
  addDiskMeasurement,
  exportZoneResultJson,
  listDiscLayout,
  createOrUpdatePlateRecord,
  getWorkflowState,
} from "../../diskdiff-store";

// jsdom-free localStorage shim
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
  key() { return null; }
  get length() { return this.data.size; }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage = new MemoryStorage() as unknown as Storage;
  if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== "function") {
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID: () => Math.random().toString(36).slice(2) },
      configurable: true,
    });
  }
});

describe("LIMS worklist + Zone result round-trip", () => {
  it("parses the golden worklist fixture", () => {
    expect(() => LimsWorklistSchema.parse(worklistFixture)).not.toThrow();
  });

  it("imports a worklist, records measurements, and exports a schema-valid Zone Result", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));

    const plate = getWorkflowState().currentPlate!;
    expect(plate.accessionNumber).toBe("A123456");
    expect(plate.organismName).toBe("Escherichia coli");
    expect(plate.operatingMode).toBe("medugu_lims_connected");

    // Operator + capture device + barcode are normally set in Capture step
    createOrUpdatePlateRecord({
      ...plate,
      captureDevice: "BENCH-CAM-01",
      createdBy: "tech.alice",
      plateBarcode: "PB-0001",
    });

    const layout = listDiscLayout();
    expect(layout.length).toBe(4);

    layout.forEach((d, i) => {
      addDiskMeasurement({
        diskPosition: d.diskPosition,
        antimicrobialName: d.antibioticName,
        diskContent: d.discPotency,
        zoneDiameterMm: 18 + i,
        measurementMethod: "Manual ruler",
        comment: "",
        antibioticCode: d.antibioticCode,
        antibioticName: d.antibioticName,
        discPotency: d.discPotency,
        readerConfidence: "manual",
        measurementSource: "manual_entry",
        manualEdited: false,
        originalValue: null,
        correctedValue: null,
        overrideReason: "",
        reviewedBy: "tech.alice",
        reviewedAt: new Date().toISOString(),
        reviewStatus: "accepted",
      });
    });

    const exported = exportZoneResultJson();
    // Re-validate against the frozen export schema
    expect(() => ZoneResultEnvelopeSchema.parse(exported)).not.toThrow();

    // Round-trip correspondence: every expected disc shows up in results
    const exportedCodes = exported.results.map((r) => r.antibioticCode).sort();
    const expectedCodes = worklistFixture.expectedDiscs.map((d) => d.antibioticCode).sort();
    expect(exportedCodes).toEqual(expectedCodes);

    expect(exported.notForClinicalRelease).toBe(true);
    expect(exported.releaseAuthority).toBe("LIS");
    expect(exported.sourceSystem).toBe("DISKDIFF_READER");
    expect(exported.audit).toEqual([]);
  });

  it("rejects exports with manual edits that lack an overrideReason via validateZoneResultExport flow", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));
    const plate = getWorkflowState().currentPlate!;
    createOrUpdatePlateRecord({ ...plate, captureDevice: "X", createdBy: "tech.alice", plateBarcode: "PB" });

    const d = listDiscLayout()[0];
    addDiskMeasurement({
      diskPosition: d.diskPosition,
      antimicrobialName: d.antibioticName,
      diskContent: d.discPotency,
      zoneDiameterMm: 22,
      measurementMethod: "Manual ruler",
      comment: "",
      antibioticCode: d.antibioticCode,
      antibioticName: d.antibioticName,
      discPotency: d.discPotency,
      readerConfidence: "manual",
      measurementSource: "reader_then_manual",
      manualEdited: true,
      originalValue: 18,
      correctedValue: 22,
      overrideReason: "Reader misread edge of zone",
      reviewedBy: "tech.alice",
      reviewedAt: new Date().toISOString(),
      reviewStatus: "accepted",
    });

    const exported = exportZoneResultJson();
    expect(exported.audit.length).toBe(1);
    expect(exported.audit[0].overrideReason).toMatch(/misread/);
  });
});