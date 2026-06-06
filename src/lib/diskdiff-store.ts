import { LimsWorklistSchema, type LimsWorklist } from "./schemas/lims-worklist.schema";
import { ZoneResultEnvelopeSchema, type ZoneResultEnvelope } from "./schemas/zone-result.schema";
import {
  formatLimsImportError,
  type FormattedLimsImportError,
} from "./schemas/format-lims-import-error";

export type PlateStatus = "Draft" | "QC Complete";
export type QcStatus =
  | "Acceptable for automated reading"
  | "Readable with manual review required"
  | "Reject image or repeat plate";

export type OperatingMode = "standalone" | "medugu_lims_connected" | "third_party_lis_connected";
export type InterpretationAuthority =
  | "measurement_only"
  | "zone_reader_interprets"
  | "lis_interprets";
export type AstStandard = "EUCAST" | "CLSI" | "LOCAL";
export type ImageQualityStatus = "acceptable" | "needs_review" | "rejected";
export type ReaderConfidence = "high" | "medium" | "low" | "manual";
export type MeasurementSource = "auto_reader" | "manual_entry" | "reader_then_manual" | "imported";
export type ReviewStatus = "pending" | "accepted" | "rejected" | "needs_repeat";
export type NotMeasuredReason =
  | ""
  | "disc_missing"
  | "disc_damaged"
  | "zone_unreadable"
  | "contamination_or_mixed_growth"
  | "other";

export type PlateRecord = {
  id: string;
  accessionNumber: string;
  patientIdentifier: string;
  specimenType: string;
  organismName: string;
  organismGroup: string;
  plateSizeMm: 90 | 150;
  mediumType: string;
  incubationTemperature: string;
  incubationAtmosphere: string;
  incubationDurationHours: string;
  inoculumStandard: string;
  imageUrl: string;
  captureDevice: string;
  plateStatus: PlateStatus;
  createdAt: string;
  operatingMode: OperatingMode;
  interpretationAuthority: InterpretationAuthority;
  worklistId: string;
  isolateId: string;
  externalLisAccessionId: string;
  externalLisIsolateId: string;
  organismCode: string;
  astPanelId: string;
  astPanelName: string;
  standard: AstStandard;
  plateBarcode: string;
  imageQualityStatus: ImageQualityStatus;
  mediumLot: string;
  createdBy: string;
};

export type DiscLayout = {
  id: string;
  diskPosition: string;
  antibioticCode: string;
  antibioticName: string;
  discPotency: string;
  discLot: string;
  discExpiryDate: string;
  expectedOnPlate: boolean;
  notMeasuredReason: NotMeasuredReason;
  notMeasuredComment: string;
};

export type PlateQc = {
  entirePlateVisible: boolean;
  imageNotBlurred: boolean;
  lightingAcceptable: boolean;
  noMajorReflection: boolean;
  agarSurfaceIntact: boolean;
  noExcessMoisture: boolean;
  noObviousContamination: boolean;
  lawnAcceptable: boolean;
  disksVisible: boolean;
  disksNotDisplaced: boolean;
  zonesNotExcessivelyOverlapping: boolean;
  correctMediumSelected: boolean;
  incubationConditionEntered: boolean;
  qcComment: string;
  qcStatus: QcStatus;
};

export type DiskMeasurement = {
  id: string;
  diskPosition: string;
  antimicrobialName: string;
  diskContent: string;
  zoneDiameterMm: number;
  measurementMethod: "Manual ruler";
  comment: string;
  antibioticCode: string;
  antibioticName: string;
  discPotency: string;
  readerConfidence: ReaderConfidence;
  measurementSource: MeasurementSource;
  manualEdited: boolean;
  originalValue: number | null;
  correctedValue: number | null;
  overrideReason: string;
  reviewedBy: string;
  reviewedAt: string;
  reviewStatus: ReviewStatus;
};

export type ImportedWorklistState = LimsWorklist & { importedAt: string };

export type StoreData = {
  currentPlate: PlateRecord | null;
  plateQc: PlateQc | null;
  measurements: DiskMeasurement[];
  discLayout: DiscLayout[];
  importedWorklist: ImportedWorklistState | null;
  exportReviewer: string;
};

const STORAGE_KEY = "diskdiff_workflow_store_v1";

const defaultStore: StoreData = {
  currentPlate: null,
  plateQc: null,
  measurements: [],
  discLayout: [],
  importedWorklist: null,
  exportReviewer: "",
};

function getStore(): StoreData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultStore };
  try {
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      currentPlate: parsed.currentPlate ? hydratePlateRecord(parsed.currentPlate) : null,
      plateQc: parsed.plateQc ?? null,
      measurements: Array.isArray(parsed.measurements)
        ? parsed.measurements.map(hydrateMeasurement)
        : [],
      discLayout: Array.isArray(parsed.discLayout) ? parsed.discLayout.map(hydrateDiscLayout) : [],
      importedWorklist: parsed.importedWorklist
        ? hydrateImportedWorklist(parsed.importedWorklist)
        : null,
      exportReviewer: parsed.exportReviewer ?? "",
    };
  } catch {
    return { ...defaultStore };
  }
}

function saveStore(store: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function hydratePlateRecord(input: Partial<PlateRecord>): PlateRecord {
  return {
    id: input.id ?? crypto.randomUUID(),
    accessionNumber: input.accessionNumber ?? "",
    patientIdentifier: input.patientIdentifier ?? "",
    specimenType: input.specimenType ?? "",
    organismName: input.organismName ?? "",
    organismGroup: input.organismGroup ?? "",
    plateSizeMm: input.plateSizeMm === 150 ? 150 : 90,
    mediumType: input.mediumType ?? "",
    incubationTemperature: input.incubationTemperature ?? "",
    incubationAtmosphere: input.incubationAtmosphere ?? "",
    incubationDurationHours: input.incubationDurationHours ?? "",
    inoculumStandard: input.inoculumStandard ?? "",
    imageUrl: input.imageUrl ?? "",
    captureDevice: input.captureDevice ?? "",
    plateStatus: input.plateStatus ?? "Draft",
    createdAt: input.createdAt ?? new Date().toISOString(),
    operatingMode: input.operatingMode ?? "standalone",
    interpretationAuthority: input.interpretationAuthority ?? "measurement_only",
    worklistId: input.worklistId ?? "",
    isolateId: input.isolateId ?? "",
    externalLisAccessionId: input.externalLisAccessionId ?? "",
    externalLisIsolateId: input.externalLisIsolateId ?? "",
    organismCode: input.organismCode ?? "",
    astPanelId: input.astPanelId ?? "",
    astPanelName: input.astPanelName ?? "",
    standard: input.standard ?? "EUCAST",
    plateBarcode: input.plateBarcode ?? "",
    imageQualityStatus: input.imageQualityStatus ?? "acceptable",
    mediumLot: input.mediumLot ?? "",
    createdBy: input.createdBy ?? "",
  };
}

function hydrateMeasurement(input: Partial<DiskMeasurement>): DiskMeasurement {
  return {
    id: input.id ?? crypto.randomUUID(),
    diskPosition: input.diskPosition ?? "",
    antimicrobialName: input.antimicrobialName ?? "",
    diskContent: input.diskContent ?? "",
    zoneDiameterMm: typeof input.zoneDiameterMm === "number" ? input.zoneDiameterMm : 0,
    measurementMethod: "Manual ruler",
    comment: input.comment ?? "",
    antibioticCode: input.antibioticCode ?? "",
    antibioticName: input.antibioticName ?? input.antimicrobialName ?? "",
    discPotency: input.discPotency ?? input.diskContent ?? "",
    readerConfidence: input.readerConfidence ?? "manual",
    measurementSource: input.measurementSource ?? "manual_entry",
    manualEdited: input.manualEdited ?? false,
    originalValue: input.originalValue ?? null,
    correctedValue: input.correctedValue ?? null,
    overrideReason: input.overrideReason ?? "",
    reviewedBy: input.reviewedBy ?? "",
    reviewedAt: input.reviewedAt ?? "",
    reviewStatus: input.reviewStatus ?? "accepted",
  };
}

function hydrateImportedWorklist(
  input: Partial<ImportedWorklistState>,
): ImportedWorklistState | null {
  const result = LimsWorklistSchema.safeParse(input);
  if (!result.success) return null;
  return { ...result.data, importedAt: input.importedAt ?? new Date().toISOString() };
}

function hydrateDiscLayout(input: Partial<DiscLayout>): DiscLayout {
  return {
    id: input.id ?? crypto.randomUUID(),
    diskPosition: input.diskPosition ?? "",
    antibioticCode: input.antibioticCode ?? "",
    antibioticName: input.antibioticName ?? "",
    discPotency: input.discPotency ?? "",
    discLot: input.discLot ?? "",
    discExpiryDate: input.discExpiryDate ?? "",
    expectedOnPlate: input.expectedOnPlate ?? true,
    notMeasuredReason: input.notMeasuredReason ?? "",
    notMeasuredComment: input.notMeasuredComment ?? "",
  };
}

export function createOrUpdatePlateRecord(
  input: Omit<PlateRecord, "id" | "createdAt" | "plateStatus">,
) {
  const store = getStore();
  const plate = hydratePlateRecord({
    ...store.currentPlate,
    ...input,
    id: store.currentPlate?.id,
    createdAt: store.currentPlate?.createdAt,
    plateStatus: "Draft",
  });
  store.currentPlate = plate;
  saveStore(store);
  return plate;
}

export function savePlateQc(qc: Omit<PlateQc, "qcStatus"> & { qcStatus: QcStatus }) {
  const store = getStore();
  store.plateQc = qc;
  if (store.currentPlate) store.currentPlate.plateStatus = "QC Complete";
  saveStore(store);
  return qc;
}

export function addDiskMeasurement(measurement: Omit<DiskMeasurement, "id">) {
  const store = getStore();
  const hydrated = hydrateMeasurement({ id: crypto.randomUUID(), ...measurement });
  store.measurements.push(hydrated);
  saveStore(store);
  return hydrated;
}

export function listMeasurements() {
  return getStore().measurements;
}

export function getWorkflowState() {
  return getStore();
}

export function saveDiscLayoutItem(
  item: Omit<DiscLayout, "id" | "notMeasuredReason" | "notMeasuredComment"> &
    Partial<Pick<DiscLayout, "notMeasuredReason" | "notMeasuredComment">> & { id?: string },
) {
  const store = getStore();
  const hydrated = hydrateDiscLayout(item);
  const idx = store.discLayout.findIndex((d) => d.id === hydrated.id);
  if (idx >= 0) store.discLayout[idx] = hydrated;
  else store.discLayout.push(hydrated);
  saveStore(store);
  return hydrated;
}

export function listDiscLayout() {
  return getStore().discLayout;
}

export function saveDiscNotMeasuredReason(
  discId: string,
  notMeasuredReason: NotMeasuredReason,
  notMeasuredComment = "",
) {
  const store = getStore();
  const idx = store.discLayout.findIndex((disc) => disc.id === discId);
  if (idx < 0) throw new Error("Disc layout item not found");
  store.discLayout[idx] = hydrateDiscLayout({
    ...store.discLayout[idx],
    notMeasuredReason,
    notMeasuredComment,
  });
  saveStore(store);
  return store.discLayout[idx];
}

export function saveExportReviewer(exportReviewer: string) {
  const store = getStore();
  store.exportReviewer = exportReviewer;
  saveStore(store);
  return exportReviewer;
}

export function importLimsWorklistJson(jsonText: string) {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch (e) {
    throw new LimsImportError(formatLimsImportError(e));
  }
  const result = LimsWorklistSchema.safeParse(raw);
  if (!result.success) {
    throw new LimsImportError(formatLimsImportError(result.error, raw));
  }
  const payload = result.data;
  const store = getStore();
  const importedPlate = hydratePlateRecord({
    ...store.currentPlate,
    id: store.currentPlate?.id,
    createdAt: store.currentPlate?.createdAt,
    plateStatus: store.currentPlate?.plateStatus ?? "Draft",
    externalLisAccessionId: payload.accessionId,
    accessionNumber: payload.accessionNumber,
    patientIdentifier: payload.patientDisplayId,
    isolateId: payload.isolateId,
    externalLisIsolateId: payload.isolateId,
    specimenType: payload.specimenType,
    organismName: payload.organismName,
    organismCode: payload.organismCode,
    organismGroup: payload.organismGroup,
    astPanelId: payload.astPanelId,
    astPanelName: payload.astPanelName,
    standard: payload.standard,
    worklistId: payload.worklistId,
    operatingMode: "medugu_lims_connected",
    interpretationAuthority: "measurement_only",
  });

  const discLayout = payload.expectedDiscs.map((disc, index) =>
    hydrateDiscLayout({
      diskPosition: `A${index + 1}`,
      antibioticCode: disc.antibioticCode,
      antibioticName: disc.antibioticName,
      discPotency: disc.discPotency,
      discLot: "",
      discExpiryDate: "",
      expectedOnPlate: true,
      notMeasuredReason: "",
      notMeasuredComment: "",
    }),
  );

  store.currentPlate = importedPlate;
  store.importedWorklist = { ...payload, importedAt: new Date().toISOString() };
  store.discLayout = discLayout;
  saveStore(store);
  return importedPlate;
}

export class LimsImportError extends Error {
  formatted: FormattedLimsImportError;
  constructor(formatted: FormattedLimsImportError) {
    super(formatted.summary);
    this.name = "LimsImportError";
    this.formatted = formatted;
  }
}

export type ExportReadinessItem = {
  key: string;
  label: string;
  passed: boolean;
  details: string;
};

function isMeasurementForDisc(measurement: DiskMeasurement, disc: DiscLayout) {
  const samePosition = measurement.diskPosition.trim() === disc.diskPosition.trim();
  const sameAntibiotic = measurement.antibioticCode.trim() === disc.antibioticCode.trim();
  return samePosition && sameAntibiotic;
}

function hasValidMeasuredZone(measurement: DiskMeasurement) {
  return (
    typeof measurement.zoneDiameterMm === "number" &&
    !Number.isNaN(measurement.zoneDiameterMm) &&
    measurement.zoneDiameterMm >= 6 &&
    measurement.zoneDiameterMm <= 50
  );
}

export function getExpectedMeasurementPlan() {
  return getStore().discLayout.filter((disc) => disc.expectedOnPlate);
}

export function getExportReadinessChecklist(): ExportReadinessItem[] {
  const { currentPlate, measurements, plateQc, discLayout, exportReviewer } = getStore();
  const expectedDiscs = discLayout.filter((disc) => disc.expectedOnPlate);
  const unresolvedExpectedDiscs = expectedDiscs.filter((disc) => {
    const measured = measurements.some(
      (measurement) => isMeasurementForDisc(measurement, disc) && hasValidMeasuredZone(measurement),
    );
    return !measured && !disc.notMeasuredReason;
  });
  const manualEditIssues = measurements.filter(
    (measurement) =>
      measurement.manualEdited &&
      (measurement.originalValue === null ||
        measurement.correctedValue === null ||
        !measurement.overrideReason.trim() ||
        !measurement.reviewedBy.trim() ||
        !measurement.reviewedAt.trim()),
  );

  return [
    {
      key: "plate",
      label: "Plate record saved",
      passed: Boolean(currentPlate?.id),
      details: currentPlate?.id
        ? `Saved plate ${currentPlate.id}`
        : "Save or import a plate record.",
    },
    {
      key: "qc",
      label: "QC status set",
      passed: Boolean(plateQc?.qcStatus),
      details: plateQc?.qcStatus ?? "Complete plate QC before export.",
    },
    {
      key: "expected-discs",
      label: "Expected discs resolved",
      passed: expectedDiscs.length > 0 && unresolvedExpectedDiscs.length === 0,
      details:
        expectedDiscs.length === 0
          ? "No expected disc measurement plan is present."
          : unresolvedExpectedDiscs.length === 0
            ? `${expectedDiscs.length} expected disc(s) resolved by measurement or notMeasured reason.`
            : `Resolve ${unresolvedExpectedDiscs.length} expected disc(s): ${unresolvedExpectedDiscs
                .map((disc) => disc.diskPosition || disc.antibioticCode)
                .join(", ")}.`,
    },
    {
      key: "operator",
      label: "Operator captured",
      passed: Boolean(currentPlate?.createdBy.trim()),
      details: currentPlate?.createdBy.trim() || "Enter operator/createdBy on the plate record.",
    },
    {
      key: "reviewer",
      label: "Reviewer captured",
      passed: Boolean(exportReviewer.trim()),
      details: exportReviewer.trim() || "Enter the export reviewer before export.",
    },
    {
      key: "measurements",
      label: "Measured zones valid",
      passed: measurements.length > 0 && measurements.every(hasValidMeasuredZone),
      details:
        measurements.length === 0
          ? "At least one measured zone is required by the Zone Result export contract."
          : measurements.every(hasValidMeasuredZone)
            ? `${measurements.length} measured zone(s) are valid.`
            : "One or more measured zones are outside the valid 6-50 mm range.",
    },
    {
      key: "override-audit",
      label: "Manual override audit complete",
      passed: manualEditIssues.length === 0,
      details:
        manualEditIssues.length === 0
          ? "Manual corrections include required audit fields."
          : `Complete audit fields for ${manualEditIssues.length} manual correction(s).`,
    },
  ];
}

export function validateZoneResultExport() {
  const errors = getExportReadinessChecklist()
    .filter((item) => !item.passed)
    .map((item) => `${item.label}: ${item.details}`);
  const { currentPlate, measurements, plateQc } = getStore();

  if (!currentPlate)
    return errors.length > 0 ? errors : ["Plate record saved: Save or import a plate record."];
  if (!currentPlate.accessionNumber.trim()) errors.push("Missing accession number.");
  if (currentPlate.operatingMode !== "standalone" && !currentPlate.isolateId.trim())
    errors.push("LIMS-connected mode requires isolateId.");
  if (currentPlate.operatingMode !== "standalone" && !currentPlate.astPanelId.trim())
    errors.push("LIMS-connected mode requires astPanelId.");
  if (plateQc?.qcStatus === "Reject image or repeat plate")
    errors.push("QC status is Reject image or repeat plate.");

  measurements.forEach((m, i) => {
    if (!m.antibioticCode.trim()) errors.push(`Measurement ${i + 1}: missing antibioticCode.`);
    if (m.manualEdited) {
      if (m.originalValue === null)
        errors.push(`Measurement ${i + 1}: manualEdited requires originalValue.`);
      if (m.correctedValue === null)
        errors.push(`Measurement ${i + 1}: manualEdited requires correctedValue.`);
      if (!m.overrideReason.trim())
        errors.push(`Measurement ${i + 1}: manualEdited requires overrideReason.`);
      if (!m.reviewedBy.trim())
        errors.push(`Measurement ${i + 1}: manualEdited requires reviewedBy.`);
      if (!m.reviewedAt.trim())
        errors.push(`Measurement ${i + 1}: manualEdited requires reviewedAt.`);
    }
  });

  return errors;
}

export function exportZoneResultJson() {
  const readinessIssues = validateZoneResultExport();
  if (readinessIssues.length > 0) {
    throw new Error(`Zone Result export is not ready: ${readinessIssues.join("; ")}`);
  }

  const { currentPlate, measurements, exportReviewer } = getStore();
  if (!currentPlate) throw new Error("No current plate to export");
  const readAt = new Date().toISOString();

  const audit = measurements
    .filter((m) => m.manualEdited)
    .map((m) => ({
      antibioticCode: m.antibioticCode,
      originalValue: m.originalValue,
      correctedValue: m.correctedValue,
      overrideReason: m.overrideReason,
      reviewedBy: m.reviewedBy,
      reviewedAt: m.reviewedAt,
    }));

  const envelope = {
    schemaVersion: "1.0.0" as const,
    contractVersion: "1.0.0",
    sourceSystem: "DISKDIFF_READER" as const,
    notForClinicalRelease: true as const,
    releaseAuthority:
      currentPlate.operatingMode === "standalone" ? ("LOCAL" as const) : ("LIS" as const),
    readerDeviceId: currentPlate.captureDevice,
    readerSoftwareVersion: "DiskDiff Reader v1",
    operator: currentPlate.createdBy,
    readAt,
    accessionId: currentPlate.externalLisAccessionId || currentPlate.accessionNumber,
    accessionNumber: currentPlate.accessionNumber,
    isolateId: currentPlate.isolateId,
    astPanelId: currentPlate.astPanelId,
    method: "disk_diffusion" as const,
    standard: currentPlate.standard,
    plateBarcode: currentPlate.plateBarcode,
    imageReference: currentPlate.imageUrl,
    results: measurements.map((m) => ({
      antibioticCode: m.antibioticCode,
      antibioticName: m.antibioticName || m.antimicrobialName,
      discPotency: m.discPotency || m.diskContent,
      diskPosition: m.diskPosition,
      zoneDiameterMm: m.zoneDiameterMm,
      readerConfidence: m.readerConfidence,
      measurementSource: m.measurementSource,
      manualEdited: m.manualEdited,
      originalValue: m.originalValue,
      correctedValue: m.correctedValue,
      overrideReason: m.overrideReason || null,
      reviewStatus: m.reviewStatus,
      reviewedBy: m.reviewedBy || exportReviewer,
      reviewedAt: m.reviewedAt || readAt,
      comment: m.comment,
    })),
    audit,
  };

  // Validate against frozen schema before returning — fail loudly on contract drift
  return ZoneResultEnvelopeSchema.parse(envelope) satisfies ZoneResultEnvelope;
}

export function generateDraftReportText() {
  const { currentPlate, measurements } = getStore();
  if (!currentPlate) return "Draft: not for clinical release\nNo plate record available.";

  const lines = [
    "Draft: not for clinical release",
    `Accession: ${currentPlate.accessionNumber || "N/A"}`,
    `Specimen: ${currentPlate.specimenType || "N/A"}`,
    `Organism: ${currentPlate.organismName || "Not entered"}`,
    `AST Panel: ${currentPlate.astPanelName || currentPlate.astPanelId || "N/A"}`,
    `Standard: ${currentPlate.standard}`,
    "",
    "Manual zone measurements:",
    ...measurements.map(
      (m) =>
        `${m.diskPosition || "N/A"}: ${m.antibioticCode || "N/A"} ${m.antibioticName || m.antimicrobialName} = ${m.zoneDiameterMm} mm`,
    ),
  ];

  return lines.join("\n");
}
