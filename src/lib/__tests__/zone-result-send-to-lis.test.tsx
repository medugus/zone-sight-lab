import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsPage } from "@/routes/reports";
import {
  addDiskMeasurement,
  createOrUpdatePlateRecord,
  getWorkflowState,
  importLimsWorklistJson,
  listDiscLayout,
  saveDiscNotMeasuredReason,
  saveExportReviewer,
  savePlateQc,
} from "@/lib/diskdiff-store";
import {
  sendCurrentZoneResultToLis,
  sendValidatedZoneResultEnvelope,
} from "@/lib/zone-result-send-to-lis";
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

function prepareReadyZoneResult() {
  importLimsWorklistJson(JSON.stringify(worklistFixture));
  const plate = getWorkflowState().currentPlate!;
  createOrUpdatePlateRecord({
    ...plate,
    captureDevice: "BENCH-CAM-01",
    createdBy: "tech.alice",
    plateBarcode: "PB-0001",
  });
  savePassingQc();
  saveExportReviewer("dr.reviewer");

  const [firstDisc, ...remainingDiscs] = listDiscLayout();
  addDiskMeasurement({
    diskPosition: firstDisc.diskPosition,
    antimicrobialName: firstDisc.antibioticName,
    diskContent: firstDisc.discPotency,
    zoneDiameterMm: 18,
    measurementMethod: "Manual ruler",
    comment: "",
    antibioticCode: firstDisc.antibioticCode,
    antibioticName: firstDisc.antibioticName,
    discPotency: firstDisc.discPotency,
    readerConfidence: "manual",
    measurementSource: "manual_entry",
    manualEdited: false,
    originalValue: null,
    correctedValue: null,
    overrideReason: "",
    reviewedBy: "",
    reviewedAt: "",
    reviewStatus: "accepted",
  });
  remainingDiscs.forEach((disc) =>
    saveDiscNotMeasuredReason(disc.id, "zone_unreadable", "No readable edge"),
  );
}

describe("Zone Result Send to LIS action", () => {
  it("sends the existing schema-valid ZoneResult envelope with bearer authentication", async () => {
    prepareReadyZoneResult();
    const fetchImpl = vi.fn(async () =>
      Response.json(
        { ok: true, auditId: "audit-123", mappedRowIds: ["row-1"], idempotent: false },
        { status: 202 },
      ),
    );

    const result = await sendCurrentZoneResultToLis({
      endpoint: "/api/medugu/zone-results",
      bearerToken: "secret-token",
      fetchImpl,
    });

    expect(result.state).toBe("sent");
    expect(result.message).toContain("Sent successfully");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [endpoint, init] = fetchImpl.mock.calls[0];
    expect(endpoint).toBe("/api/medugu/zone-results");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer secret-token",
    });
    const payload = JSON.parse(String(init?.body));
    if (result.state !== "sent") throw new Error("expected sent state");
    expect(payload).toEqual(result.payload);
    expect(payload.notForClinicalRelease).toBe(true);
    expect(payload.releaseAuthority).toBe("LIS");
  });

  it("shows an auth failure as a readable failed state", async () => {
    prepareReadyZoneResult();
    const fetchImpl = vi.fn(async () =>
      Response.json(
        { ok: false, reason: "unauthenticated", details: ["Missing or invalid bearer token."] },
        { status: 401 },
      ),
    );

    const result = await sendCurrentZoneResultToLis({
      bearerToken: "bad-token",
      fetchImpl,
    });

    expect(result).toMatchObject({ state: "failed", status: 401, reason: "unauthenticated" });
    expect(result.message).toContain("Missing or invalid bearer token");
  });

  it("fails schema validation before send and does not call the network", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ ok: true }, { status: 202 }));

    const result = await sendValidatedZoneResultEnvelope(
      { schemaVersion: "1.0.0", notForClinicalRelease: true, releaseAuthority: "LIS" },
      { bearerToken: "secret-token", fetchImpl },
    );

    expect(result.state).toBe("failed");
    expect(result.reason).toBe("schema_validation_failed");
    expect(result.message).toContain("failed schema validation before send");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("shows a readable failed state for network/request failures", async () => {
    prepareReadyZoneResult();
    const fetchImpl = vi.fn(async () => {
      throw new Error("Network unreachable");
    });

    const result = await sendCurrentZoneResultToLis({
      bearerToken: "secret-token",
      fetchImpl,
    });

    expect(result).toMatchObject({ state: "failed", reason: "request_failed" });
    expect(result.message).toContain("Network unreachable");
  });

  it("keeps manual JSON export visible as a fallback", () => {
    const html = renderToStaticMarkup(<ReportsPage />);

    expect(html).toContain("Send to LIS");
    expect(html).toContain("Export Zone Result JSON");
    expect(html).toContain("Exported JSON output appears here");
  });
});
