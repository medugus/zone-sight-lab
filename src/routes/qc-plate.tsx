import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { savePlateQc } from "@/lib/diskdiff-store";

export const Route = createFileRoute("/qc-plate")({
  component: PlateQCPage,
});

const labels = {
  entirePlateVisible: "Entire plate visible",
  imageNotBlurred: "Image not blurred",
  lightingAcceptable: "Lighting acceptable",
  noMajorReflection: "No major reflection",
  agarSurfaceIntact: "Agar surface intact",
  noExcessMoisture: "No excessive moisture",
  noObviousContamination: "No obvious contamination",
  lawnAcceptable: "Growth lawn acceptable",
  disksVisible: "Disks visible",
  disksNotDisplaced: "Disks not displaced",
  zonesNotExcessivelyOverlapping: "Zones not excessively overlapping",
  correctMediumSelected: "Correct medium selected",
  incubationConditionEntered: "Incubation condition entered",
} as const;

const criticalKeys = [
  "entirePlateVisible",
  "imageNotBlurred",
  "agarSurfaceIntact",
  "noObviousContamination",
  "lawnAcceptable",
  "disksVisible",
  "zonesNotExcessivelyOverlapping",
  "correctMediumSelected",
  "incubationConditionEntered",
] as const;

function PlateQCPage() {
  const [state, setState] = useState<Record<keyof typeof labels, boolean>>(
    Object.fromEntries(Object.keys(labels).map((k) => [k, false])) as Record<
      keyof typeof labels,
      boolean
    >,
  );
  const [qcComment, setQcComment] = useState("");

  const qcStatus = useMemo(() => {
    const criticalFailed = criticalKeys.some((key) => !state[key]);
    if (criticalFailed) return "Reject image or repeat plate" as const;

    const allPass = Object.values(state).every(Boolean);
    if (allPass) return "Acceptable for automated reading" as const;

    return "Readable with manual review required" as const;
  }, [state]);

  return (
    <div>
      <PageHeader
        title="Plate QC"
        description="Run the plate and image quality checklist before manual measurement."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quality checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(Object.keys(labels) as Array<keyof typeof labels>).map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <Checkbox
                    id={key}
                    checked={state[key]}
                    onCheckedChange={(value) =>
                      setState({ ...state, [key]: Boolean(value) })
                    }
                  />
                  <label htmlFor={key}>{labels[key]}</label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">QC outcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">{qcStatus}</p>
            <Textarea
              rows={5}
              placeholder="QC notes"
              value={qcComment}
              onChange={(e) => setQcComment(e.target.value)}
            />
            <Button
              onClick={() => savePlateQc({ ...state, qcComment, qcStatus })}
            >
              Save QC result
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
