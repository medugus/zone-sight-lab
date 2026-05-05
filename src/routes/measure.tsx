import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addDiskMeasurement, getWorkflowState } from "@/lib/diskdiff-store";

export const Route = createFileRoute("/measure")({ component: MeasurePage });

function MeasurePage() {
  const workflow = getWorkflowState();
  const [form, setForm] = useState({ diskPosition: "", antimicrobialName: "", diskContent: "", zoneDiameterMm: "", comment: "" });
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const plateSize = workflow.currentPlate?.plateSizeMm ?? 90;
  const qcStatus = workflow.plateQc?.qcStatus;
  const tooMany = plateSize === 90 ? workflow.measurements.length > 6 : workflow.measurements.length > 12;

  const blocked = qcStatus === "Reject image or repeat plate";

  return <div>
    <PageHeader title="Zone Measurement" description="Manual zone entry only. Camera-based automation is future work." />
    <div className="p-6 grid gap-4">
      {blocked && <Alert variant="destructive"><AlertDescription>Measurements blocked: QC status is Reject image or repeat plate.</AlertDescription></Alert>}
      {qcStatus === "Readable with manual review required" && <Alert><AlertDescription>QC indicates readable with manual review required; proceed with caution.</AlertDescription></Alert>}
      {tooMany && <Alert><AlertDescription>Disk count warning for selected plate size.</AlertDescription></Alert>}
      <Card><CardHeader><CardTitle className="text-base">Manual entry (Manual ruler)</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 md:grid-cols-2">{(["diskPosition","antimicrobialName","diskContent","zoneDiameterMm","comment"] as const).map((k)=><Input key={k} placeholder={k} value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} />)}</div>{error && <p className="text-sm text-destructive">{error}</p>}<Button disabled={blocked} onClick={()=>{const z=Number(form.zoneDiameterMm); if(Number.isNaN(z)){setError("zone diameter must be numeric");return;} if(z<6){setError("zone diameter cannot be below 6 mm");return;} if(z>plateSize){setError("zone diameter cannot exceed selected plate size");return;} setError(""); addDiskMeasurement({diskPosition:form.diskPosition, antimicrobialName:form.antimicrobialName, diskContent:form.diskContent, zoneDiameterMm:z, measurementMethod:"Manual ruler", comment:form.comment}); setForm({ diskPosition: "", antimicrobialName: "", diskContent: "", zoneDiameterMm: "", comment: "" }); setTick(tick+1);}}>Add measurement</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Current measurements</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Position</TableHead><TableHead>Antimicrobial</TableHead><TableHead>Disk</TableHead><TableHead>Zone</TableHead><TableHead>Method</TableHead></TableRow></TableHeader><TableBody>{getWorkflowState().measurements.map((m)=><TableRow key={m.id+tick}><TableCell>{m.diskPosition}</TableCell><TableCell>{m.antimicrobialName}</TableCell><TableCell>{m.diskContent}</TableCell><TableCell>{m.zoneDiameterMm} mm</TableCell><TableCell>{m.measurementMethod}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  </div>;
}
