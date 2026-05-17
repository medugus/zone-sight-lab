import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWorkflowState, generateDraftReportText, exportZoneResultJson, validateZoneResultExport } from "@/lib/diskdiff-store";
export const Route = createFileRoute("/reports")({ component: ReportsPage });
function ReportsPage() {
  const { currentPlate } = getWorkflowState();
  const [zoneJson, setZoneJson] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  return <div><PageHeader title="Reports" description="Draft report generation only. Final release requires authorised review." /><div className="p-6 space-y-4"><Card><CardHeader><CardTitle className="text-base">Draft report</CardTitle></CardHeader><CardContent className="space-y-3"><Badge variant="outline">Draft: not for clinical release</Badge><p className="text-sm text-muted-foreground">Current plate: {currentPlate?.accessionNumber ?? "No plate selected"}</p><p className="text-sm">Image-assisted disk diffusion reading is for supervised laboratory use. Final AST interpretation requires authorised review.</p><p className="text-sm">In LIS-connected mode, DiskDiff Reader sends zone measurements and audit metadata. Final interpretation, expert rules, AMS governance, validation, and report release remain in the LIS unless explicitly configured otherwise.</p><Textarea value={generateDraftReportText()} readOnly rows={10} /></CardContent></Card>
  <Card><CardHeader><CardTitle className="text-base">Zone result export</CardTitle></CardHeader><CardContent className="space-y-3"><Button onClick={()=>{const w=validateZoneResultExport();setWarnings(w);if(w.length===0){setZoneJson(JSON.stringify(exportZoneResultJson(),null,2));}}}>Export Zone Result JSON</Button>{warnings.length>0&&<ul className="text-sm text-destructive list-disc pl-5">{warnings.map((w)=><li key={w}>{w}</li>)}</ul>}<Textarea value={zoneJson} readOnly rows={16} placeholder="Export Zone Result JSON output appears here" /></CardContent></Card></div></div>;
}
