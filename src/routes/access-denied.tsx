import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/access-denied")({ component: AccessDeniedPage });

function AccessDeniedPage() {
  return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-semibold">Access denied</h1><p className="text-sm text-muted-foreground">You do not have permission to access this page.</p><Link to="/" className="underline text-sm">Back to dashboard</Link></div></div>;
}
