import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { WorkflowSteps } from "@/components/workflow-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Ruler } from "lucide-react";
import { addDiskMeasurement, getWorkflowState } from "@/lib/diskdiff-store";

export const Route = createFileRoute("/measure")({ component: MeasurePage });

function MeasurePage() {
  const [tick, setTick] = useState(0);
  const workflow = getWorkflowState();
  const [form, setForm] = useState({
    diskPosition: "",
    antimicrobialName: "",
    diskContent: "",
    zoneDiameterMm: "",
    comment: "",
  });
  const [error, setError] = useState("");

  const plateSize = workflow.currentPlate?.plateSizeMm ?? 90;
  const qcStatus = workflow.plateQc?.qcStatus;
  const measurements = workflow.measurements;
  const tooMany = plateSize === 90 ? measurements.length > 6 : measurements.length > 12;
  const blocked = qcStatus === "Reject image or repeat plate";

  function handleAdd() {
    const z = Number(form.zoneDiameterMm);
    if (Number.isNaN(z)) return setError("Zone diameter must be numeric.");
    if (z < 6) return setError("Zone diameter cannot be below 6 mm.");
    if (z > plateSize) return setError(`Zone diameter cannot exceed plate size (${plateSize} mm).`);
    setError("");
    addDiskMeasurement({
      diskPosition: form.diskPosition,
      antimicrobialName: form.antimicrobialName,
      diskContent: form.diskContent,
      zoneDiameterMm: z,
      measurementMethod: "Manual ruler",
      comment: form.comment,
    });
    setForm({ diskPosition: "", antimicrobialName: "", diskContent: "", zoneDiameterMm: "", comment: "" });
    setTick(tick + 1);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Step 03 · Measurement"
        title="Zone Measurement"
        description="Manual zone entry only. Camera-based automation is future work and will be clearly marked."
        actions={
          <span className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:inline-flex">
            <Ruler className="h-3 w-3 text-primary" />
            Plate · {plateSize} mm
          </span>
        }
      />
      <WorkflowSteps />
      <div className="grid gap-5 p-6">
        {blocked && (
          <Alert variant="destructive">
            <AlertDescription>Measurements blocked: QC status is "Reject image or repeat plate".</AlertDescription>
          </Alert>
        )}
        {qcStatus === "Readable with manual review required" && (
          <Alert className="border-warning/40 bg-warning/5">
            <AlertDescription>QC indicates readable with manual review required — proceed with caution.</AlertDescription>
          </Alert>
        )}
        {tooMany && (
          <Alert className="border-warning/40 bg-warning/5">
            <AlertDescription>Disk count exceeds recommended limit for {plateSize} mm plate.</AlertDescription>
          </Alert>
        )}

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Manual entry · Manual ruler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 md:grid-cols-5">
              <Field label="Position">
                <Input value={form.diskPosition} onChange={(e) => setForm({ ...form, diskPosition: e.target.value })} placeholder="e.g. 1" />
              </Field>
              <Field label="Antimicrobial" className="md:col-span-2">
                <Input value={form.antimicrobialName} onChange={(e) => setForm({ ...form, antimicrobialName: e.target.value })} />
              </Field>
              <Field label="Disk content">
                <Input value={form.diskContent} onChange={(e) => setForm({ ...form, diskContent: e.target.value })} placeholder="e.g. 30 µg" />
              </Field>
              <Field label="Zone diameter (mm)">
                <Input
                  inputMode="decimal"
                  value={form.zoneDiameterMm}
                  onChange={(e) => setForm({ ...form, zoneDiameterMm: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Comment">
              <Input value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Optional reading notes…" />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end">
              <Button disabled={blocked} onClick={handleAdd} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add measurement
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="flex-row items-center justify-between border-b border-border/40 space-y-0">
            <CardTitle className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Current measurements</CardTitle>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{measurements.length} disks</span>
          </CardHeader>
          <CardContent className="p-0">
            {measurements.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Ruler className="h-7 w-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No measurements recorded yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Antimicrobial</TableHead>
                    <TableHead>Disk</TableHead>
                    <TableHead className="text-right">Zone (mm)</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurements.map((m) => (
                    <TableRow key={m.id + tick}>
                      <TableCell className="font-mono text-xs">{m.diskPosition || "—"}</TableCell>
                      <TableCell className="font-medium">{m.antimicrobialName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{m.diskContent}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{m.zoneDiameterMm}</TableCell>
                      <TableCell className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{m.measurementMethod}</TableCell>
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

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
