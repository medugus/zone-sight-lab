import { exportZoneResultJson } from "./diskdiff-store";
import { MEDUGU_ZONE_RESULT_INBOUND_ENDPOINT } from "./medugu-zone-result-intake";
import { ZoneResultEnvelopeSchema, type ZoneResultEnvelope } from "./schemas/zone-result.schema";

export type ZoneResultSendState = "ready" | "sending" | "sent" | "failed";

export type ZoneResultSendResult =
  | {
      state: "sent";
      message: string;
      status: number;
      auditId?: string;
      summary: string;
      payload: ZoneResultEnvelope;
    }
  | {
      state: "failed";
      message: string;
      status?: number;
      reason: string;
      payload?: ZoneResultEnvelope;
    };

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type SendOptions = {
  endpoint?: string;
  bearerToken: string;
  fetchImpl?: FetchLike;
};

type MeduguZoneResultResponse = {
  ok?: boolean;
  status?: number;
  auditId?: string;
  mappedRowIds?: string[];
  idempotent?: boolean;
  reason?: string;
  details?: string[];
};

export async function sendCurrentZoneResultToLis(
  options: SendOptions,
): Promise<ZoneResultSendResult> {
  let payload: ZoneResultEnvelope;
  try {
    payload = exportZoneResultJson();
  } catch (error) {
    return {
      state: "failed",
      reason: "schema_validation_failed",
      message: readableError(error),
    };
  }

  return sendValidatedZoneResultEnvelope(payload, options);
}

export async function sendValidatedZoneResultEnvelope(
  candidatePayload: unknown,
  options: SendOptions,
): Promise<ZoneResultSendResult> {
  const parsed = ZoneResultEnvelopeSchema.safeParse(candidatePayload);
  if (!parsed.success) {
    return {
      state: "failed",
      reason: "schema_validation_failed",
      message: `Zone Result payload failed schema validation before send: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`)
        .join("; ")}`,
    };
  }

  const payload = parsed.data;
  if (payload.notForClinicalRelease !== true || payload.releaseAuthority !== "LIS") {
    return {
      state: "failed",
      reason: "payload_invariant_failed",
      message:
        'Zone Result send requires notForClinicalRelease=true and releaseAuthority="LIS" before transmission.',
      payload,
    };
  }

  const token = options.bearerToken.trim();
  if (!token) {
    return {
      state: "failed",
      reason: "missing_auth_token",
      message: "Enter the Medugu ZoneResult bearer token before sending to LIS.",
      payload,
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? MEDUGU_ZONE_RESULT_INBOUND_ENDPOINT;

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await parseJsonResponse(response);
    if (!response.ok || body?.ok === false) {
      return {
        state: "failed",
        status: response.status,
        reason: body?.reason ?? `http_${response.status}`,
        message: formatFailureMessage(response.status, body),
        payload,
      };
    }

    return {
      state: "sent",
      status: response.status,
      auditId: body?.auditId,
      summary: summarizeMeduguResult(body),
      message: summarizeMeduguResult(body),
      payload,
    };
  } catch (error) {
    return {
      state: "failed",
      reason: "request_failed",
      message: `Could not send Zone Result to Medugu: ${readableError(error)}`,
      payload,
    };
  }
}

function readableError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function parseJsonResponse(
  response: Response,
): Promise<MeduguZoneResultResponse | undefined> {
  try {
    const value: unknown = await response.json();
    return typeof value === "object" && value !== null
      ? (value as MeduguZoneResultResponse)
      : undefined;
  } catch {
    return undefined;
  }
}

function formatFailureMessage(status: number, body: MeduguZoneResultResponse | undefined) {
  const details = body?.details?.filter((detail) => detail.trim()).join("; ");
  if (details) return `Medugu rejected the Zone Result (${status}): ${details}`;
  if (body?.reason) return `Medugu rejected the Zone Result (${status}): ${body.reason}`;
  return `Medugu rejected the Zone Result (${status}).`;
}

function summarizeMeduguResult(body: MeduguZoneResultResponse | undefined) {
  const mappedCount = body?.mappedRowIds?.length ?? 0;
  const auditText = body?.auditId ? ` Audit ${body.auditId}.` : "";
  const idempotentText = body?.idempotent ? " No row changes were needed." : "";
  return `Sent successfully. Medugu accepted ${mappedCount} measurement row${mappedCount === 1 ? "" : "s"}.${auditText}${idempotentText}`;
}
