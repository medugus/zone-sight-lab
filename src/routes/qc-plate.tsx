import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { WorkflowSteps } from "@/components/workflow-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { savePlateQc } from "@/lib/diskdiff-store";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/qc-plate")({ component: PlateQC });

const labels = {
  entirePlateVisible: "Entire plate visible",
  imageNotBlurred: "Image not blurred",
  lightingAcceptable: "Lighting acceptable",
  noMajorReflection: "No major reflection",
  agarSurfaceIntact: "Agar surface intact",
  noExcessMoisture: "No excessive moisture",
  noObviousContamination: "No obvious contamination",
  lawnAcceptable: "Growth lawn acceptable",
  disksVisible: "Disks visible",
  disksNotDisplaced: "Disks not displaced",
  zonesNotExcessivelyOverlapping: "Zones not excessively overlapping",
  correctMediumSelected: "Correct medium selected",
  incubationConditionEntered: "Incubation condition entered",
} as const;

const criticalKeys = [
  "entirePlateVisible",
  "imageNotBlurred",
  "agarSurfaceIntact",
  "noObviousContamination",
  "lawnAcceptable",
  "disksVisible",
  "zonesNotExcessivelyOverlapping",
  "correctMediumSelected",
  "incubationConditionEntered",
] as const;

function PlateQC() {
  const [state, setState] = useState<Record<keyof typeof labels, boolean>>(
    Object.fromEntries(Object.keys(labels).map((k) => [k, false])) as Record<keyof typeof labels, boolean>,
  );
  const [qcComment, setQcComment] = useState("");
  const [saved, setSaved] = useState(false);

  const qcStatus = useMemo(() => {
    const criticalFailed = criticalKeys.some((k) => !state[k]);
    if (criticalFailed) return "Reject image or repeat plate" as const;
    const allPass = Object.values(state).every(Boolean);
    if (allPass) return "Acceptable for automated reading" as const;
    return "Readable with manual review required" as const;
  }, [state]);

  const passedCount = Object.values(state).filter(Boolean).length;
  const totalCount = Object.keys(labels).length;

  const verdict =
    qcStatus === "Acceptable for automated reading"
      ? { tone: "success", icon: CheckCircle2, label: "Acceptable", note: "All checks pass — proceed to measurement." }
      : qcStatus === "Readable with manual review required"
        ? { tone: "warning", icon: AlertTriangle, label: "Manual review required", note: "Non-critical checks failing. Proceed with caution." }
        : { tone: "destructive", icon: XCircle, label: "Reject", note: "Critical failure — repeat plate or recapture image." };

  const VerdictIcon = verdict.icon;

  return (
    <div>
      <PageHeader
        eyebrow="Step 02 · Quality control"
        title="Plate QC"
        description="Run the plate and image quality checklist before manual measurement. Critical failures block downstream interpretation."
      />
      <WorkflowSteps />
      <div className="grid gap-5 p-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="flex-row items-center justify-between border-b border-border/40 space-y-0">
            <CardTitle className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Quality checklist</CardTitle>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {passedCount}/{totalCount} passing
            </span>
          </CardHeader>
          <CardContent className="p-2">
            <ul className="divide-y divide-border/40">
              {(Object.keys(labels) as Array<keyof typeof labels>).map((k) => {
                const isCritical = (criticalKeys as readonly string[]).includes(k);
                const checked = state[k];
                return (
                  <li key={k} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent/30">
                    <Checkbox
                      id={k}
                      checked={checked}
                      onCheckedChange={(v) => setState({ ...state, [k]: Boolean(v) })}
                    />
                    <label htmlFor={k} className="flex-1 cursor-pointer text-sm">
                      {labels[k]}
                    </label>
                    {isCritical && (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]",
                          checked
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-destructive/40 bg-destructive/10 text-destructive",
                        )}
                      >
                        Critical
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card
            className={cn(
              "overflow-hidden border-2 bg-card/60 transition-colors",
              verdict.tone === "success" && "border-success/40",
              verdict.tone === "warning" && "border-warning/50",
              verdict.tone === "destructive" && "border-destructive/50",
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                    verdict.tone === "success" && "bg-success/15 text-success",
                    verdict.tone === "warning" && "bg-warning/20 text-warning",
                    verdict.tone === "destructive" && "bg-destructive/15 text-destructive",
                  )}
                >
                  <VerdictIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">QC Verdict</p>
                  <h3 className="mt-1 font-serif text-2xl font-bold tracking-tight">{verdict.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{verdict.note}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">QC notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <Textarea
                value={qcComment}
                onChange={(e) => setQcComment(e.target.value)}
                placeholder="Document failures, deviations, or repeat criteria…"
                rows={5}
              />
              <div className="flex items-center justify-between">
                {saved && (
                  <span className="flex items-center gap-1.5 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="font-mono uppercase tracking-wider">QC saved</span>
                  </span>
                )}
                <Button
                  className="ml-auto"
                  onClick={() => {
                    savePlateQc({ ...state, qcComment, qcStatus });
                    setSaved(true);
                  }}
                >
                  Save QC result
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
