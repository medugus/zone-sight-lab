import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockAudit } from "@/lib/mock-data";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail — DiskDiff Reader" },
      { name: "description", content: "Tamper-evident log of all user and system actions." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  return (
    <div>
      <PageHeader title="Audit Trail" description="Every state change in the system is recorded for traceability and review." />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAudit.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{a.ts}</TableCell>
                    <TableCell className="font-mono text-xs">{a.user}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.role}</TableCell>
                    <TableCell>{a.action}</TableCell>
                    <TableCell className="font-mono text-xs">{a.entity}</TableCell>
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