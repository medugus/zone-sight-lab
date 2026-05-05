export type PlateStatus = "Draft" | "QC Complete";
export type QcStatus =
  | "Acceptable for automated reading"
  | "Readable with manual review required"
  | "Reject image or repeat plate";

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
};

const STORAGE_KEY = "diskdiff_workflow_store_v1";

type StoreData = {
  currentPlate: PlateRecord | null;
  plateQc: PlateQc | null;
  measurements: DiskMeasurement[];
};

const defaultStore: StoreData = { currentPlate: null, plateQc: null, measurements: [] };

function getStore(): StoreData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultStore;
  try {
    return { ...defaultStore, ...JSON.parse(raw) };
  } catch {
    return defaultStore;
  }
}

function saveStore(store: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createOrUpdatePlateRecord(input: Omit<PlateRecord, "id" | "createdAt" | "plateStatus">) {
  const store = getStore();
  const plate: PlateRecord = {
    id: store.currentPlate?.id ?? crypto.randomUUID(),
    createdAt: store.currentPlate?.createdAt ?? new Date().toISOString(),
    plateStatus: "Draft",
    ...input,
  };
  store.currentPlate = plate;
  saveStore(store);
  return plate;
}

export function savePlateQc(qc: Omit<PlateQc, "qcStatus"> & { qcStatus: QcStatus }) {
  const store = getStore();
  store.plateQc = qc;
  if (store.currentPlate) {
    store.currentPlate.plateStatus = "QC Complete";
  }
  saveStore(store);
  return qc;
}

export function addDiskMeasurement(measurement: Omit<DiskMeasurement, "id">) {
  const store = getStore();
  const newMeasurement = { id: crypto.randomUUID(), ...measurement };
  store.measurements.push(newMeasurement);
  saveStore(store);
  return newMeasurement;
}

export function listMeasurements() {
  return getStore().measurements;
}

export function getWorkflowState() {
  return getStore();
}

export function generateDraftReportText() {
  const { currentPlate, measurements } = getStore();
  if (!currentPlate) return "Draft: not for clinical release\nNo plate record available.";

  const lines = [
    "Draft: not for clinical release",
    `Accession: ${currentPlate.accessionNumber}`,
    `Specimen: ${currentPlate.specimenType}`,
    `Organism: ${currentPlate.organismName || "Not entered"}`,
    "",
    "Manual zone measurements:",
    ...measurements.map(
      (m) => `${m.diskPosition || "N/A"}: ${m.antimicrobialName} ${m.diskContent} = ${m.zoneDiameterMm} mm (${m.measurementMethod})`,
    ),
  ];

  return lines.join("\n");
}
