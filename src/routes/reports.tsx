import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExportReadinessChecklist } from "@/components/export-readiness-checklist";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  exportZoneResultJson,
  generateDraftReportText,
  getExportReadinessChecklist,
  getWorkflowState,
  saveExportReviewer,
  validateZoneResultExport,
} from "@/lib/diskdiff-store";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

function ReportsPage() {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [jsonOutput, setJsonOutput] = useState("");
  const [reviewer, setReviewer] = useState(() => getWorkflowState().exportReviewer);
  const [readinessRefresh, setReadinessRefresh] = useState(0);
  const readiness = getExportReadinessChecklist();

  return (
    <div>
      <PageHeader title="Reports" description="Draft report and Zone Result JSON export." />
      <div className="grid gap-4 p-6">
        <ExportReadinessChecklist items={readiness} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Draft report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline">Draft: not for clinical release</Badge>
            <p className="text-sm text-muted-foreground">
              Draft: not for clinical release. Final AST interpretation requires authorised review.
            </p>
            <Textarea value={generateDraftReportText()} readOnly rows={12} />
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="export-reviewer">
                Export reviewer
              </label>
              <Input
                id="export-reviewer"
                value={reviewer}
                placeholder="reviewedBy"
                onChange={(event) => {
                  setReviewer(event.target.value);
                  saveExportReviewer(event.target.value);
                  setReadinessRefresh((n) => n + 1);
                }}
              />
            </div>
            <Button
              onClick={() => {
                void readinessRefresh;
                const issues = validateZoneResultExport();
                setWarnings(issues);
                if (issues.length > 0) {
                  setJsonOutput("");
                  return;
                }
                try {
                  setJsonOutput(JSON.stringify(exportZoneResultJson(), null, 2));
                } catch (error) {
                  setWarnings([(error as Error).message]);
                  setJsonOutput("");
                }
              }}
            >
              Export Zone Result JSON
            </Button>
            {warnings.length > 0 && (
              <ul className="list-disc pl-5 text-sm text-destructive">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            <Textarea
              value={jsonOutput}
              readOnly
              rows={18}
              placeholder="Exported JSON output appears here"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
