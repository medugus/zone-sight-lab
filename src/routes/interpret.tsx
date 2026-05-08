import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getWorkflowState } from "@/lib/diskdiff-store";
import { findBreakpoint, interpretZone, getActiveVersion } from "@/lib/eucast-store";

export const Route = createFileRoute("/interpret")({ component: InterpretPage });

function InterpretPage() {
  const { measurements, plateQc, currentPlate } = getWorkflowState();
  const rejected = plateQc?.qcStatus === "Reject image or repeat plate";
  const activeVersion = getActiveVersion();
  const organismName = currentPlate?.organismName ?? "";
  const organismGroup = currentPlate?.organismGroup ?? "";

  return (
    <div>
      <PageHeader title="EUCAST Interpretation" description="Interpretation uses the active validated EUCAST table. Missing breakpoints are never guessed." />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interpretation prep</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">Draft: not for clinical release</Badge>
              <Badge variant="outline">Active EUCAST: {activeVersion ?? "none"}</Badge>
              <Badge variant="outline">Organism: {organismName || "not entered"}</Badge>
            </div>
            {rejected && <p className="text-sm text-destructive">Interpretation blocked because QC is rejected.</p>}
            {!activeVersion && (
              <p className="text-sm text-destructive">
                No EUCAST breakpoint available. Upload or activate a validated EUCAST table.
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Antimicrobial</TableHead>
                  <TableHead>Disk content</TableHead>
                  <TableHead>Zone diameter</TableHead>
                  <TableHead>S ≥</TableHead>
                  <TableHead>R &lt;</TableHead>
                  <TableHead>ATU range</TableHead>
                  <TableHead>Interpretation</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>EUCAST version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.map((m) => {
                  const bp = rejected
                    ? null
                    : findBreakpoint({
                        organismName,
                        organismGroup,
                        antimicrobialName: m.antimicrobialName,
                        diskContent: m.diskContent,
                      });
                  const { result, reason } = rejected
                    ? { result: "Manual review required" as const, reason: "QC rejected; interpretation blocked." }
                    : interpretZone(m.zoneDiameterMm, bp);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>{m.antimicrobialName}</TableCell>
                      <TableCell>{m.diskContent}</TableCell>
                      <TableCell>{m.zoneDiameterMm} mm</TableCell>
                      <TableCell>{bp?.s_breakpoint_mm ?? "—"}</TableCell>
                      <TableCell>{bp?.r_breakpoint_mm ?? "—"}</TableCell>
                      <TableCell>
                        {bp?.atu_lower_mm != null && bp?.atu_upper_mm != null
                          ? `${bp.atu_lower_mm}–${bp.atu_upper_mm}`
                          : "—"}
                      </TableCell>
                      <TableCell>{result}</TableCell>
                      <TableCell>{reason}</TableCell>
                      <TableCell>{bp?.eucast_version ?? activeVersion ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
