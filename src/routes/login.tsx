import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search.redirect === "string" ? search.redirect : "/" }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("admin@diskdiff.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: redirect || "/", replace: true });
  }, [user, navigate, redirect]);

  return <div className="flex min-h-screen items-center justify-center p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>Sign in</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" /><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />{error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full" onClick={async () => { const result = await signIn(email, password); if (result.error) setError(result.error); else navigate({ to: redirect || "/", replace: true }); }}>Sign in</Button><p className="text-xs text-muted-foreground">Development demo only: admin@diskdiff.local / consultant@diskdiff.local / mls@diskdiff.local / quality@diskdiff.local / viewer@diskdiff.local (password123)</p></CardContent></Card></div>;
}
