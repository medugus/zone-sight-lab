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
import {
  MEDUGU_ZONE_RESULT_ENDPOINT_EXAMPLE,
  sendCurrentZoneResultToLis,
  type ZoneResultSendState,
} from "@/lib/zone-result-send-to-lis";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

export function ReportsPage() {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [jsonOutput, setJsonOutput] = useState("");
  const [reviewer, setReviewer] = useState(() => getWorkflowState().exportReviewer);
  const [readinessRefresh, setReadinessRefresh] = useState(0);
  const [lisEndpoint, setLisEndpoint] = useState("");
  const [lisToken, setLisToken] = useState("");
  const [sendState, setSendState] = useState<ZoneResultSendState>("ready");
  const [sendMessage, setSendMessage] = useState(
    "Ready to send validated Zone Result payload to LIS.",
  );
  const readiness = getExportReadinessChecklist();

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Draft report, Send to LIS, and Zone Result JSON export."
      />
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
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Send to LIS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant={sendState === "failed" ? "destructive" : "outline"}>
                  {sendState === "ready" && "Ready to send"}
                  {sendState === "sending" && "Sending"}
                  {sendState === "sent" && "Sent successfully"}
                  {sendState === "failed" && "Failed"}
                </Badge>
                <p className="text-sm text-muted-foreground">{sendMessage}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="lis-endpoint">
                      Full Medugu endpoint URL
                    </label>
                    <Input
                      id="lis-endpoint"
                      value={lisEndpoint}
                      placeholder={MEDUGU_ZONE_RESULT_ENDPOINT_EXAMPLE}
                      aria-describedby="lis-endpoint-help"
                      onChange={(event) => setLisEndpoint(event.target.value)}
                    />
                    <p id="lis-endpoint-help" className="text-xs text-muted-foreground">
                      Endpoint must be the full Medugu URL, not a relative path. Example:
                      {MEDUGU_ZONE_RESULT_ENDPOINT_EXAMPLE}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Published/stable lovable.app hosts are allowed. Obvious preview hosts such as
                      id-preview--... or preview--... are blocked.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="lis-token">
                      Bearer token
                    </label>
                    <Input
                      id="lis-token"
                      type="password"
                      value={lisToken}
                      placeholder="Medugu ZoneResult token"
                      aria-describedby="lis-token-help"
                      onChange={(event) => setLisToken(event.target.value)}
                    />
                    <p id="lis-token-help" className="text-xs text-muted-foreground">
                      Bearer token is required; it is sent only in the Authorization header.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Manual JSON export remains available below if live send is not configured or
                  fails.
                </p>
                <Button
                  disabled={sendState === "sending"}
                  onClick={async () => {
                    void readinessRefresh;
                    setWarnings([]);
                    setSendState("sending");
                    setSendMessage("Sending validated Zone Result payload to Medugu...");
                    const result = await sendCurrentZoneResultToLis({
                      endpoint: lisEndpoint,
                      bearerToken: lisToken,
                    });
                    setSendState(result.state);
                    setSendMessage(result.message);
                    if (result.state === "failed") setWarnings([result.message]);
                  }}
                >
                  Send to LIS
                </Button>
              </CardContent>
            </Card>
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
