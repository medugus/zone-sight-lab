import { ZodError, type ZodIssue } from "zod";
import { LimsWorklistSchema, LIMS_WORKLIST_SCHEMA_VERSION } from "./lims-worklist.schema";

export type LimsImportErrorGroups = {
  schemaVersion: string[];
  wrapper: string[];
  missing: string[];
  wrongType: string[];
  unknownFields: string[];
};

export type FormattedLimsImportError = {
  summary: string;
  groups: LimsImportErrorGroups;
  /** Flat ordered list, useful for compact rendering / tests. */
  lines: string[];
};

const KNOWN_TOP_LEVEL_KEYS = new Set<string>([
  "schemaVersion",
  "sourceSystem",
  "worklistId",
  "accessionId",
  "accessionNumber",
  "patientDisplayId",
  "isolateId",
  "specimenType",
  "organismName",
  "organismCode",
  "organismGroup",
  "astPanelId",
  "astPanelName",
  "standard",
  "expectedDiscs",
  "createdAt",
]);

function pathToString(path: (string | number)[]): string {
  if (path.length === 0) return "(root)";
  return path
    .map((p, i) => (typeof p === "number" ? `[${p}]` : i === 0 ? p : `.${p}`))
    .join("");
}

function detectWrapper(raw: unknown): string[] {
  const issues: string[] = [];
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    issues.push(
      "Payload root must be a JSON object containing the worklist fields at the top level.",
    );
    return issues;
  }
  const obj = raw as Record<string, unknown>;
  const topKeys = Object.keys(obj);
  const wrapperKeys = ["worklist", "data", "payload", "result", "body"];
  const matched = wrapperKeys.find(
    (k) => k in obj && typeof obj[k] === "object" && obj[k] !== null,
  );
  if (matched && !("expectedDiscs" in obj)) {
    issues.push(
      `Payload appears wrapped in a "${matched}" envelope. The worklist object must be at the JSON root, not nested under "${matched}".`,
    );
  }
  // Hint: very few known keys present at all
  const known = topKeys.filter((k) => KNOWN_TOP_LEVEL_KEYS.has(k));
  if (known.length === 0 && !matched) {
    issues.push(
      "No recognised worklist fields found at the JSON root. Expected fields like schemaVersion, worklistId, accessionId, expectedDiscs.",
    );
  }
  return issues;
}

function detectUnknownFields(raw: unknown): string[] {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return [];
  const obj = raw as Record<string, unknown>;
  const unknown = Object.keys(obj).filter((k) => !KNOWN_TOP_LEVEL_KEYS.has(k));
  return unknown.map(
    (k) =>
      `Unrecognised field "${k}" at root. Remove it or rename to a supported field.`,
  );
}

function classifyIssue(
  issue: ZodIssue,
  groups: LimsImportErrorGroups,
): void {
  const where = pathToString(issue.path);

  // Wrong schema version
  if (
    issue.code === "invalid_literal" &&
    issue.path.length === 1 &&
    issue.path[0] === "schemaVersion"
  ) {
    groups.schemaVersion.push(
      `schemaVersion must be exactly "${LIMS_WORKLIST_SCHEMA_VERSION}". Received: ${JSON.stringify(
        (issue as { received?: unknown }).received,
      )}.`,
    );
    return;
  }

  // Missing required field
  if (issue.code === "invalid_type") {
    const received = (issue as { received?: string }).received;
    const expected = (issue as { expected?: string }).expected;
    if (received === "undefined") {
      groups.missing.push(`Missing required field: ${where} (expected ${expected}).`);
      return;
    }
    if (received === "null") {
      groups.wrongType.push(
        `${where} is null but a non-null ${expected} is required.`,
      );
      return;
    }
    groups.wrongType.push(
      `${where} has wrong type. Expected ${expected}, received ${received}.`,
    );
    return;
  }

  if (issue.code === "invalid_enum_value") {
    groups.wrongType.push(
      `${where} has an invalid value. ${issue.message}`,
    );
    return;
  }

  if (issue.code === "too_small" || issue.code === "too_big") {
    groups.wrongType.push(`${where}: ${issue.message}`);
    return;
  }

  if (issue.code === "invalid_string") {
    groups.wrongType.push(`${where}: ${issue.message}`);
    return;
  }

  if (issue.code === "unrecognized_keys") {
    const keys = (issue as { keys?: string[] }).keys ?? [];
    keys.forEach((k) =>
      groups.unknownFields.push(
        `Unrecognised field "${k}" at ${where}. Remove it or rename to a supported field.`,
      ),
    );
    return;
  }

  // Fallback
  groups.wrongType.push(`${where}: ${issue.message}`);
}

export function formatLimsImportError(
  error: unknown,
  raw?: unknown,
): FormattedLimsImportError {
  const groups: LimsImportErrorGroups = {
    schemaVersion: [],
    wrapper: [],
    missing: [],
    wrongType: [],
    unknownFields: [],
  };

  if (error instanceof SyntaxError) {
    groups.wrapper.push(`Input is not valid JSON: ${error.message}`);
  } else if (error instanceof ZodError) {
    groups.wrapper.push(...detectWrapper(raw));
    groups.unknownFields.push(...detectUnknownFields(raw));
    for (const issue of error.issues) classifyIssue(issue, groups);
  } else if (error instanceof Error) {
    groups.wrongType.push(error.message);
  } else {
    groups.wrongType.push("Unknown import error.");
  }

  // Dedupe
  (Object.keys(groups) as (keyof LimsImportErrorGroups)[]).forEach((k) => {
    groups[k] = Array.from(new Set(groups[k]));
  });

  const totalCount =
    groups.schemaVersion.length +
    groups.wrapper.length +
    groups.missing.length +
    groups.wrongType.length +
    groups.unknownFields.length;

  const summary =
    totalCount === 0
      ? "Import failed."
      : `Import rejected: ${totalCount} validation issue${totalCount === 1 ? "" : "s"} in LIMS Worklist payload.`;

  const lines = [
    ...groups.schemaVersion,
    ...groups.wrapper,
    ...groups.missing,
    ...groups.wrongType,
    ...groups.unknownFields,
  ];

  return { summary, groups, lines };
}

export type LimsImportResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: FormattedLimsImportError };

export function parseLimsWorklistSafe(
  jsonText: string,
): LimsImportResult<ReturnType<typeof LimsWorklistSchema.parse>> {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch (e) {
    return { ok: false, error: formatLimsImportError(e) };
  }
  const result = LimsWorklistSchema.safeParse(raw);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, error: formatLimsImportError(result.error, raw) };
}