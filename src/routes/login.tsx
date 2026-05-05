import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute('/login')({ component: LoginPage });

function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch() as { redirect?: string };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) navigate({ to: redirect || "/" });

  return <div className="min-h-screen grid place-items-center p-6"><Card className="w-full max-w-md"><CardHeader><CardTitle>Sign in</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" /><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /><Button className="w-full" onClick={async () => { const res = await signIn(email, password); if (res.error) return setError(res.error); navigate({ to: redirect || "/" }); }}>Sign in</Button>{error && <p className="text-xs text-destructive">{error}</p>}<p className="text-xs text-muted-foreground">Demo users: admin@diskdiff.local, consultant@diskdiff.local, mls@diskdiff.local, quality@diskdiff.local, viewer@diskdiff.local (password: password123)</p></CardContent></Card></div>;
}
