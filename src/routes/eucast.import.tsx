import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import {
  parseEucastCsv,
  saveBreakpoints,
  loadActiveBreakpoints,
  getActiveVersion,
  listAvailableVersions,
  setActiveVersion,
  REQUIRED_COLUMNS,
  type BreakpointRow,
} from "@/lib/eucast-store";

export const Route = createFileRoute("/eucast/import")({ component: EucastImportPage });

function EucastImportPage() {
  const { user } = useAuth();
  if (!user || user.role !== ROLES.ADMIN) {
    return <Navigate to="/access-denied" replace />;
  }

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [preview, setPreview] = useState<{ rows: BreakpointRow[]; version: string } | null>(null);
  const [tick, setTick] = useState(0);
  const active = getActiveVersion();
  const activeRows = loadActiveBreakpoints();
  const versions = listAvailableVersions();

  const handleFile = async (file: File) => {
    setError("");
    setSuccess("");
    setPreview(null);
    const text = await file.text();
    const result = parseEucastCsv(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPreview({ rows: result.rows, version: result.version });
  };

  const handleCommit = () => {
    if (!preview) return;
    saveBreakpoints(preview.rows, preview.version);
    setSuccess(`Imported ${preview.rows.length} breakpoints for EUCAST version ${preview.version}.`);
    setPreview(null);
    setTick(tick + 1);
  };

  return (
    <div>
      <PageHeader
        title="EUCAST Import"
        description="Admin only. Upload a validated EUCAST breakpoint CSV. Interpretation will refuse to guess missing breakpoints."
      />
      <div className="p-6 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload EUCAST CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Required columns (header row, lowercase): {REQUIRED_COLUMNS.join(", ")}
            </p>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {preview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Preview — EUCAST {preview.version} ({preview.rows.length} rows)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertDescription>
                  Review carefully. Committing will replace any existing rows for version {preview.version} and set it active.
                </AlertDescription>
              </Alert>
              <div className="max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organism</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Antimicrobial</TableHead>
                      <TableHead>Disk</TableHead>
                      <TableHead>S ≥</TableHead>
                      <TableHead>R &lt;</TableHead>
                      <TableHead>ATU</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.slice(0, 50).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.organism_name}</TableCell>
                        <TableCell>{r.organism_group}</TableCell>
                        <TableCell>{r.antimicrobial_name}</TableCell>
                        <TableCell>{r.disk_content}</TableCell>
                        <TableCell>{r.s_breakpoint_mm ?? "—"}</TableCell>
                        <TableCell>{r.r_breakpoint_mm ?? "—"}</TableCell>
                        <TableCell>
                          {r.atu_lower_mm != null && r.atu_upper_mm != null
                            ? `${r.atu_lower_mm}–${r.atu_upper_mm}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCommit}>Commit import</Button>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card key={tick}>
          <CardHeader>
            <CardTitle className="text-base">Active EUCAST table</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">Active version: {active ?? "none"}</Badge>
              <Badge variant="outline">{activeRows.length} rows loaded</Badge>
            </div>
            {versions.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground self-center">Switch active:</span>
                {versions.map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={v === active ? "default" : "outline"}
                    onClick={() => {
                      setActiveVersion(v);
                      setTick(tick + 1);
                    }}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
