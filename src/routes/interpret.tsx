import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWorkflowState } from "@/lib/diskdiff-store";

export const Route = createFileRoute("/interpret")({ component: InterpretPage });

function InterpretPage() {
  const { measurements, plateQc } = getWorkflowState();
  const rejected = plateQc?.qcStatus === "Reject image or repeat plate";
  return <div><PageHeader title="EUCAST Interpretation" description="Prepare interpretation table using validated EUCAST breakpoints." /><div className="p-6"><Card><CardHeader><CardTitle className="text-base">Interpretation prep</CardTitle></CardHeader><CardContent className="space-y-3">{rejected && <p className="text-sm text-destructive">Interpretation blocked because QC is rejected.</p>}<p className="text-sm">No EUCAST breakpoint available. Upload or activate a validated EUCAST table.</p><Table><TableHeader><TableRow><TableHead>Antimicrobial</TableHead><TableHead>Disk content</TableHead><TableHead>Zone diameter</TableHead><TableHead>S breakpoint</TableHead><TableHead>R breakpoint</TableHead><TableHead>ATU range</TableHead><TableHead>Interpretation</TableHead><TableHead>Notes</TableHead><TableHead>EUCAST version</TableHead></TableRow></TableHeader><TableBody>{measurements.map((m)=><TableRow key={m.id}><TableCell>{m.antimicrobialName}</TableCell><TableCell>{m.diskContent}</TableCell><TableCell>{m.zoneDiameterMm}</TableCell><TableCell>—</TableCell><TableCell>—</TableCell><TableCell>—</TableCell><TableCell>Not interpreted</TableCell><TableCell>No breakpoint loaded</TableCell><TableCell>—</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>;
}
