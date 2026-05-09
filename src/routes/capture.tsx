import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { WorkflowSteps } from "@/components/workflow-steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { createOrUpdatePlateRecord } from "@/lib/diskdiff-store";

export const Route = createFileRoute("/capture")({ component: CapturePage });

const FIELDS = [
  ["accessionNumber", "Accession number"],
  ["patientIdentifier", "Patient identifier"],
  ["specimenType", "Specimen type"],
  ["organismName", "Organism name"],
  ["organismGroup", "Organism group"],
  ["mediumType", "Medium type"],
  ["incubationTemperature", "Incubation temperature"],
  ["incubationAtmosphere", "Incubation atmosphere"],
  ["incubationDurationHours", "Incubation duration (h)"],
  ["inoculumStandard", "Inoculum standard"],
] as const;

function CapturePage() {
  const [file, setFile] = useState<File | null>(null);
  const [savedId, setSavedId] = useState<string>("");
  const [form, setForm] = useState({
    accessionNumber: "",
    patientIdentifier: "",
    specimenType: "",
    organismName: "",
    organismGroup: "",
    plateSizeMm: "90",
    mediumType: "",
    incubationTemperature: "",
    incubationAtmosphere: "",
    incubationDurationHours: "",
    inoculumStandard: "",
    imageUrl: "",
    captureDevice: "",
  });

  return (
    <div>
      <PageHeader
        eyebrow="Step 01 · Capture"
        title="Plate Capture"
        description="Create a draft plate record and attach image metadata. All fields preserved for audit lineage."
      />
      <WorkflowSteps />
      <div className="grid gap-5 p-6">
        <Alert className="border-warning/40 bg-warning/5">
          <AlertDescription className="text-xs">
            Image-assisted disk diffusion reading is for supervised laboratory use. Final AST interpretation requires authorised review.
          </AlertDescription>
        </Alert>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Plate image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <label className="group relative flex h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-background/40 transition-colors hover:border-primary/60 hover:bg-primary/5">
                <div aria-hidden className="absolute inset-0 grid-texture opacity-30" />
                <div className="relative flex flex-col items-center gap-2 text-center">
                  {file ? (
                    <>
                      <ImageIcon className="h-7 w-7 text-primary" />
                      <span className="text-sm font-medium text-foreground">{file.name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} kB · ready
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-7 w-7 text-muted-foreground transition-colors group-hover:text-primary" />
                      <span className="text-sm text-foreground">Drop a plate image or click to select</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">JPEG · PNG · HEIC</span>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
              <Field label="Image URL placeholder">
                <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
              </Field>
              <Field label="Capture device">
                <Input value={form.captureDevice} onChange={(e) => setForm({ ...form, captureDevice: e.target.value })} placeholder="Phone camera · model" />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Plate record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-3 md:grid-cols-2">
                {FIELDS.map(([k, label]) => (
                  <Field key={k} label={label}>
                    <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  </Field>
                ))}
                <Field label="Plate size">
                  <Select value={form.plateSizeMm} onValueChange={(v) => setForm({ ...form, plateSizeMm: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 mm</SelectItem>
                      <SelectItem value="150">150 mm</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                {savedId ? (
                  <span className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-mono uppercase tracking-wider">Draft saved · {savedId.slice(0, 8)}</span>
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Status · unsaved draft</span>
                )}
                <Button
                  onClick={() => {
                    const plate = createOrUpdatePlateRecord({ ...form, plateSizeMm: Number(form.plateSizeMm) as 90 | 150 });
                    setSavedId(plate.id);
                  }}
                >
                  Save draft plate record
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
