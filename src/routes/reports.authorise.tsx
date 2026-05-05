import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reports/authorise")({ component: ReportsAuthorisePage });

function ReportsAuthorisePage() {
  return <div className="p-6"><h1 className="text-xl font-semibold">Report Authorisation</h1><p className="text-sm text-muted-foreground">Final AST authorisation is restricted to Admin and Consultant Microbiologist roles.</p></div>;
}
