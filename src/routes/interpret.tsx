import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/interpret")({
  head: () => ({
    meta: [
      { title: "EUCAST Interpretation — DiskDiff Reader" },
      { name: "description", content: "Apply EUCAST breakpoint logic to measured zone diameters." },
    ],
  }),
  component: InterpretPage,
});

function InterpretPage() {
  return (
    <div>
      <PageHeader title="EUCAST Interpretation" description="Categorises zone diameters as S / I / R using the configured EUCAST breakpoint table." />
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <h3 className="mt-3 text-base font-semibold">No breakpoints loaded</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              An administrator must import a EUCAST breakpoints CSV before interpretation can run. No default dataset is shipped.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}