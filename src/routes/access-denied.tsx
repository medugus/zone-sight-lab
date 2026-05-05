import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/access-denied")({ component: AccessDeniedPage });

function AccessDeniedPage() {
  return <div className="flex min-h-screen items-center justify-center p-6"><div className="text-center space-y-3"><h1 className="text-2xl font-semibold">Access denied</h1><p className="text-muted-foreground">You do not have permission to view this page.</p><Link to="/" className="underline">Back to dashboard</Link></div></div>;
}
