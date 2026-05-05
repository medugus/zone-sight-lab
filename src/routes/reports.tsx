import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockReports } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — DiskDiff Reader" },
      { name: "description", content: "Draft, pending review, and authorised AST reports." },
    ],
  }),
  component: ReportsPage,
});

function variant(status: string): "default" | "secondary" | "outline" {
  if (status === "Authorised") return "default";
  if (status === "Pending Review") return "secondary";
  return "outline";
}

function ReportsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "Viewer";
  const isConsultant = role === "Consultant Microbiologist";
  const isMLS = role === "Medical Laboratory Scientist";
  return (
    <div>
      <PageHeader title="Reports" description="Draft AST reports remain unreleased until a Consultant Microbiologist authorises them." />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Sample</TableHead>
                  <TableHead>Organism</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.id}</TableCell>
                    <TableCell className="font-mono text-xs">{r.sample}</TableCell>
                    <TableCell>{r.organism}</TableCell>
                    <TableCell><Badge variant={variant(r.status)}>{r.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{r.updated}</TableCell>
                    <TableCell className="text-right">
                      {r.status === "Draft" && isMLS && <Button size="sm" variant="outline">Submit for review</Button>}
                      {r.status === "Pending Review" && isConsultant && <Button size="sm">Authorise</Button>}
                      {r.status === "Pending Review" && !isConsultant && <span className="text-xs text-muted-foreground">Awaiting consultant</span>}
                      {r.status === "Authorised" && <Button size="sm" variant="ghost">View</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}