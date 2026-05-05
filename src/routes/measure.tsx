import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/measure")({
  head: () => ({
    meta: [
      { title: "Zone Measurement — DiskDiff Reader" },
      { name: "description", content: "Enter inhibition zone diameters in millimetres for each disk." },
    ],
  }),
  component: MeasurePage,
});

const disks = ["Ampicillin (10 µg)", "Ciprofloxacin (5 µg)", "Gentamicin (10 µg)", "Ceftriaxone (30 µg)", "Meropenem (10 µg)"];

function MeasurePage() {
  return (
    <div>
      <PageHeader title="Zone Measurement" description="Record inhibition zone diameters in millimetres. Values feed the EUCAST interpretation step." />
      <div className="p-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Plate image</CardTitle></CardHeader>
          <CardContent>
            <div className="aspect-square rounded-md border border-dashed bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
              No image attached
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Zone diameters (mm)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disk</TableHead>
                  <TableHead className="w-32">Diameter (mm)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disks.map((d) => (
                  <TableRow key={d}>
                    <TableCell>{d}</TableCell>
                    <TableCell><Input type="number" min={6} max={50} placeholder="—" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex gap-2">
              <Button>Save measurements</Button>
              <Button variant="outline">Run EUCAST interpretation</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}