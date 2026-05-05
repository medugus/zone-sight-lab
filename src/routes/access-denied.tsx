import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute('/access-denied')({ component: AccessDenied });

function AccessDenied() {
  return <div className="min-h-screen grid place-items-center p-6"><div className="text-center"><h1 className="text-2xl font-semibold">Access denied</h1><p className="text-sm text-muted-foreground mt-2">You do not have permission for this page.</p><Link to="/" className="underline mt-3 inline-block">Return to dashboard</Link></div></div>;
}
