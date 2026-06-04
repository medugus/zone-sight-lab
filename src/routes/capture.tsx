import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { createOrUpdatePlateRecord, getWorkflowState, importLimsWorklistJson, saveDiscLayoutItem } from "@/lib/diskdiff-store";

export const Route = createFileRoute("/capture")({ component: CapturePage });

function CapturePage() {
  const workflow = getWorkflowState();
  const [file, setFile] = useState<File | null>(null);
  const [saved, setSaved] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importText, setImportText] = useState("");
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState({
    accessionNumber: workflow.currentPlate?.accessionNumber ?? "",
    patientIdentifier: workflow.currentPlate?.patientIdentifier ?? "",
    specimenType: workflow.currentPlate?.specimenType ?? "",
    organismName: workflow.currentPlate?.organismName ?? "",
    organismGroup: workflow.currentPlate?.organismGroup ?? "",
    plateSizeMm: String(workflow.currentPlate?.plateSizeMm ?? 90),
    mediumType: workflow.currentPlate?.mediumType ?? "",
    incubationTemperature: workflow.currentPlate?.incubationTemperature ?? "",
    incubationAtmosphere: workflow.currentPlate?.incubationAtmosphere ?? "",
    incubationDurationHours: workflow.currentPlate?.incubationDurationHours ?? "",
    inoculumStandard: workflow.currentPlate?.inoculumStandard ?? "",
    imageUrl: workflow.currentPlate?.imageUrl ?? "",
    captureDevice: workflow.currentPlate?.captureDevice ?? "",
    plateBarcode: workflow.currentPlate?.plateBarcode ?? "",
    imageQualityStatus: workflow.currentPlate?.imageQualityStatus ?? "acceptable",
    operatingMode: workflow.currentPlate?.operatingMode ?? "standalone",
    interpretationAuthority: workflow.currentPlate?.interpretationAuthority ?? "measurement_only",
    worklistId: workflow.currentPlate?.worklistId ?? "",
    isolateId: workflow.currentPlate?.isolateId ?? "",
    externalLisAccessionId: workflow.currentPlate?.externalLisAccessionId ?? "",
    externalLisIsolateId: workflow.currentPlate?.externalLisIsolateId ?? "",
    organismCode: workflow.currentPlate?.organismCode ?? "",
    astPanelId: workflow.currentPlate?.astPanelId ?? "",
    astPanelName: workflow.currentPlate?.astPanelName ?? "",
    standard: workflow.currentPlate?.standard ?? "EUCAST",
    mediumLot: workflow.currentPlate?.mediumLot ?? "",
    createdBy: workflow.currentPlate?.createdBy ?? "",
  });

  const discLayout = useMemo(() => getWorkflowState().discLayout, [tick]);

  return (
    <div>
      <PageHeader title="Plate Capture" description="Create a draft plate record and attach image metadata." />
      <div className="grid gap-4 p-6">
        <Alert>
          <AlertDescription>
            Draft: not for clinical release. Image-assisted disk diffusion reading is for supervised laboratory use. Final AST interpretation requires authorised review.
          </AlertDescription>
        </Alert>
        <Alert>
          <AlertDescription>
            In LIS-connected mode, DiskDiff Reader sends zone measurements and audit metadata. Final interpretation, expert rules, AMS governance, validation, and report release remain in the LIS unless explicitly configured otherwise.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader><CardTitle className="text-base">Import LIMS Worklist JSON</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste Medugu LIMS worklist JSON" />
            <Button onClick={() => {
              try {
                const plate = importLimsWorklistJson(importText);
                setImportMsg(`Imported worklist for accession ${plate.accessionNumber || "N/A"}`);
                setTick((n) => n + 1);
              } catch (error) {
                setImportMsg(`Import failed: ${(error as Error).message}`);
              }
            }}>Import LIMS Worklist JSON</Button>
            {importMsg && <p className="text-xs text-muted-foreground">{importMsg}</p>}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Plate image metadata</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/40 hover:bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="mt-2 text-sm text-muted-foreground">{file ? file.name : "Click to select plate image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
              <Field label="imageUrl"><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field>
              <Field label="captureDevice"><Input value={form.captureDevice} onChange={(e) => setForm({ ...form, captureDevice: e.target.value })} /></Field>
              <Field label="plateBarcode"><Input value={form.plateBarcode} onChange={(e) => setForm({ ...form, plateBarcode: e.target.value })} /></Field>
              <Field label="imageQualityStatus">
                <Select value={form.imageQualityStatus} onValueChange={(v) => setForm({ ...form, imageQualityStatus: v as typeof form.imageQualityStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="acceptable">acceptable</SelectItem><SelectItem value="needs_review">needs_review</SelectItem><SelectItem value="rejected">rejected</SelectItem></SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Plate record</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {Object.entries(form).filter(([k]) => !["imageUrl","captureDevice","plateBarcode","imageQualityStatus","plateSizeMm"].includes(k)).map(([k, v]) => (
                <Field key={k} label={k}><Input value={v} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></Field>
              ))}
              <Field label="plateSizeMm">
                <Select value={form.plateSizeMm} onValueChange={(v) => setForm({ ...form, plateSizeMm: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="90">90</SelectItem><SelectItem value="150">150</SelectItem></SelectContent>
                </Select>
              </Field>
              <Button onClick={() => {
                const plate = createOrUpdatePlateRecord({ ...form, plateSizeMm: Number(form.plateSizeMm) as 90 | 150 });
                setSaved(`Saved draft plate ${plate.id}`);
              }}>Save draft plate record</Button>
              {saved && <p className="text-xs text-muted-foreground">{saved}</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Disc Layout</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {discLayout.map((d) => (
              <div key={d.id} className="grid gap-2 md:grid-cols-4">
                <Input value={d.diskPosition} onChange={(e) => saveDiscLayoutItem({ ...d, diskPosition: e.target.value })} placeholder="diskPosition" />
                <Input value={d.antibioticCode} onChange={(e) => saveDiscLayoutItem({ ...d, antibioticCode: e.target.value })} placeholder="antibioticCode" />
                <Input value={d.antibioticName} onChange={(e) => saveDiscLayoutItem({ ...d, antibioticName: e.target.value })} placeholder="antibioticName" />
                <Input value={d.discPotency} onChange={(e) => saveDiscLayoutItem({ ...d, discPotency: e.target.value })} placeholder="discPotency" />
                <Input value={d.discLot} onChange={(e) => saveDiscLayoutItem({ ...d, discLot: e.target.value })} placeholder="discLot" />
                <Input value={d.discExpiryDate} onChange={(e) => saveDiscLayoutItem({ ...d, discExpiryDate: e.target.value })} placeholder="discExpiryDate" />
                <Select value={String(d.expectedOnPlate)} onValueChange={(v) => saveDiscLayoutItem({ ...d, expectedOnPlate: v === "true" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="true">expectedOnPlate: true</SelectItem><SelectItem value="false">expectedOnPlate: false</SelectItem></SelectContent>
                </Select>
              </div>
            ))}
            <Button variant="outline" onClick={() => { saveDiscLayoutItem({ diskPosition: "", antibioticCode: "", antibioticName: "", discPotency: "", discLot: "", discExpiryDate: "", expectedOnPlate: true }); setTick((n) => n + 1); }}>Add disc layout item</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
