export type PlateStatus = "Draft" | "QC Complete";
export type QcStatus =
  | "Acceptable for automated reading"
  | "Readable with manual review required"
  | "Reject image or repeat plate";

export type OperatingMode = "standalone" | "medugu_lims_connected" | "third_party_lis_connected";
export type InterpretationAuthority = "measurement_only" | "zone_reader_interprets" | "lis_interprets";
export type AstStandard = "EUCAST" | "CLSI" | "LOCAL";
export type ImageQualityStatus = "acceptable" | "needs_review" | "rejected";
export type MeasurementMethod = "Manual ruler" | "Camera assisted";

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
  measurementMethod: MeasurementMethod;
  comment: string;
  antibioticCode: string;
  antibioticName: string;
  discPotency: string;
  readerConfidence: "high" | "medium" | "low" | "manual";
  measurementSource: "auto_reader" | "manual_entry" | "reader_then_manual" | "imported";
  manualEdited: boolean;
  originalValue: number | null;
  correctedValue: number | null;
  overrideReason: string;
  reviewedBy: string;
  reviewedAt: string;
  reviewStatus: "pending" | "accepted" | "rejected" | "needs_repeat";
};

const STORAGE_KEY = "diskdiff_workflow_store_v1";

type StoreData = {
  currentPlate: PlateRecord | null;
  plateQc: PlateQc | null;
  measurements: DiskMeasurement[];
  discLayout: DiscLayout[];
};

const defaultStore: StoreData = { currentPlate: null, plateQc: null, measurements: [], discLayout: [] };

function hydratePlateRecord(raw: Partial<PlateRecord>): PlateRecord {
  return {
    id: raw.id ?? crypto.randomUUID(), accessionNumber: raw.accessionNumber ?? "", patientIdentifier: raw.patientIdentifier ?? "", specimenType: raw.specimenType ?? "", organismName: raw.organismName ?? "", organismGroup: raw.organismGroup ?? "", plateSizeMm: raw.plateSizeMm === 150 ? 150 : 90, mediumType: raw.mediumType ?? "", incubationTemperature: raw.incubationTemperature ?? "", incubationAtmosphere: raw.incubationAtmosphere ?? "", incubationDurationHours: raw.incubationDurationHours ?? "", inoculumStandard: raw.inoculumStandard ?? "", imageUrl: raw.imageUrl ?? "", captureDevice: raw.captureDevice ?? "", plateStatus: raw.plateStatus ?? "Draft", createdAt: raw.createdAt ?? new Date().toISOString(),
    operatingMode: raw.operatingMode ?? "standalone", interpretationAuthority: raw.interpretationAuthority ?? "measurement_only", worklistId: raw.worklistId ?? "", isolateId: raw.isolateId ?? "", externalLisAccessionId: raw.externalLisAccessionId ?? "", externalLisIsolateId: raw.externalLisIsolateId ?? "", organismCode: raw.organismCode ?? "", astPanelId: raw.astPanelId ?? "", astPanelName: raw.astPanelName ?? "", standard: raw.standard ?? "EUCAST", plateBarcode: raw.plateBarcode ?? "", imageQualityStatus: raw.imageQualityStatus ?? "acceptable", mediumLot: raw.mediumLot ?? "", createdBy: raw.createdBy ?? "",
  };
}

function hydrateMeasurement(raw: Partial<DiskMeasurement>): DiskMeasurement {
  const zone = Number(raw.zoneDiameterMm ?? 0);
  const measurementMethod: MeasurementMethod = raw.measurementMethod === "Camera assisted" ? "Camera assisted" : "Manual ruler";
  return { id: raw.id ?? crypto.randomUUID(), diskPosition: raw.diskPosition ?? "", antimicrobialName: raw.antimicrobialName ?? "", diskContent: raw.diskContent ?? "", zoneDiameterMm: Number.isFinite(zone) ? zone : 0, measurementMethod, comment: raw.comment ?? "", antibioticCode: raw.antibioticCode ?? "", antibioticName: raw.antibioticName ?? raw.antimicrobialName ?? "", discPotency: raw.discPotency ?? raw.diskContent ?? "", readerConfidence: raw.readerConfidence ?? "manual", measurementSource: raw.measurementSource ?? "manual_entry", manualEdited: raw.manualEdited ?? false, originalValue: raw.originalValue ?? null, correctedValue: raw.correctedValue ?? null, overrideReason: raw.overrideReason ?? "", reviewedBy: raw.reviewedBy ?? "", reviewedAt: raw.reviewedAt ?? "", reviewStatus: raw.reviewStatus ?? "accepted" };
}

function getStore(): StoreData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultStore;
  try {
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      currentPlate: parsed.currentPlate ? hydratePlateRecord(parsed.currentPlate) : null,
      plateQc: parsed.plateQc ?? null,
      measurements: (parsed.measurements ?? []).map(hydrateMeasurement),
      discLayout: (parsed.discLayout ?? []).map((d) => ({ id: d.id ?? crypto.randomUUID(), diskPosition: d.diskPosition ?? "", antibioticCode: d.antibioticCode ?? "", antibioticName: d.antibioticName ?? "", discPotency: d.discPotency ?? "", discLot: d.discLot ?? "", discExpiryDate: d.discExpiryDate ?? "", expectedOnPlate: d.expectedOnPlate ?? true })),
    };
  } catch {
    return defaultStore;
  }
}
function saveStore(store: StoreData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }

export function createOrUpdatePlateRecord(input: Omit<PlateRecord, "id" | "createdAt" | "plateStatus">) {
  const store = getStore();
  const plate: PlateRecord = { id: store.currentPlate?.id ?? crypto.randomUUID(), createdAt: store.currentPlate?.createdAt ?? new Date().toISOString(), plateStatus: "Draft", ...input };
  store.currentPlate = plate; saveStore(store); return plate;
}
export function savePlateQc(qc: Omit<PlateQc, "qcStatus"> & { qcStatus: QcStatus }) { const store = getStore(); store.plateQc = qc; if (store.currentPlate) store.currentPlate.plateStatus = "QC Complete"; saveStore(store); return qc; }
export function addDiskMeasurement(measurement: Omit<DiskMeasurement, "id">) { const store = getStore(); const newMeasurement = hydrateMeasurement({ id: crypto.randomUUID(), ...measurement }); store.measurements.push(newMeasurement); saveStore(store); return newMeasurement; }
export function listMeasurements() { return getStore().measurements; }
export function getWorkflowState() { return getStore(); }

export function saveDiscLayoutItem(item: Omit<DiscLayout, "id"> & { id?: string }) {
  const store = getStore();
  const id = item.id ?? crypto.randomUUID();
  const normalized: DiscLayout = { id, ...item, expectedOnPlate: item.expectedOnPlate ?? true };
  const idx = store.discLayout.findIndex((d) => d.id === id);
  if (idx >= 0) store.discLayout[idx] = normalized; else store.discLayout.push(normalized);
  saveStore(store); return normalized;
}
export function listDiscLayout() { return getStore().discLayout; }

export function importLimsWorklistJson(jsonText: string) {
  const parsed = JSON.parse(jsonText);
  const expectedDiscs = Array.isArray(parsed.expectedDiscs) ? parsed.expectedDiscs : [];
  const store = getStore();
  const base = hydratePlateRecord(store.currentPlate ?? {});
  store.currentPlate = { ...base, worklistId: parsed.worklistId ?? base.worklistId, accessionNumber: parsed.accessionNumber ?? base.accessionNumber, patientIdentifier: parsed.patientIdentifier ?? base.patientIdentifier, specimenType: parsed.specimenType ?? base.specimenType, organismName: parsed.organismName ?? base.organismName, organismCode: parsed.organismCode ?? base.organismCode, organismGroup: parsed.organismGroup ?? base.organismGroup, isolateId: parsed.isolateId ?? base.isolateId, astPanelId: parsed.astPanelId ?? base.astPanelId, astPanelName: parsed.astPanelName ?? base.astPanelName, standard: parsed.standard ?? base.standard, operatingMode: "medugu_lims_connected" };
  store.discLayout = expectedDiscs.map((d: any) => ({ id: crypto.randomUUID(), diskPosition: d.diskPosition ?? "", antibioticCode: d.antibioticCode ?? "", antibioticName: d.antibioticName ?? "", discPotency: d.discPotency ?? "", discLot: d.discLot ?? "", discExpiryDate: d.discExpiryDate ?? "", expectedOnPlate: d.expectedOnPlate ?? true }));
  saveStore(store);
  return store.currentPlate;
}

export function validateZoneResultExport() {
  const { currentPlate, measurements, plateQc } = getStore();
  const warnings: string[] = [];
  if (!currentPlate?.accessionNumber) warnings.push("Missing accession number");
  if (currentPlate && currentPlate.operatingMode !== "standalone" && !currentPlate.isolateId) warnings.push("LIMS-connected mode requires isolateId");
  if (currentPlate && currentPlate.operatingMode !== "standalone" && !currentPlate.astPanelId) warnings.push("LIMS-connected mode requires astPanelId");
  if (plateQc?.qcStatus === "Reject image or repeat plate") warnings.push("QC status is Reject image or repeat plate");
  if (measurements.length === 0) warnings.push("No measurements entered");
  measurements.forEach((m, i) => { if (!m.antibioticCode) warnings.push(`Measurement ${i + 1}: missing antibioticCode`); if (!Number.isFinite(m.zoneDiameterMm) || m.zoneDiameterMm < 6 || m.zoneDiameterMm > 50) warnings.push(`Measurement ${i + 1}: zoneDiameterMm must be between 6 and 50`); if (m.manualEdited && !m.overrideReason) warnings.push(`Measurement ${i + 1}: overrideReason required when manualEdited=true`); });
  return warnings;
}

export function exportZoneResultJson() {
  const { currentPlate, measurements } = getStore();
  const now = new Date().toISOString();
  return {
    contractVersion: "1.0.0", sourceSystem: "DISKDIFF_READER", readerDeviceId: currentPlate?.captureDevice ?? "", readerSoftwareVersion: "DiskDiff Reader v1", operator: currentPlate?.createdBy ?? "", readAt: now, accessionId: currentPlate?.externalLisAccessionId ?? "", accessionNumber: currentPlate?.accessionNumber ?? "", isolateId: currentPlate?.isolateId ?? "", astPanelId: currentPlate?.astPanelId ?? "", method: "disk_diffusion", standard: currentPlate?.standard ?? "EUCAST", plateBarcode: currentPlate?.plateBarcode ?? "", imageReference: currentPlate?.imageUrl ?? "",
    results: measurements.map((m) => ({ antibioticCode: m.antibioticCode, antibioticName: m.antibioticName || m.antimicrobialName, discPotency: m.discPotency || m.diskContent, diskPosition: m.diskPosition, zoneDiameterMm: m.zoneDiameterMm, readerConfidence: m.readerConfidence, measurementSource: m.measurementSource, manualEdited: m.manualEdited, originalValue: m.originalValue, correctedValue: m.correctedValue, overrideReason: m.overrideReason || null, reviewStatus: m.reviewStatus, reviewedBy: m.reviewedBy || currentPlate?.createdBy || "", reviewedAt: m.reviewedAt || now, comment: m.comment ?? "" })),
  };
}

export function generateDraftReportText() {
  const { currentPlate, measurements } = getStore();
  if (!currentPlate) return "Draft: not for clinical release\nNo plate record available.";
  const lines = ["Draft: not for clinical release", "Image-assisted disk diffusion reading is for supervised laboratory use", "Final AST interpretation requires authorised review", "In LIS-connected mode, DiskDiff Reader sends zone measurements and audit metadata. Final interpretation, expert rules, AMS governance, validation, and report release remain in the LIS unless explicitly configured otherwise.", `Accession: ${currentPlate.accessionNumber}`, `Specimen: ${currentPlate.specimenType}`, `Organism: ${currentPlate.organismName || "Not entered"}`, "", "Zone measurements:", ...measurements.map((m) => `${m.diskPosition || "N/A"}: ${m.antibioticName || m.antimicrobialName} ${m.discPotency || m.diskContent} = ${m.zoneDiameterMm} mm (${m.measurementMethod})`)];
  return lines.join("\n");
}