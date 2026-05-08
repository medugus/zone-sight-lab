import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Beaker, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  component: LoginPage,
});

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@diskdiff.local" },
  { label: "Consultant", email: "consultant@diskdiff.local" },
  { label: "MLS", email: "mls@diskdiff.local" },
  { label: "Quality", email: "quality@diskdiff.local" },
  { label: "Viewer", email: "viewer@diskdiff.local" },
];

function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("admin@diskdiff.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: redirect || "/", replace: true });
  }, [user, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) setError(result.error);
    else navigate({ to: redirect || "/", replace: true });
  };

  return (
    <div className="app-shell relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-glow)" }}
      />
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between border-r border-border/60 p-12 lg:flex">
          <div className="absolute inset-0 grid-texture opacity-30" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-gradient-to-br from-primary/25 to-primary/5 shadow-[0_0_28px_-6px_var(--cyan-glow)]">
              <Beaker className="h-5 w-5 text-primary" />
            </div>
            <div className="leading-tight">
              <div className="font-serif text-lg font-bold tracking-tight">DiskDiff Reader</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">
                Clinical decision support
              </div>
            </div>
          </div>

          <div className="relative max-w-md space-y-6">
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-8 bg-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                EUCAST · Kirby-Bauer
              </span>
            </div>
            <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight">
              Supervised reading of disk diffusion plates,{" "}
              <span className="italic text-primary">measured to spec</span>.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              DiskDiff guides every plate from capture through QC, manual zone measurement, and
              EUCAST interpretation. No report is released without authorised review.
            </p>
            <div className="grid grid-cols-3 gap-4 border-t border-border/60 pt-6">
              {[
                ["5", "Role tiers"],
                ["EUCAST", "Breakpoint engine"],
                ["Audit", "Every action"],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="font-serif text-2xl font-bold text-foreground">{v}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            v1 · feature/eucast-import-v1
          </div>
        </div>

        {/* Form panel */}
        <div className="relative flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                  <Beaker className="h-4 w-4 text-primary" />
                </div>
                <span className="font-serif text-lg font-bold">DiskDiff Reader</span>
              </div>
            </div>

            <div>
              <div className="mb-2 inline-flex items-center gap-2">
                <span className="h-px w-6 bg-primary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                  Sign in
                </span>
              </div>
              <h2 className="font-serif text-3xl font-bold tracking-tight">Welcome back.</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Authenticate to continue your supervised microbiology workflow.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.org"
                  className="h-11"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="h-11"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full bg-primary text-primary-foreground shadow-[0_0_30px_-8px_var(--cyan-glow)] hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>

            <div className="space-y-3 rounded-lg border border-border/60 bg-card/40 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Demo accounts
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">password123</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => setEmail(a.email)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                      email === a.email
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
