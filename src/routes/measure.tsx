import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addDiskMeasurement, getWorkflowState } from "@/lib/diskdiff-store";

export const Route = createFileRoute("/measure")({ component: MeasurePage });

function MeasurePage() {
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const workflow = getWorkflowState();
  const plateSize = workflow.currentPlate?.plateSizeMm ?? 90;
  const blocked = workflow.plateQc?.qcStatus === "Reject image or repeat plate";
  const [form, setForm] = useState({
    diskPosition: "",
    antimicrobialName: "",
    diskContent: "",
    zoneDiameterMm: "",
    comment: "",
    antibioticCode: "",
    readerConfidence: "manual",
    measurementSource: "manual_entry",
    reviewStatus: "accepted",
    manualEdited: "false",
    overrideReason: "",
  });

  const measurements = getWorkflowState().measurements;

  return (
    <div>
      <PageHeader title="Zone Measurement" description="Manual zone entry only." />
      <div className="grid gap-4 p-6">
        {blocked && <Alert variant="destructive"><AlertDescription>Measurements blocked: QC status is Reject image or repeat plate.</AlertDescription></Alert>}
        <Card>
          <CardHeader><CardTitle className="text-base">Manual zone entry</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {(["diskPosition", "antimicrobialName", "diskContent", "zoneDiameterMm", "comment", "antibioticCode", "overrideReason"] as const).map((key) => (
              <Input key={key} placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            ))}
            <Select value={form.readerConfidence} onValueChange={(v) => setForm({ ...form, readerConfidence: v })}>
              <SelectTrigger><SelectValue placeholder="readerConfidence" /></SelectTrigger>
              <SelectContent><SelectItem value="high">high</SelectItem><SelectItem value="medium">medium</SelectItem><SelectItem value="low">low</SelectItem><SelectItem value="manual">manual</SelectItem></SelectContent>
            </Select>
            <Select value={form.measurementSource} onValueChange={(v) => setForm({ ...form, measurementSource: v })}>
              <SelectTrigger><SelectValue placeholder="measurementSource" /></SelectTrigger>
              <SelectContent><SelectItem value="auto_reader">auto_reader</SelectItem><SelectItem value="manual_entry">manual_entry</SelectItem><SelectItem value="reader_then_manual">reader_then_manual</SelectItem><SelectItem value="imported">imported</SelectItem></SelectContent>
            </Select>
            <Select value={form.reviewStatus} onValueChange={(v) => setForm({ ...form, reviewStatus: v })}>
              <SelectTrigger><SelectValue placeholder="reviewStatus" /></SelectTrigger>
              <SelectContent><SelectItem value="pending">pending</SelectItem><SelectItem value="accepted">accepted</SelectItem><SelectItem value="rejected">rejected</SelectItem><SelectItem value="needs_repeat">needs_repeat</SelectItem></SelectContent>
            </Select>
            <Select value={form.manualEdited} onValueChange={(v) => setForm({ ...form, manualEdited: v })}>
              <SelectTrigger><SelectValue placeholder="manualEdited" /></SelectTrigger>
              <SelectContent><SelectItem value="false">false</SelectItem><SelectItem value="true">true</SelectItem></SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={blocked} onClick={() => {
              const zone = Number(form.zoneDiameterMm);
              if (Number.isNaN(zone)) return setError("zone diameter must be numeric");
              if (zone < 6) return setError("zone diameter must be >=6 mm");
              if (zone > plateSize) return setError("zone diameter must be <= plate size");
              setError("");
              addDiskMeasurement({
                diskPosition: form.diskPosition,
                antimicrobialName: form.antimicrobialName,
                diskContent: form.diskContent,
                zoneDiameterMm: zone,
                measurementMethod: "Manual ruler",
                comment: form.comment,
                antibioticCode: form.antibioticCode,
                antibioticName: form.antimicrobialName,
                discPotency: form.diskContent,
                readerConfidence: form.readerConfidence as "high" | "medium" | "low" | "manual",
                measurementSource: form.measurementSource as "auto_reader" | "manual_entry" | "reader_then_manual" | "imported",
                manualEdited: form.manualEdited === "true",
                originalValue: null,
                correctedValue: null,
                overrideReason: form.overrideReason,
                reviewedBy: "",
                reviewedAt: "",
                reviewStatus: form.reviewStatus as "pending" | "accepted" | "rejected" | "needs_repeat",
              });
              setRefresh((n) => n + 1);
            }}>Add measurement</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Current measurements</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>diskPosition</TableHead><TableHead>antibioticCode</TableHead><TableHead>antibioticName</TableHead><TableHead>zoneDiameterMm</TableHead><TableHead>readerConfidence</TableHead><TableHead>measurementSource</TableHead><TableHead>reviewStatus</TableHead></TableRow></TableHeader>
              <TableBody>
                {measurements.map((m) => (
                  <TableRow key={`${m.id}-${refresh}`}><TableCell>{m.diskPosition}</TableCell><TableCell>{m.antibioticCode}</TableCell><TableCell>{m.antibioticName || m.antimicrobialName}</TableCell><TableCell>{m.zoneDiameterMm}</TableCell><TableCell>{m.readerConfidence}</TableCell><TableCell>{m.measurementSource}</TableCell><TableCell>{m.reviewStatus}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
