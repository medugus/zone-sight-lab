import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ImportedWorklistSummaryCard } from "@/components/imported-worklist-summary-card";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import {
  createOrUpdatePlateRecord,
  getWorkflowState,
  importLimsWorklistJson,
  LimsImportError,
  saveDiscLayoutItem,
  type PlateRecord,
} from "@/lib/diskdiff-store";
import type { FormattedLimsImportError } from "@/lib/schemas/format-lims-import-error";

export const Route = createFileRoute("/capture")({ component: CapturePage });

function CapturePage() {
  const workflow = getWorkflowState();
  const [file, setFile] = useState<File | null>(null);
  const [saved, setSaved] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<FormattedLimsImportError | null>(null);
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState(() => plateToCaptureForm(workflow.currentPlate));

  const discLayout = useMemo(() => getWorkflowState().discLayout, [tick]);

  return (
    <div>
      <PageHeader
        title="Plate Capture"
        description="Create a draft plate record and attach image metadata."
      />
      <div className="grid gap-4 p-6">
        <Alert>
          <AlertDescription>
            Draft: not for clinical release. Image-assisted disk diffusion reading is for supervised
            laboratory use. Final AST interpretation requires authorised review.
          </AlertDescription>
        </Alert>
        <Alert>
          <AlertDescription>
            In LIS-connected mode, DiskDiff Reader sends zone measurements and audit metadata. Final
            interpretation, expert rules, AMS governance, validation, and report release remain in
            the LIS unless explicitly configured otherwise.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import LIMS Worklist JSON</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste Medugu LIMS worklist JSON"
            />
            <Button
              onClick={() => {
                try {
                  const plate = importLimsWorklistJson(importText);
                  setForm(plateToCaptureForm(plate));
                  setImportMsg(`Imported worklist for accession ${plate.accessionNumber || "N/A"}`);
                  setImportError(null);
                  setTick((n) => n + 1);
                } catch (error) {
                  if (error instanceof LimsImportError) {
                    setImportError(error.formatted);
                    setImportMsg("");
                  } else {
                    setImportError(null);
                    setImportMsg(`Import failed: ${(error as Error).message}`);
                  }
                }
              }}
            >
              Import LIMS Worklist JSON
            </Button>
            {importMsg && <p className="text-xs text-muted-foreground">{importMsg}</p>}
            {importError && <ImportErrorSummary error={importError} />}
          </CardContent>
        </Card>

        <ImportedWorklistSummaryCard workflow={workflow} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plate image metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/40 hover:bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="mt-2 text-sm text-muted-foreground">
                  {file ? file.name : "Click to select plate image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <Field label="imageUrl">
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </Field>
              <Field label="captureDevice">
                <Input
                  value={form.captureDevice}
                  onChange={(e) => setForm({ ...form, captureDevice: e.target.value })}
                />
              </Field>
              <Field label="plateBarcode">
                <Input
                  value={form.plateBarcode}
                  onChange={(e) => setForm({ ...form, plateBarcode: e.target.value })}
                />
              </Field>
              <Field label="imageQualityStatus">
                <Select
                  value={form.imageQualityStatus}
                  onValueChange={(v) =>
                    setForm({ ...form, imageQualityStatus: v as typeof form.imageQualityStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acceptable">acceptable</SelectItem>
                    <SelectItem value="needs_review">needs_review</SelectItem>
                    <SelectItem value="rejected">rejected</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plate record</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {Object.entries(form)
                .filter(
                  ([k]) =>
                    ![
                      "imageUrl",
                      "captureDevice",
                      "plateBarcode",
                      "imageQualityStatus",
                      "plateSizeMm",
                    ].includes(k),
                )
                .map(([k, v]) => (
                  <Field key={k} label={k}>
                    <Input value={v} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  </Field>
                ))}
              <Field label="plateSizeMm">
                <Select
                  value={form.plateSizeMm}
                  onValueChange={(v) => setForm({ ...form, plateSizeMm: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90</SelectItem>
                    <SelectItem value="150">150</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Button
                onClick={() => {
                  const plate = createOrUpdatePlateRecord({
                    ...form,
                    plateSizeMm: Number(form.plateSizeMm) as 90 | 150,
                  });
                  setSaved(`Saved draft plate ${plate.id}`);
                }}
              >
                Save draft plate record
              </Button>
              {saved && <p className="text-xs text-muted-foreground">{saved}</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disc Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {discLayout.map((d) => (
              <div key={d.id} className="grid gap-2 md:grid-cols-4">
                <Input
                  value={d.diskPosition}
                  onChange={(e) => saveDiscLayoutItem({ ...d, diskPosition: e.target.value })}
                  placeholder="diskPosition"
                />
                <Input
                  value={d.antibioticCode}
                  onChange={(e) => saveDiscLayoutItem({ ...d, antibioticCode: e.target.value })}
                  placeholder="antibioticCode"
                />
                <Input
                  value={d.antibioticName}
                  onChange={(e) => saveDiscLayoutItem({ ...d, antibioticName: e.target.value })}
                  placeholder="antibioticName"
                />
                <Input
                  value={d.discPotency}
                  onChange={(e) => saveDiscLayoutItem({ ...d, discPotency: e.target.value })}
                  placeholder="discPotency"
                />
                <Input
                  value={d.discLot}
                  onChange={(e) => saveDiscLayoutItem({ ...d, discLot: e.target.value })}
                  placeholder="discLot"
                />
                <Input
                  value={d.discExpiryDate}
                  onChange={(e) => saveDiscLayoutItem({ ...d, discExpiryDate: e.target.value })}
                  placeholder="discExpiryDate"
                />
                <Select
                  value={String(d.expectedOnPlate)}
                  onValueChange={(v) => saveDiscLayoutItem({ ...d, expectedOnPlate: v === "true" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">expectedOnPlate: true</SelectItem>
                    <SelectItem value="false">expectedOnPlate: false</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                saveDiscLayoutItem({
                  diskPosition: "",
                  antibioticCode: "",
                  antibioticName: "",
                  discPotency: "",
                  discLot: "",
                  discExpiryDate: "",
                  expectedOnPlate: true,
                });
                setTick((n) => n + 1);
              }}
            >
              Add disc layout item
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ImportErrorSummary({ error }: { error: FormattedLimsImportError }) {
  const sections: Array<{ key: keyof FormattedLimsImportError["groups"]; title: string }> = [
    { key: "schemaVersion", title: "Wrong schema version" },
    { key: "wrapper", title: "Wrong wrapper shape" },
    { key: "missing", title: "Missing required fields" },
    { key: "wrongType", title: "Wrong nullability or type" },
    { key: "unknownFields", title: "Wrong field names / unrecognised fields" },
  ];
  return (
    <div
      role="alert"
      aria-label="LIMS Worklist import validation summary"
      data-testid="lims-import-error-summary"
      className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
    >
      <p className="font-medium text-destructive">{error.summary}</p>
      <div className="mt-2 space-y-2">
        {sections.map(({ key, title }) => {
          const items = error.groups[key];
          if (items.length === 0) return null;
          return (
            <div key={key} data-testid={`lims-import-error-group-${key}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive/90">
                {title} ({items.length})
              </p>
              <ul className="ml-4 list-disc text-xs text-foreground/80">
                {items.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        Schema is strict. Fix the payload upstream — the importer will not coerce fields.
      </p>
    </div>
  );
}

function plateToCaptureForm(plate: PlateRecord | null) {
  return {
    accessionNumber: plate?.accessionNumber ?? "",
    patientIdentifier: plate?.patientIdentifier ?? "",
    specimenType: plate?.specimenType ?? "",
    organismName: plate?.organismName ?? "",
    organismGroup: plate?.organismGroup ?? "",
    plateSizeMm: String(plate?.plateSizeMm ?? 90),
    mediumType: plate?.mediumType ?? "",
    incubationTemperature: plate?.incubationTemperature ?? "",
    incubationAtmosphere: plate?.incubationAtmosphere ?? "",
    incubationDurationHours: plate?.incubationDurationHours ?? "",
    inoculumStandard: plate?.inoculumStandard ?? "",
    imageUrl: plate?.imageUrl ?? "",
    captureDevice: plate?.captureDevice ?? "",
    plateBarcode: plate?.plateBarcode ?? "",
    imageQualityStatus: plate?.imageQualityStatus ?? "acceptable",
    operatingMode: plate?.operatingMode ?? "standalone",
    interpretationAuthority: plate?.interpretationAuthority ?? "measurement_only",
    worklistId: plate?.worklistId ?? "",
    isolateId: plate?.isolateId ?? "",
    externalLisAccessionId: plate?.externalLisAccessionId ?? "",
    externalLisIsolateId: plate?.externalLisIsolateId ?? "",
    organismCode: plate?.organismCode ?? "",
    astPanelId: plate?.astPanelId ?? "",
    astPanelName: plate?.astPanelName ?? "",
    standard: plate?.standard ?? "EUCAST",
    mediumLot: plate?.mediumLot ?? "",
    createdBy: plate?.createdBy ?? "",
  };
}
