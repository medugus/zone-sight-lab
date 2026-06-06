import { ZodError } from "zod";
import { ZoneResultEnvelopeSchema, type ZoneResultEnvelope } from "./schemas/zone-result.schema";

export const MEDUGU_ZONE_RESULT_INBOUND_ENDPOINT = "/api/medugu/zone-results";
export const MEDUGU_ZONE_RESULT_TOKEN_ENV = "MEDUGU_ZONE_RESULT_INTAKE_TOKEN";

type ProtectedClinicalFields = {
  interpretation?: string;
  phenotype?: string;
  cascadeReporting?: unknown;
  selectiveReporting?: unknown;
  stewardshipOutputs?: unknown;
  ipcOutputs?: unknown;
  validationState?: string;
  releaseState?: string;
};

export type MeduguAstRow = ProtectedClinicalFields & {
  id: string;
  isolateId: string;
  astPanelId: string;
  antibioticCode: string;
  method: string;
  standard: string;
  rawValue?: number | null;
  rawUnit?: "mm" | null;
  zoneMm?: number | null;
  measurementProvenance?: ZoneResultMeasurementProvenance | null;
  lastRawMeasurementAuditId?: string | null;
};

export type MeduguAccessionState = ProtectedClinicalFields & {
  accessionId: string;
  accessionNumber: string;
  astRows: MeduguAstRow[];
  downstreamRuns?: MeduguDownstreamRun[];
};

export type ZoneResultMeasurementProvenance = {
  sourceSystem: "DISKDIFF_READER";
  inboundAuditId: string;
  readerDeviceId: string;
  readerSoftwareVersion: string;
  operator: string;
  readAt: string;
  plateBarcode: string;
  imageReference: string;
  diskPosition: string;
  antibioticName: string;
  discPotency: string;
  readerConfidence: ZoneResultEnvelope["results"][number]["readerConfidence"];
  measurementSource: ZoneResultEnvelope["results"][number]["measurementSource"];
  manualEdited: boolean;
  originalValue: number | null;
  correctedValue: number | null;
  overrideReason: string | null;
  reviewStatus: ZoneResultEnvelope["results"][number]["reviewStatus"];
  reviewedBy: string | null;
  reviewedAt: string | null;
  comment: string;
};

export type ZoneResultInboundAuditRecord = {
  id: string;
  receivedAt: string;
  authenticated: boolean;
  rawPayload: unknown;
  parseOutcome:
    | { status: "not_parsed"; issues: string[] }
    | { status: "valid"; schemaVersion: string; resultCount: number }
    | { status: "invalid_json"; issues: string[] }
    | { status: "invalid_schema"; issues: string[] };
  validationOutcome:
    | { status: "not_validated" }
    | { status: "accepted"; mappedRowIds: string[]; idempotent: boolean }
    | { status: "rejected"; reason: ZoneResultInboundRejectReason; details: string[] };
};

export type ZoneResultInboundRejectReason =
  | "unauthenticated"
  | "invalid_json"
  | "invalid_schema"
  | "accession_mismatch"
  | "isolate_mismatch"
  | "ast_panel_mismatch"
  | "no_accepted_rows"
  | "row_match_failed";

export type MeduguDownstreamPath =
  | "ast_interpretation"
  | "stewardship"
  | "ipc"
  | "validation_release_gating";

export type MeduguDownstreamRun = {
  path: MeduguDownstreamPath;
  accessionId: string;
  auditId: string;
  ranAt: string;
};

export type ZoneResultIntakeStore = {
  accessions: MeduguAccessionState[];
  inboundAudit: ZoneResultInboundAuditRecord[];
};

type ZoneResultRejectStatus = 400 | 401 | 404 | 409 | 422;

export type ZoneResultIntakeResult =
  | {
      ok: true;
      status: 202;
      auditId: string;
      mappedRowIds: string[];
      idempotent: boolean;
      downstreamRuns: MeduguDownstreamRun[];
    }
  | {
      ok: false;
      status: ZoneResultRejectStatus;
      auditId: string;
      reason: ZoneResultInboundRejectReason;
      details: string[];
    };

export const MEDUGU_ZONE_RESULT_MAPPED_FIELDS = [
  "rawValue",
  "rawUnit",
  "zoneMm",
  "method",
  "measurementProvenance",
  "lastRawMeasurementAuditId",
] as const;

export const MEDUGU_ZONE_RESULT_PROTECTED_FIELDS = [
  "interpretation",
  "phenotype",
  "cascadeReporting",
  "selectiveReporting",
  "stewardshipOutputs",
  "ipcOutputs",
  "validationState",
  "releaseState",
] as const;

function nowIso() {
  return new Date().toISOString();
}

function makeAuditId(payload: unknown) {
  const body = JSON.stringify(payload) ?? String(payload);
  let hash = 0;
  for (let i = 0; i < body.length; i += 1) hash = (hash * 31 + body.charCodeAt(i)) >>> 0;
  return `zr-in-${Date.now().toString(36)}-${hash.toString(36)}`;
}

function zodIssues(error: ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
    return `${path}: ${issue.message}`;
  });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

export function authenticateZoneResultInboundRequest(request: Request, expectedToken: string) {
  if (!expectedToken.trim()) return false;
  return getBearerToken(request) === expectedToken;
}

export async function handleMeduguZoneResultInboundRequest(
  request: Request,
  store: ZoneResultIntakeStore,
  options: { intakeToken: string; now?: () => string } = { intakeToken: "" },
) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const rawBody = await request.text();
  let payload: unknown = null;
  let invalidJsonIssue: string | undefined;
  try {
    payload = rawBody.trim() ? JSON.parse(rawBody) : null;
  } catch {
    payload = rawBody;
    invalidJsonIssue = "Request body is not valid JSON.";
  }

  const result = ingestZoneResultPayload(payload, store, {
    authenticated: authenticateZoneResultInboundRequest(request, options.intakeToken),
    invalidJsonIssue,
    now: options.now,
  });

  return Response.json(result, { status: result.status });
}

export function ingestZoneResultPayload(
  payload: unknown,
  store: ZoneResultIntakeStore,
  options: { authenticated: boolean; invalidJsonIssue?: string; now?: () => string },
): ZoneResultIntakeResult {
  const receivedAt = options.now?.() ?? nowIso();
  const audit: ZoneResultInboundAuditRecord = {
    id: makeAuditId(payload),
    receivedAt,
    authenticated: options.authenticated,
    rawPayload: payload,
    parseOutcome: { status: "not_parsed", issues: [] },
    validationOutcome: { status: "not_validated" },
  };
  store.inboundAudit.push(audit);

  if (!options.authenticated) {
    return reject(audit, 401, "unauthenticated", ["Missing or invalid bearer token."]);
  }

  if (options.invalidJsonIssue) {
    audit.parseOutcome = { status: "invalid_json", issues: [options.invalidJsonIssue] };
    return reject(audit, 400, "invalid_json", audit.parseOutcome.issues);
  }

  const parsed = ZoneResultEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    audit.parseOutcome = { status: "invalid_schema", issues: zodIssues(parsed.error) };
    return reject(audit, 422, "invalid_schema", audit.parseOutcome.issues);
  }

  const zoneResult = parsed.data;
  audit.parseOutcome = {
    status: "valid",
    schemaVersion: zoneResult.schemaVersion,
    resultCount: zoneResult.results.length,
  };

  const accession = store.accessions.find(
    (candidate) => candidate.accessionId === zoneResult.accessionId,
  );
  if (!accession) {
    return reject(audit, 404, "accession_mismatch", [
      `No Medugu accession found for accessionId ${zoneResult.accessionId}.`,
    ]);
  }
  if (accession.accessionNumber !== zoneResult.accessionNumber) {
    return reject(audit, 409, "accession_mismatch", [
      `Expected accessionNumber ${accession.accessionNumber}, received ${zoneResult.accessionNumber}.`,
    ]);
  }

  const isolateRows = accession.astRows.filter((row) => row.isolateId === zoneResult.isolateId);
  if (isolateRows.length === 0) {
    return reject(audit, 409, "isolate_mismatch", [
      `No AST rows found for isolateId ${zoneResult.isolateId} on accession ${accession.accessionId}.`,
    ]);
  }

  const panelRows = isolateRows.filter((row) => row.astPanelId === zoneResult.astPanelId);
  if (panelRows.length === 0) {
    return reject(audit, 409, "ast_panel_mismatch", [
      `No AST rows found for astPanelId ${zoneResult.astPanelId} on isolate ${zoneResult.isolateId}.`,
    ]);
  }

  const acceptedResults = zoneResult.results.filter((result) => result.reviewStatus === "accepted");
  if (acceptedResults.length === 0) {
    return reject(audit, 422, "no_accepted_rows", ["ZoneResult contained no accepted rows to map."]);
  }

  const rowMatches = acceptedResults.map((result) => {
    const row = panelRows.find(
      (candidate) =>
        candidate.antibioticCode === result.antibioticCode &&
        candidate.method === zoneResult.method &&
        candidate.standard === zoneResult.standard,
    );
    return { result, row };
  });
  const missingRows = rowMatches.filter((match) => !match.row);
  if (missingRows.length > 0) {
    return reject(
      audit,
      409,
      "row_match_failed",
      missingRows.map(
        (match) =>
          `No AST row matched isolateId=${zoneResult.isolateId}, astPanelId=${zoneResult.astPanelId}, antibioticCode=${match.result.antibioticCode}, method=${zoneResult.method}, standard=${zoneResult.standard}.`,
      ),
    );
  }

  const incomingRaw = rowMatches.map(({ result }) =>
    JSON.stringify(rawComparableFromResult(zoneResult, result)),
  );
  const idempotent = rowMatches.every(
    ({ row }, index) => JSON.stringify(rawComparable(row!)) === incomingRaw[index],
  );
  const mappedRowIds: string[] = [];
  rowMatches.forEach(({ result, row }, index) => {
    const target = row!;
    if (JSON.stringify(rawComparable(target)) !== incomingRaw[index]) {
      target.rawValue = result.zoneDiameterMm;
      target.rawUnit = "mm";
      target.zoneMm = result.zoneDiameterMm;
      target.method = zoneResult.method;
      target.measurementProvenance = buildProvenance(zoneResult, result, audit.id);
      target.lastRawMeasurementAuditId = audit.id;
    }
    mappedRowIds.push(target.id);
  });

  const downstreamRuns = rerunMeduguDownstreamLogic(accession, audit.id, options.now);

  audit.validationOutcome = { status: "accepted", mappedRowIds, idempotent };
  return { ok: true, status: 202, auditId: audit.id, mappedRowIds, idempotent, downstreamRuns };
}

function reject(
  audit: ZoneResultInboundAuditRecord,
  status: ZoneResultRejectStatus,
  reason: ZoneResultInboundRejectReason,
  details: string[],
): ZoneResultIntakeResult {
  audit.validationOutcome = { status: "rejected", reason, details };
  return { ok: false, status, auditId: audit.id, reason, details };
}

function buildProvenance(
  zoneResult: ZoneResultEnvelope,
  result: ZoneResultEnvelope["results"][number],
  auditId: string,
): ZoneResultMeasurementProvenance {
  return {
    sourceSystem: zoneResult.sourceSystem,
    inboundAuditId: auditId,
    readerDeviceId: zoneResult.readerDeviceId,
    readerSoftwareVersion: zoneResult.readerSoftwareVersion,
    operator: zoneResult.operator,
    readAt: zoneResult.readAt,
    plateBarcode: zoneResult.plateBarcode,
    imageReference: zoneResult.imageReference,
    diskPosition: result.diskPosition,
    antibioticName: result.antibioticName,
    discPotency: result.discPotency,
    readerConfidence: result.readerConfidence,
    measurementSource: result.measurementSource,
    manualEdited: result.manualEdited,
    originalValue: result.originalValue,
    correctedValue: result.correctedValue,
    overrideReason: result.overrideReason,
    reviewStatus: result.reviewStatus,
    reviewedBy: result.reviewedBy,
    reviewedAt: result.reviewedAt,
    comment: result.comment,
  };
}

function rawComparable(row: MeduguAstRow) {
  return {
    rawValue: row.rawValue ?? null,
    rawUnit: row.rawUnit ?? null,
    zoneMm: row.zoneMm ?? null,
    method: row.method,
    measurementProvenance: row.measurementProvenance
      ? provenanceComparable(row.measurementProvenance)
      : null,
  };
}

function rawComparableFromResult(
  zoneResult: ZoneResultEnvelope,
  result: ZoneResultEnvelope["results"][number],
) {
  return {
    rawValue: result.zoneDiameterMm,
    rawUnit: "mm",
    zoneMm: result.zoneDiameterMm,
    method: zoneResult.method,
    measurementProvenance: provenanceComparable(buildProvenance(zoneResult, result, "")),
  };
}

function provenanceComparable(provenance: ZoneResultMeasurementProvenance) {
  const { inboundAuditId: _inboundAuditId, ...comparable } = provenance;
  return comparable;
}

export function rerunMeduguDownstreamLogic(
  accession: MeduguAccessionState,
  auditId: string,
  now: (() => string) | undefined = undefined,
): MeduguDownstreamRun[] {
  const ranAt = now?.() ?? nowIso();
  const runs: MeduguDownstreamRun[] = [
    { path: "ast_interpretation", accessionId: accession.accessionId, auditId, ranAt },
    { path: "stewardship", accessionId: accession.accessionId, auditId, ranAt },
    { path: "ipc", accessionId: accession.accessionId, auditId, ranAt },
    { path: "validation_release_gating", accessionId: accession.accessionId, auditId, ranAt },
  ];
  accession.downstreamRuns = [...(accession.downstreamRuns ?? []), ...runs];
  return runs;
}
