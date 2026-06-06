import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExportReadinessItem } from "@/lib/diskdiff-store";

export function ExportReadinessChecklist({ items }: { items: ExportReadinessItem[] }) {
  return (
    <Card aria-label="Export readiness checklist">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Export readiness</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.key} className="flex gap-2 rounded-md border bg-muted/20 p-2">
              <Badge variant={item.passed ? "outline" : "destructive"}>
                {item.passed ? "Ready" : "Blocked"}
              </Badge>
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.details}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
