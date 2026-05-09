import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { WorkflowSteps } from "@/components/workflow-steps";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getWorkflowState } from "@/lib/diskdiff-store";
import { findBreakpoint, interpretZone, getActiveVersion, type Interpretation } from "@/lib/eucast-store";
import { ShieldAlert, Microscope, Database, AlertTriangle, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interpret")({ component: InterpretPage });

type Row = {
  id: string;
  antimicrobial: string;
  disk: string;
  zone: number;
  s: number | null;
  r: number | null;
  atu: string;
  result: Interpretation;
  reason: string;
  version: string;
};

function InterpretPage() {
  const { measurements, plateQc, currentPlate } = getWorkflowState();
  const rejected = plateQc?.qcStatus === "Reject image or repeat plate";
  const activeVersion = getActiveVersion();
  const organismName = currentPlate?.organismName ?? "";
  const organismGroup = currentPlate?.organismGroup ?? "";

  const rows: Row[] = useMemo(
    () =>
      measurements.map((m) => {
        const bp = rejected
          ? null
          : findBreakpoint({
              organismName,
              organismGroup,
              antimicrobialName: m.antimicrobialName,
              diskContent: m.diskContent,
            });
        const { result, reason } = rejected
          ? { result: "Manual review required" as Interpretation, reason: "QC rejected; interpretation blocked." }
          : interpretZone(m.zoneDiameterMm, bp);
        return {
          id: m.id,
          antimicrobial: m.antimicrobialName,
          disk: m.diskContent,
          zone: m.zoneDiameterMm,
          s: bp?.s_breakpoint_mm ?? null,
          r: bp?.r_breakpoint_mm ?? null,
          atu:
            bp?.atu_lower_mm != null && bp?.atu_upper_mm != null
              ? `${bp.atu_lower_mm}–${bp.atu_upper_mm}`
              : "—",
          result,
          reason,
          version: bp?.eucast_version ?? activeVersion ?? "—",
        };
      }),
    [measurements, rejected, organismName, organismGroup, activeVersion],
  );

  const counts = rows.reduce(
    (acc, r) => {
      acc[r.result] = (acc[r.result] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Step 04 · Interpretation"
        title="EUCAST Interpretation"
        description="Interpretation uses the active validated EUCAST table. Missing breakpoints are never guessed."
      />
      <WorkflowSteps />

      <div className="grid gap-5 p-6">
        {/* Provenance bar */}
        <Card className="border-border/60 bg-card/60">
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 font-mono text-[11px] uppercase tracking-[0.16em]">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">EUCAST</span>
              <span className="text-foreground">{activeVersion ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Microscope className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Organism</span>
              <span className="text-foreground normal-case tracking-normal italic">
                {organismName || "Not entered"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-warning" />
              <span className="text-warning">Draft · not for clinical release</span>
            </div>
          </CardContent>
        </Card>

        {rejected && (
          <Alert variant="destructive">
            <AlertDescription>Interpretation blocked because plate QC was rejected. Repeat or recapture the plate.</AlertDescription>
          </Alert>
        )}
        {!activeVersion && (
          <Alert variant="destructive">
            <AlertDescription>
              No EUCAST breakpoint available. Upload or activate a validated EUCAST table before interpreting.
            </AlertDescription>
          </Alert>
        )}

        {/* Verdict tiles */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <VerdictTile tone="success" label="Susceptible" value={counts["S"] ?? 0} hint="S" />
          <VerdictTile tone="warning" label="Intermediate" value={counts["I"] ?? 0} hint="I" />
          <VerdictTile tone="destructive" label="Resistant" value={counts["R"] ?? 0} hint="R" />
          <VerdictTile tone="warning" label="ATU review" value={counts["ATU: manual review required"] ?? 0} hint="ATU" />
          <VerdictTile tone="warning" label="Manual review" value={counts["Manual review required"] ?? 0} hint="?" />
          <VerdictTile tone="muted" label="No breakpoint" value={counts["No EUCAST breakpoint available"] ?? 0} hint="—" />
        </div>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <Microscope className="h-7 w-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No measurements to interpret. Add zone readings on Step 03.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Antimicrobial</TableHead>
                    <TableHead>Disk</TableHead>
                    <TableHead className="text-right">Zone</TableHead>
                    <TableHead className="text-right">S ≥</TableHead>
                    <TableHead className="text-right">R &lt;</TableHead>
                    <TableHead>ATU</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.antimicrobial}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.disk}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{r.zone} <span className="text-muted-foreground">mm</span></TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{r.s ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{r.r ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.atu}</TableCell>
                      <TableCell><VerdictBadge value={r.result} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.reason}</TableCell>
                      <TableCell className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{r.version}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function VerdictTile({
  tone,
  label,
  value,
  hint,
}: {
  tone: "success" | "warning" | "destructive" | "muted";
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card/60 p-4",
        tone === "success" && "border-success/30",
        tone === "warning" && "border-warning/30",
        tone === "destructive" && "border-destructive/30",
        tone === "muted" && "border-border/60",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl",
          tone === "success" && "bg-success/20",
          tone === "warning" && "bg-warning/20",
          tone === "destructive" && "bg-destructive/20",
          tone === "muted" && "bg-muted/40",
        )}
      />
      <div className="relative flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-mono text-[10px]",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
            tone === "destructive" && "text-destructive",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      </div>
      <p className="relative mt-2 font-serif text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function VerdictBadge({ value }: { value: Interpretation }) {
  const map = {
    S: { tone: "success", icon: null, label: "S · Susceptible" },
    I: { tone: "warning", icon: null, label: "I · Intermediate" },
    R: { tone: "destructive", icon: null, label: "R · Resistant" },
    "ATU: manual review required": { tone: "warning", icon: AlertTriangle, label: "ATU · review" },
    "Manual review required": { tone: "warning", icon: AlertTriangle, label: "Manual review" },
    "No EUCAST breakpoint available": { tone: "muted", icon: CircleHelp, label: "No breakpoint" },
  } as const;
  const m = map[value];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        m.tone === "success" && "border-success/40 bg-success/10 text-success",
        m.tone === "warning" && "border-warning/50 bg-warning/10 text-warning",
        m.tone === "destructive" && "border-destructive/40 bg-destructive/10 text-destructive",
        m.tone === "muted" && "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {m.label}
    </span>
  );
}
