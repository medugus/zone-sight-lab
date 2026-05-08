export type BreakpointRow = {
  eucast_version: string;
  organism_name: string;
  organism_group: string;
  antimicrobial_name: string;
  disk_content: string;
  s_breakpoint_mm: number | null;
  r_breakpoint_mm: number | null;
  atu_lower_mm: number | null;
  atu_upper_mm: number | null;
  notes: string;
  source_reference: string;
};

export type Interpretation =
  | "S"
  | "I"
  | "R"
  | "Manual review required"
  | "ATU: manual review required"
  | "No EUCAST breakpoint available";

const STORAGE_KEY = "diskdiff_eucast_breakpoints_v1";
const ACTIVE_KEY = "diskdiff_eucast_active_version_v1";

export const REQUIRED_COLUMNS = [
  "eucast_version",
  "organism_name",
  "organism_group",
  "antimicrobial_name",
  "disk_content",
  "s_breakpoint_mm",
  "r_breakpoint_mm",
  "atu_lower_mm",
  "atu_upper_mm",
  "notes",
  "source_reference",
] as const;

export type ParseResult =
  | { ok: true; rows: BreakpointRow[]; version: string }
  | { ok: false; error: string };

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = "";
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseNumOrNull(v: string): number | null {
  if (v === "" || v.toLowerCase() === "null" || v === "-") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseEucastCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { ok: false, error: "CSV must contain a header row and at least one data row." };

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return { ok: false, error: `Missing required columns: ${missing.join(", ")}` };
  }

  const idx = (col: string) => header.indexOf(col);
  const rows: BreakpointRow[] = [];
  let version = "";

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    if (cells.length < REQUIRED_COLUMNS.length) {
      return { ok: false, error: `Row ${i + 1}: expected ${REQUIRED_COLUMNS.length} columns, got ${cells.length}.` };
    }
    const row: BreakpointRow = {
      eucast_version: cells[idx("eucast_version")],
      organism_name: cells[idx("organism_name")],
      organism_group: cells[idx("organism_group")],
      antimicrobial_name: cells[idx("antimicrobial_name")],
      disk_content: cells[idx("disk_content")],
      s_breakpoint_mm: parseNumOrNull(cells[idx("s_breakpoint_mm")]),
      r_breakpoint_mm: parseNumOrNull(cells[idx("r_breakpoint_mm")]),
      atu_lower_mm: parseNumOrNull(cells[idx("atu_lower_mm")]),
      atu_upper_mm: parseNumOrNull(cells[idx("atu_upper_mm")]),
      notes: cells[idx("notes")] ?? "",
      source_reference: cells[idx("source_reference")] ?? "",
    };
    if (!row.eucast_version || !row.organism_name || !row.antimicrobial_name || !row.disk_content) {
      return { ok: false, error: `Row ${i + 1}: required identifying fields cannot be empty.` };
    }
    if (!version) version = row.eucast_version;
    rows.push(row);
  }

  return { ok: true, rows, version };
}

export function saveBreakpoints(rows: BreakpointRow[], version: string) {
  if (typeof window === "undefined") return;
  const existing = loadAllBreakpoints();
  const filtered = existing.filter((r) => r.eucast_version !== version);
  const next = [...filtered, ...rows];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.localStorage.setItem(ACTIVE_KEY, version);
}

export function loadAllBreakpoints(): BreakpointRow[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BreakpointRow[];
  } catch {
    return [];
  }
}

export function getActiveVersion(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveVersion(version: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_KEY, version);
}

export function listAvailableVersions(): string[] {
  const all = loadAllBreakpoints();
  return Array.from(new Set(all.map((r) => r.eucast_version))).sort();
}

export function loadActiveBreakpoints(): BreakpointRow[] {
  const v = getActiveVersion();
  if (!v) return [];
  return loadAllBreakpoints().filter((r) => r.eucast_version === v);
}

export function findBreakpoint(opts: {
  organismName: string;
  organismGroup?: string;
  antimicrobialName: string;
  diskContent: string;
}): BreakpointRow | null {
  const rows = loadActiveBreakpoints();
  const norm = (s: string) => (s || "").trim().toLowerCase();
  const target = {
    name: norm(opts.organismName),
    group: norm(opts.organismGroup || ""),
    am: norm(opts.antimicrobialName),
    disk: norm(opts.diskContent),
  };
  // Prefer organism name match, fallback to group match
  const byName = rows.find(
    (r) =>
      norm(r.organism_name) === target.name &&
      norm(r.antimicrobial_name) === target.am &&
      norm(r.disk_content) === target.disk,
  );
  if (byName) return byName;
  if (target.group) {
    const byGroup = rows.find(
      (r) =>
        norm(r.organism_group) === target.group &&
        norm(r.antimicrobial_name) === target.am &&
        norm(r.disk_content) === target.disk,
    );
    if (byGroup) return byGroup;
  }
  return null;
}

export function interpretZone(zoneMm: number, bp: BreakpointRow | null): {
  result: Interpretation;
  reason: string;
} {
  if (!bp) {
    return {
      result: "No EUCAST breakpoint available",
      reason: "No EUCAST breakpoint available. Upload or activate a validated EUCAST table.",
    };
  }
  if (bp.atu_lower_mm != null && bp.atu_upper_mm != null && zoneMm >= bp.atu_lower_mm && zoneMm <= bp.atu_upper_mm) {
    return { result: "ATU: manual review required", reason: "ATU: manual review required." };
  }
  if (bp.s_breakpoint_mm == null || bp.r_breakpoint_mm == null) {
    return { result: "Manual review required", reason: "Manual review required: breakpoint rule needs verification." };
  }
  if (bp.s_breakpoint_mm < bp.r_breakpoint_mm) {
    return { result: "Manual review required", reason: "Manual review required: breakpoint rule needs verification." };
  }
  if (zoneMm >= bp.s_breakpoint_mm) return { result: "S", reason: `Zone ≥ S breakpoint (${bp.s_breakpoint_mm} mm)` };
  if (zoneMm < bp.r_breakpoint_mm) return { result: "R", reason: `Zone < R breakpoint (${bp.r_breakpoint_mm} mm)` };
  return { result: "I", reason: `Zone between R (${bp.r_breakpoint_mm}) and S (${bp.s_breakpoint_mm}) mm` };
}
