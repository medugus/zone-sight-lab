import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateDraftReportText, getWorkflowState } from "@/lib/diskdiff-store";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { currentPlate } = getWorkflowState();

  return (
    <div>
      <PageHeader
        title="Draft Report"
        description="Draft report generation only. Final release requires authorised review."
      />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Draft report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline">Draft: not for clinical release</Badge>
            <p className="text-sm text-muted-foreground">
              Current plate: {currentPlate?.accessionNumber ?? "No plate selected"}
            </p>
            <Textarea value={generateDraftReportText()} readOnly rows={14} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
