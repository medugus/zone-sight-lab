import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockUsers } from "@/lib/mock-data";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DiskDiff Reader" },
      { name: "description", content: "Manage users, EUCAST breakpoints, lab info, and plate sizes." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Administrator configuration for the lab, users, and EUCAST data." />
      <div className="p-6">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="breakpoints">Breakpoints</TabsTrigger>
            <TabsTrigger value="lab">Lab info</TabsTrigger>
            <TabsTrigger value="plates">Plate sizes</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
                <TableBody>
                  {mockUsers.map((u) => (
                    <TableRow key={u.username}>
                      <TableCell className="font-mono">{u.username}</TableCell>
                      <TableCell>{u.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="breakpoints" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">EUCAST breakpoints</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">No breakpoints loaded. Import a EUCAST CSV to enable interpretation.</p>
                <div className="flex items-center gap-2">
                  <Input type="file" accept=".csv" className="max-w-sm" />
                  <Button>Import</Button>
                </div>
                <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Empty breakpoint table.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Lab information</CardTitle></CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <Field label="Lab name"><Input placeholder="Central Microbiology Lab" /></Field>
                <Field label="Accreditation #"><Input placeholder="ISO 15189: ..." /></Field>
                <Field label="Reporting prefix"><Input placeholder="R-" /></Field>
                <Button>Save</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plates" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Supported plate sizes</CardTitle></CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• 90 mm circular plate</li>
                  <li>• 150 mm circular plate</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}