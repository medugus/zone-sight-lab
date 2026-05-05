import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/qc-plate")({
  head: () => ({
    meta: [
      { title: "Plate QC — DiskDiff Reader" },
      { name: "description", content: "Pre-read plate quality checks before zone measurement." },
    ],
  }),
  component: PlateQC,
});

const checks = [
  "Confluent lawn growth",
  "Disk spacing ≥ 24 mm",
  "No contamination visible",
  "Plate intact (no cracks, no condensation pooling)",
  "Zones fully readable (not running off the edge)",
];

function PlateQC() {
  return (
    <div>
      <PageHeader title="Plate QC" description="Confirm plate quality is acceptable before measuring inhibition zones. Failing plates must be rejected and re-set up." />
      <div className="p-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Quality checklist</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {checks.map((c) => (
                <li key={c} className="flex items-center gap-3 text-sm">
                  <Checkbox id={c} />
                  <label htmlFor={c}>{c}</label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Observations, deviations, corrective actions..." rows={6} />
            <div className="flex gap-2">
              <Button>Mark plate acceptable</Button>
              <Button variant="outline">Reject plate</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}