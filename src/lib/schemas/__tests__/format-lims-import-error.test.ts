import { describe, it, expect } from "vitest";
import {
  formatLimsImportError,
  parseLimsWorklistSafe,
} from "../format-lims-import-error";
import { LimsWorklistSchema } from "../lims-worklist.schema";

// A representative "failing Medugu payload" exhibiting all the documented faults:
//  - schemaVersion missing / wrong
//  - wrapped in a "worklist" envelope
//  - createdAt missing
//  - organismGroup null but string required
//  - expectedDiscs[0].discPotency null but string required
const failingMeduguPayload = {
  worklist: {
    worklistId: "WL-1",
    accessionId: "A1",
    accessionNumber: "A1",
    patientDisplayId: "P1",
    isolateId: "I1",
    specimenType: "urine",
    organismName: "Escherichia coli",
    organismCode: "ECO",
    organismGroup: null,
    astPanelId: "P-URN",
    astPanelName: "Urine panel",
    standard: "EUCAST",
    sourceSystem: "MEDUGU_LIMS",
    expectedDiscs: [
      { antibioticCode: "AMP", antibioticName: "Ampicillin", discPotency: null },
    ],
  },
};

describe("formatLimsImportError", () => {
  it("classifies the failing Medugu payload into readable grouped categories", () => {
    const safe = parseLimsWorklistSafe(JSON.stringify(failingMeduguPayload));
    expect(safe.ok).toBe(false);
    if (safe.ok) return;
    const { groups, summary, lines } = safe.error;

    expect(summary).toMatch(/Import rejected:/);
    expect(lines.length).toBeGreaterThan(0);

    // Wrong wrapper shape detected from raw introspection
    expect(groups.wrapper.join("\n")).toMatch(/wrapped in a "worklist"/);

    // Missing required fields surfaced individually
    const missing = groups.missing.join("\n");
    expect(missing).toMatch(/schemaVersion/);
    expect(missing).toMatch(/expectedDiscs/);
    expect(missing).toMatch(/createdAt/);
  });

  it("surfaces schemaVersion mismatch with the expected literal", () => {
    const result = LimsWorklistSchema.safeParse({
      schemaVersion: "9.9.9",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const { groups } = formatLimsImportError(result.error, {
      schemaVersion: "9.9.9",
    });
    expect(groups.schemaVersion.join("\n")).toMatch(/must be exactly "1.0.0"/);
  });

  it("classifies null-where-string as wrong nullability/type, not missing", () => {
    const payload = {
      schemaVersion: "1.0.0",
      sourceSystem: "MEDUGU_LIMS",
      worklistId: "WL-1",
      accessionId: "A1",
      accessionNumber: "A1",
      patientDisplayId: "P1",
      isolateId: "I1",
      specimenType: "urine",
      organismName: "Escherichia coli",
      organismCode: "ECO",
      organismGroup: null,
      astPanelId: "P-URN",
      astPanelName: "Urine panel",
      standard: "EUCAST",
      expectedDiscs: [
        { antibioticCode: "AMP", antibioticName: "Ampicillin", discPotency: null },
      ],
      createdAt: new Date().toISOString(),
    };
    const safe = parseLimsWorklistSafe(JSON.stringify(payload));
    expect(safe.ok).toBe(false);
    if (safe.ok) return;
    const wrong = safe.error.groups.wrongType.join("\n");
    expect(wrong).toMatch(/organismGroup is null/);
    expect(wrong).toMatch(/expectedDiscs\[0\]\.discPotency is null/);
    // And these must NOT be reported as missing
    expect(safe.error.groups.missing.join("\n")).not.toMatch(/organismGroup/);
  });

  it("flags unknown root-level fields as wrong field names", () => {
    const safe = parseLimsWorklistSafe(
      JSON.stringify({ schemaVersion: "1.0.0", totallyBogusField: 42 }),
    );
    expect(safe.ok).toBe(false);
    if (safe.ok) return;
    expect(safe.error.groups.unknownFields.join("\n")).toMatch(
      /Unrecognised field "totallyBogusField"/,
    );
  });

  it("reports invalid JSON as a wrapper-level error, not a schema error", () => {
    const safe = parseLimsWorklistSafe("{not json");
    expect(safe.ok).toBe(false);
    if (safe.ok) return;
    expect(safe.error.groups.wrapper.join("\n")).toMatch(/not valid JSON/);
  });
});