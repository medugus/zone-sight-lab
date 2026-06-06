import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoreData } from "@/lib/diskdiff-store";

type ImportedWorklistSummaryCardProps = {
  workflow: Pick<StoreData, "currentPlate" | "discLayout" | "importedWorklist">;
  className?: string;
};

export function ImportedWorklistSummaryCard({
  workflow,
  className,
}: ImportedWorklistSummaryCardProps) {
  const summary = buildImportedWorklistSummary(workflow);
  if (!summary) return null;

  return (
    <Card className={className} aria-label="Imported worklist summary">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Imported worklist summary</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2 text-sm sm:grid-cols-5">
          <SummaryItem label="Accession" value={summary.accessionNumber} />
          <SummaryItem label="Specimen" value={summary.specimenType} />
          <SummaryItem label="Organism" value={summary.organismName} />
          <SummaryItem label="Standard" value={summary.standard} />
          <SummaryItem label="Expected discs" value={String(summary.expectedDiscCount)} />
        </dl>
      </CardContent>
    </Card>
  );
}

export function buildImportedWorklistSummary(
  workflow: ImportedWorklistSummaryCardProps["workflow"],
) {
  const imported = workflow.importedWorklist;
  const plate = workflow.currentPlate;
  if (!imported && !plate?.worklistId) return null;

  return {
    accessionNumber: imported?.accessionNumber || plate?.accessionNumber || "N/A",
    specimenType: imported?.specimenType || plate?.specimenType || "N/A",
    organismName: imported?.organismName || plate?.organismName || "N/A",
    standard: imported?.standard || plate?.standard || "N/A",
    expectedDiscCount:
      imported?.expectedDiscs.length ??
      workflow.discLayout.filter((disc) => disc.expectedOnPlate).length,
  };
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
