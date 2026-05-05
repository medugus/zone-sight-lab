import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { qcStrains } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/qc-strains")({
  head: () => ({
    meta: [
      { title: "QC Strains — DiskDiff Reader" },
      { name: "description", content: "Track quality control strain runs and trends." },
    ],
  }),
  component: QCStrains,
});

function QCStrains() {
  return (
    <div>
      <PageHeader title="QC Strain Module" description="Routine QC of reference strains used to validate disk diffusion performance." />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Reference strains</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Organism</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qcStrains.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.id}</TableCell>
                    <TableCell>{s.organism}</TableCell>
                    <TableCell className="text-muted-foreground">{s.purpose}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline">Log run</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Trend (Levey-Jennings)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground">
              No QC runs recorded yet.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}