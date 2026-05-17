import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { exportZoneResultJson, generateDraftReportText, validateZoneResultExport } from "@/lib/diskdiff-store";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

function ReportsPage() {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [jsonOutput, setJsonOutput] = useState("");

  return (
    <div>
      <PageHeader title="Reports" description="Draft report and Zone Result JSON export." />
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Draft report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline">Draft: not for clinical release</Badge>
            <p className="text-sm text-muted-foreground">Draft: not for clinical release. Final AST interpretation requires authorised review.</p>
            <Textarea value={generateDraftReportText()} readOnly rows={12} />
            <Button onClick={() => {
              const issues = validateZoneResultExport();
              setWarnings(issues);
              if (issues.length > 0) {
                setJsonOutput("");
                return;
              }
              setJsonOutput(JSON.stringify(exportZoneResultJson(), null, 2));
            }}>Export Zone Result JSON</Button>
            {warnings.length > 0 && <ul className="list-disc pl-5 text-sm text-destructive">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
            <Textarea value={jsonOutput} readOnly rows={18} placeholder="Exported JSON output appears here" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
