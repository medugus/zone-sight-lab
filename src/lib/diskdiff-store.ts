export type PlateStatus = "Draft" | "QC Complete";
export type QcStatus =
  | "Acceptable for automated reading"
  | "Readable with manual review required"
  | "Reject image or repeat plate";

export type OperatingMode = "standalone" | "medugu_lims_connected" | "third_party_lis_connected";
export type InterpretationAuthority = "measurement_only" | "zone_reader_interprets" | "lis_interprets";
export type AstStandard = "EUCAST" | "CLSI" | "LOCAL";
export type ImageQualityStatus = "acceptable" | "needs_review" | "rejected";
export type ReaderConfidence = "high" | "medium" | "low" | "manual";
export type MeasurementSource = "auto_reader" | "manual_entry" | "reader_then_manual" | "imported";
export type ReviewStatus = "pending" | "accepted" | "rejected" | "needs_repeat";

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

export type StoreData = {
  currentPlate: PlateRecord | null;
  plateQc: PlateQc | null;
  measurements: DiskMeasurement[];
  discLayout: DiscLayout[];
};

const STORAGE_KEY = "diskdiff_workflow_store_v1";

const defaultStore: StoreData = { currentPlate: null, plateQc: null, measurements: [], discLayout: [] };

function getStore(): StoreData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultStore };
  try {
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      currentPlate: parsed.currentPlate ? hydratePlateRecord(parsed.currentPlate) : null,
      plateQc: parsed.plateQc ?? null,
      measurements: Array.isArray(parsed.measurements) ? parsed.measurements.map(hydrateMeasurement) : [],
      discLayout: Array.isArray(parsed.discLayout) ? parsed.discLayout.map(hydrateDiscLayout) : [],
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
  };
}

export function createOrUpdatePlateRecord(input: Omit<PlateRecord, "id" | "createdAt" | "plateStatus">) {
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

export function saveDiscLayoutItem(item: Omit<DiscLayout, "id"> & { id?: string }) {
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

export function importLimsWorklistJson(jsonText: string) {
  const payload = JSON.parse(jsonText) as Record<string, unknown>;
  const store = getStore();
  const importedPlate = hydratePlateRecord({
    ...store.currentPlate,
    id: store.currentPlate?.id,
    createdAt: store.currentPlate?.createdAt,
    plateStatus: store.currentPlate?.plateStatus ?? "Draft",
    externalLisAccessionId: String(payload.accessionId ?? ""),
    accessionNumber: String(payload.accessionNumber ?? ""),
    patientIdentifier: String(payload.patientDisplayId ?? payload.patientIdentifier ?? ""),
    isolateId: String(payload.isolateId ?? ""),
    externalLisIsolateId: String(payload.isolateId ?? ""),
    specimenType: String(payload.specimenType ?? store.currentPlate?.specimenType ?? ""),
    organismName: String(payload.organismName ?? ""),
    organismCode: String(payload.organismCode ?? ""),
    organismGroup: String(payload.organismGroup ?? ""),
    astPanelId: String(payload.astPanelId ?? ""),
    astPanelName: String(payload.astPanelName ?? payload.astPanelLabel ?? ""),
    standard: (payload.standard as AstStandard) ?? "EUCAST",
    worklistId: String(payload.accessionId ?? ""),
    operatingMode: "medugu_lims_connected",
    interpretationAuthority: "lis_interprets",
  });

  const discs = Array.isArray(payload.expectedDiscs) ? payload.expectedDiscs : [];
  const discLayout = discs.map((disc, index) => {
    const record = disc as Record<string, unknown>;
    return hydrateDiscLayout({
      diskPosition: `A${index + 1}`,
      antibioticCode: String(record.antibioticCode ?? ""),
      antibioticName: String(record.antibioticName ?? record.plateHint ?? ""),
      discPotency: String(record.discPotency ?? ""),
      discLot: "",
      discExpiryDate: "",
      expectedOnPlate: true,
    });
  });

  store.currentPlate = importedPlate;
  store.discLayout = discLayout;
  saveStore(store);
  return importedPlate;
}

export function validateZoneResultExport() {
  const errors: string[] = [];
  const { currentPlate, measurements, plateQc } = getStore();

  if (!currentPlate) return ["No current plate record."];
  if (!currentPlate.accessionNumber.trim()) errors.push("Missing accession number.");
  if (currentPlate.operatingMode !== "standalone" && !currentPlate.isolateId.trim()) errors.push("LIMS-connected mode requires isolateId.");
  if (currentPlate.operatingMode !== "standalone" && !currentPlate.astPanelId.trim()) errors.push("LIMS-connected mode requires astPanelId.");
  if (measurements.length === 0) errors.push("No measurements entered.");
  if (plateQc?.qcStatus === "Reject image or repeat plate") errors.push("QC status is Reject image or repeat plate.");

  measurements.forEach((m, i) => {
    if (!m.antibioticCode.trim()) errors.push(`Measurement ${i + 1}: missing antibioticCode.`);
    if (typeof m.zoneDiameterMm !== "number" || Number.isNaN(m.zoneDiameterMm) || m.zoneDiameterMm < 6 || m.zoneDiameterMm > 50) {
      errors.push(`Measurement ${i + 1}: zoneDiameterMm must be between 6 and 50.`);
    }
    if (m.manualEdited && !m.overrideReason.trim()) errors.push(`Measurement ${i + 1}: manualEdited requires overrideReason.`);
  });

  return errors;
}

export function exportZoneResultJson() {
  const { currentPlate, measurements } = getStore();
  if (!currentPlate) throw new Error("No current plate to export");

  return {
    contractVersion: "1.0.0",
    sourceSystem: "DISKDIFF_READER",
    readerDeviceId: currentPlate.captureDevice,
    readerSoftwareVersion: "DiskDiff Reader v1",
    operator: currentPlate.createdBy,
    readAt: new Date().toISOString(),
    accessionId: currentPlate.externalLisAccessionId || currentPlate.accessionNumber,
    accessionNumber: currentPlate.accessionNumber,
    isolateId: currentPlate.isolateId,
    astPanelId: currentPlate.astPanelId,
    method: "disk_diffusion",
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
      reviewedBy: m.reviewedBy || null,
      reviewedAt: m.reviewedAt || null,
      comment: m.comment,
    })),
  };
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
      (m) => `${m.diskPosition || "N/A"}: ${m.antibioticCode || "N/A"} ${m.antibioticName || m.antimicrobialName} = ${m.zoneDiameterMm} mm`,
    ),
  ];

  return lines.join("\n");
}
