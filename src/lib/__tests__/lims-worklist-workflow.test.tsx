import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { ImportedWorklistSummaryCard } from "@/components/imported-worklist-summary-card";
import { InterpretationAuthorityNotice } from "@/components/interpretation-authority-notice";
import {
  addDiskMeasurement,
  createOrUpdatePlateRecord,
  deleteDiskMeasurement,
  DuplicateMeasurementError,
  exportZoneResultJson,
  getWorkflowState,
  importLimsWorklistJson,
  listDiscLayout,
  saveDiscNotMeasuredReason,
  saveExportReviewer,
  savePlateQc,
  updateDiskMeasurement,
  validateZoneResultExport,
} from "@/lib/diskdiff-store";
import worklistFixture from "../schemas/__fixtures__/worklist.sample.json";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
  key() {
    return null;
  }
  get length() {
    return this.data.size;
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage =
    new MemoryStorage() as unknown as Storage;
  if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== "function") {
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID: () => Math.random().toString(36).slice(2) },
      configurable: true,
    });
  }
});

describe("LIMS worklist workflow wiring", () => {
  it("successful import hydrates local worklist state", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));

    const state = getWorkflowState();
    expect(state.importedWorklist?.worklistId).toBe(worklistFixture.worklistId);
    expect(state.importedWorklist?.accessionNumber).toBe(worklistFixture.accessionNumber);
    expect(state.importedWorklist?.expectedDiscs).toEqual(worklistFixture.expectedDiscs);
    expect(state.importedWorklist?.importedAt).toEqual(expect.any(String));
  });

  it("successful import prefills plate workflow fields without granting Zone Reader interpretation authority", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));

    const plate = getWorkflowState().currentPlate;
    expect(plate).toMatchObject({
      accessionNumber: worklistFixture.accessionNumber,
      patientIdentifier: worklistFixture.patientDisplayId,
      specimenType: worklistFixture.specimenType,
      organismName: worklistFixture.organismName,
      organismCode: worklistFixture.organismCode,
      astPanelId: worklistFixture.astPanelId,
      astPanelName: worklistFixture.astPanelName,
      standard: worklistFixture.standard,
      worklistId: worklistFixture.worklistId,
      operatingMode: "medugu_lims_connected",
      interpretationAuthority: "measurement_only",
    });
    expect(plate).not.toHaveProperty("patientDisplayId");
  });

  it("expectedDiscs initialise the active measurement plan", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));

    const layout = listDiscLayout();
    expect(layout).toHaveLength(worklistFixture.expectedDiscs.length);
    expect(
      layout.map(({ antibioticCode, antibioticName, discPotency, expectedOnPlate }) => ({
        antibioticCode,
        antibioticName,
        discPotency,
        expectedOnPlate,
      })),
    ).toEqual(
      worklistFixture.expectedDiscs.map((disc) => ({
        antibioticCode: disc.antibioticCode,
        antibioticName: disc.antibioticName,
        discPotency: disc.discPotency,
        expectedOnPlate: true,
      })),
    );
    expect(layout.map((disc) => disc.diskPosition)).toEqual(["A1", "A2", "A3", "A4"]);
  });

  it("imported worklist summary renders correctly", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));

    const html = renderToStaticMarkup(
      <ImportedWorklistSummaryCard workflow={getWorkflowState()} />,
    );
    expect(html).toContain("Imported worklist summary");
    expect(html).toContain(worklistFixture.accessionNumber);
    expect(html).toContain(worklistFixture.specimenType);
    expect(html).toContain(worklistFixture.organismName);
    expect(html).toContain(worklistFixture.standard);
    expect(html).toContain(String(worklistFixture.expectedDiscs.length));
  });
});

function savePassingQc() {
  savePlateQc({
    entirePlateVisible: true,
    imageNotBlurred: true,
    lightingAcceptable: true,
    noMajorReflection: true,
    agarSurfaceIntact: true,
    noExcessMoisture: true,
    noObviousContamination: true,
    lawnAcceptable: true,
    disksVisible: true,
    disksNotDisplaced: true,
    zonesNotExcessivelyOverlapping: true,
    correctMediumSelected: true,
    incubationConditionEntered: true,
    qcComment: "",
    qcStatus: "Acceptable for automated reading",
  });
}

function completePlateAndReview() {
  const plate = getWorkflowState().currentPlate!;
  createOrUpdatePlateRecord({
    ...plate,
    captureDevice: "BENCH-CAM-01",
    createdBy: "tech.alice",
    plateBarcode: "PB-0001",
  });
  savePassingQc();
  saveExportReviewer("dr.reviewer");
}

function addMeasurementForDisc(index = 0, manualEdited = false) {
  const disc = listDiscLayout()[index];
  addDiskMeasurement({
    diskPosition: disc.diskPosition,
    antimicrobialName: disc.antibioticName,
    diskContent: disc.discPotency,
    zoneDiameterMm: manualEdited ? 22 : 18,
    measurementMethod: "Manual ruler",
    comment: "",
    antibioticCode: disc.antibioticCode,
    antibioticName: disc.antibioticName,
    discPotency: disc.discPotency,
    readerConfidence: "manual",
    measurementSource: manualEdited ? "reader_then_manual" : "manual_entry",
    manualEdited,
    originalValue: manualEdited ? 18 : null,
    correctedValue: manualEdited ? 22 : null,
    overrideReason: manualEdited ? "Corrected visible zone edge" : "",
    reviewedBy: manualEdited ? "dr.reviewer" : "",
    reviewedAt: manualEdited ? "2026-06-06T10:00:00.000Z" : "",
    reviewStatus: "accepted",
  });
}

function markRemainingDiscsNotMeasured(startIndex = 1) {
  listDiscLayout()
    .slice(startIndex)
    .forEach((disc) => saveDiscNotMeasuredReason(disc.id, "zone_unreadable", "No readable edge"));
}

describe("Measurement row correction and deletion", () => {
  it("deletes one selected measurement row without removing the imported measurement plan", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));
    addMeasurementForDisc(0);
    addMeasurementForDisc(1);

    const stateBeforeDelete = getWorkflowState();
    const firstMeasurementId = stateBeforeDelete.measurements[0].id;
    const secondMeasurement = stateBeforeDelete.measurements[1];
    const planBeforeDelete = stateBeforeDelete.discLayout.map((disc) => ({ ...disc }));

    expect(deleteDiskMeasurement(firstMeasurementId)).toBe(true);

    const stateAfterDelete = getWorkflowState();
    expect(stateAfterDelete.measurements).toHaveLength(1);
    expect(stateAfterDelete.measurements[0]).toMatchObject({
      id: secondMeasurement.id,
      diskPosition: secondMeasurement.diskPosition,
      antibioticCode: secondMeasurement.antibioticCode,
    });
    expect(stateAfterDelete.discLayout).toEqual(planBeforeDelete);
  });

  it("edits one selected measurement row and persists override audit fields", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));
    addMeasurementForDisc(0);
    addMeasurementForDisc(1);

    const firstMeasurement = getWorkflowState().measurements[0];
    const secondMeasurement = getWorkflowState().measurements[1];
    const edited = updateDiskMeasurement(firstMeasurement.id, {
      zoneDiameterMm: 21,
      comment: "Corrected after review",
      readerConfidence: "high",
      reviewStatus: "accepted",
      overrideReason: "Zone edge corrected from saved row",
      reviewedBy: "dr.reviewer",
      reviewedAt: "2026-06-06T12:00:00.000Z",
    });

    expect(edited).toMatchObject({
      id: firstMeasurement.id,
      zoneDiameterMm: 21,
      comment: "Corrected after review",
      readerConfidence: "high",
      reviewStatus: "accepted",
      manualEdited: true,
      originalValue: 18,
      correctedValue: 21,
      overrideReason: "Zone edge corrected from saved row",
      reviewedBy: "dr.reviewer",
      reviewedAt: "2026-06-06T12:00:00.000Z",
    });
    expect(getWorkflowState().measurements).toHaveLength(2);
    expect(getWorkflowState().measurements[1]).toMatchObject({ id: secondMeasurement.id });
  });

  it("blocks a duplicate measurement attempt for the same diskPosition and antibioticCode", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));
    addMeasurementForDisc(0);
    const disc = listDiscLayout()[0];

    expect(() =>
      addDiskMeasurement({
        diskPosition: disc.diskPosition,
        antimicrobialName: disc.antibioticName,
        diskContent: disc.discPotency,
        zoneDiameterMm: 24,
        measurementMethod: "Manual ruler",
        comment: "Duplicate attempt",
        antibioticCode: disc.antibioticCode,
        antibioticName: disc.antibioticName,
        discPotency: disc.discPotency,
        readerConfidence: "manual",
        measurementSource: "manual_entry",
        manualEdited: false,
        originalValue: null,
        correctedValue: null,
        overrideReason: "",
        reviewedBy: "",
        reviewedAt: "",
        reviewStatus: "accepted",
      }),
    ).toThrow(DuplicateMeasurementError);
    expect(getWorkflowState().measurements).toHaveLength(1);
    expect(getWorkflowState().measurements[0]).toMatchObject({ zoneDiameterMm: 18 });
  });

  it("replace-existing duplicate flow preserves only one final measurement row", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));
    addMeasurementForDisc(0);
    const disc = listDiscLayout()[0];

    const replacement = addDiskMeasurement(
      {
        diskPosition: disc.diskPosition,
        antimicrobialName: disc.antibioticName,
        diskContent: disc.discPotency,
        zoneDiameterMm: 24,
        measurementMethod: "Manual ruler",
        comment: "Replacement value",
        antibioticCode: disc.antibioticCode,
        antibioticName: disc.antibioticName,
        discPotency: disc.discPotency,
        readerConfidence: "high",
        measurementSource: "manual_entry",
        manualEdited: false,
        originalValue: null,
        correctedValue: null,
        overrideReason: "",
        reviewedBy: "",
        reviewedAt: "",
        reviewStatus: "accepted",
      },
      { replaceExisting: true },
    );

    const measurements = getWorkflowState().measurements;
    expect(measurements).toHaveLength(1);
    expect(measurements[0]).toMatchObject({
      id: replacement.id,
      diskPosition: disc.diskPosition,
      antibioticCode: disc.antibioticCode,
      zoneDiameterMm: 24,
      comment: "Replacement value",
    });
  });
});

describe("Zone Result export readiness hardening", () => {
  it("blocks export when a required expected disc has neither measurement nor notMeasured reason", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));
    completePlateAndReview();
    addMeasurementForDisc(0);

    const issues = validateZoneResultExport();
    expect(issues.join("\n")).toMatch(/Expected discs resolved/);
    expect(() => exportZoneResultJson()).toThrow(/not ready/);
  });

  it("blocks export when operator or reviewer is missing", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));
    const plate = getWorkflowState().currentPlate!;
    createOrUpdatePlateRecord({ ...plate, createdBy: "", captureDevice: "BENCH-CAM-01" });
    savePassingQc();
    addMeasurementForDisc(0);
    markRemainingDiscsNotMeasured();

    expect(validateZoneResultExport().join("\n")).toMatch(/Operator captured|Reviewer captured/);

    createOrUpdatePlateRecord({ ...getWorkflowState().currentPlate!, createdBy: "tech.alice" });
    expect(validateZoneResultExport().join("\n")).toMatch(/Reviewer captured/);
  });

  it("allows export when all expected discs are resolved and required fields are present", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));
    completePlateAndReview();
    addMeasurementForDisc(0);
    markRemainingDiscsNotMeasured();

    expect(validateZoneResultExport()).toEqual([]);
    const exported = exportZoneResultJson();
    expect(exported.notForClinicalRelease).toBe(true);
    expect(exported.releaseAuthority).toBe("LIS");
    expect(exported.operator).toBe("tech.alice");
    expect(exported.results).toHaveLength(1);
    expect(exported.results[0].reviewedBy).toBe("dr.reviewer");
  });

  it("persists override audit fields on manual edits", () => {
    importLimsWorklistJson(JSON.stringify(worklistFixture));
    completePlateAndReview();
    addMeasurementForDisc(0, true);
    markRemainingDiscsNotMeasured();

    const measurement = getWorkflowState().measurements[0];
    expect(measurement).toMatchObject({
      manualEdited: true,
      originalValue: 18,
      correctedValue: 22,
      overrideReason: "Corrected visible zone edge",
      reviewedBy: "dr.reviewer",
      reviewedAt: "2026-06-06T10:00:00.000Z",
    });

    const exported = exportZoneResultJson();
    expect(exported.audit).toEqual([
      {
        antibioticCode: measurement.antibioticCode,
        originalValue: 18,
        correctedValue: 22,
        overrideReason: "Corrected visible zone edge",
        reviewedBy: "dr.reviewer",
        reviewedAt: "2026-06-06T10:00:00.000Z",
      },
    ]);
  });

  it("hides S/I/R editing UI in LIS-connected measurement_only mode", () => {
    const html = renderToStaticMarkup(
      <InterpretationAuthorityNotice
        operatingMode="medugu_lims_connected"
        interpretationAuthority="measurement_only"
      />,
    );

    expect(html).toContain("S/I/R verdict editing");
    expect(html).toContain("disabled");
    expect(html).not.toContain("Edit S/I/R verdict");
  });
});
