import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch() as { redirect?: string };
  const [email, setEmail] = useState("admin@diskdiff.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  useEffect(() => { if (user) navigate({ to: redirect || "/", replace: true }); }, [user, navigate, redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try { await signIn(email, password); } catch (err) { setError((err as Error).message); }
  };

  return <div className="min-h-screen flex items-center justify-center p-6"><form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border rounded p-4"><h1 className="font-semibold">Sign in</h1><input className="w-full border p-2" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" /><input className="w-full border p-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" />{error && <p className="text-sm text-red-600">{error}</p>}<button className="w-full border p-2">Sign in</button><p className="text-xs text-muted-foreground">Development demo only: admin@diskdiff.local, consultant@diskdiff.local, mls@diskdiff.local, quality@diskdiff.local, viewer@diskdiff.local (password: password123)</p></form></div>;
}
