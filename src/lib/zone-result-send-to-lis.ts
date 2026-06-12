import { exportZoneResultJson } from "./diskdiff-store";
import { ZoneResultEnvelopeSchema, type ZoneResultEnvelope } from "./schemas/zone-result.schema";

export type ZoneResultSendState = "ready" | "sending" | "sent" | "failed";

export type ZoneResultSendResult =
  | {
      state: "sent";
      message: string;
      status: number;
      receiptId?: string;
      queueStatus?: string;
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
  receiptId?: string;
  status?: string;
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
      message: "Missing Medugu bearer token: enter the bearer token before sending to LIS.",
      payload,
    };
  }

  const endpointResult = validateFullMeduguEndpoint(options.endpoint);
  if (!endpointResult.ok) {
    return {
      state: "failed",
      reason: endpointResult.reason,
      message: endpointResult.message,
      payload,
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = endpointResult.endpoint;

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
      receiptId: body?.receiptId,
      queueStatus: body?.status,
      auditId: body?.auditId,
      summary: summarizeMeduguResult(body),
      message: summarizeMeduguResult(body),
      payload,
    };
  } catch (error) {
    return {
      state: "failed",
      reason: "request_failed",
      message: `Request/network failure sending Zone Result to Medugu: ${readableError(error)}`,
      payload,
    };
  }
}

function readableError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

type EndpointValidationResult =
  | { ok: true; endpoint: string }
  | { ok: false; reason: "missing_endpoint" | "invalid_endpoint"; message: string };

function validateFullMeduguEndpoint(endpoint: string | undefined): EndpointValidationResult {
  const trimmedEndpoint = endpoint?.trim() ?? "";
  if (!trimmedEndpoint) {
    return {
      ok: false,
      reason: "missing_endpoint",
      message:
        "Missing Medugu endpoint: enter the full Medugu URL before sending to LIS. Example: https://your-medugu-host/api/public/zone-reader/result",
    };
  }

  try {
    const url = new URL(trimmedEndpoint);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Unsupported URL protocol");
    }
    return { ok: true, endpoint: trimmedEndpoint };
  } catch {
    return {
      ok: false,
      reason: "invalid_endpoint",
      message:
        "Invalid Medugu endpoint: enter the full Medugu URL, not a relative path. Example: https://your-medugu-host/api/public/zone-reader/result",
    };
  }
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
  if (status === 401 || status === 403 || body?.reason === "unauthenticated") {
    const authReason = details || body?.reason || "missing or invalid bearer token";
    return `Medugu authentication failed (${status}): ${authReason}`;
  }
  if (details) return `Medugu rejected the Zone Result (${status}): ${details}`;
  if (body?.reason) return `Medugu rejected the Zone Result (${status}): ${body.reason}`;
  return `Medugu rejected the Zone Result (${status}).`;
}

function summarizeMeduguResult(body: MeduguZoneResultResponse | undefined) {
  const receipt = body?.receiptId ?? body?.auditId;
  const receiptText = receipt ? ` Receipt ${receipt}.` : "";
  const statusText =
    body?.status === "pending_review"
      ? " Queued for clinical review."
      : " Stored by Medugu.";
  const idempotentText = body?.idempotent
    ? " This payload was already stored; no duplicate was created."
    : "";
  return `Sent successfully.${statusText}${receiptText}${idempotentText}`;
}
