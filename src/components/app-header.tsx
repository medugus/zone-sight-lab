import { useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

export function AppHeader() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const initials =
    user?.full_name
      ?.split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "??";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-md">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="flex flex-1 items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 sm:inline-flex">
          <ShieldAlert className="h-3.5 w-3.5 text-warning" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-warning">
            Draft · Not for Clinical Release
          </span>
        </div>
      </div>

      {user?.role && (
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          {user.role}
        </Badge>
      )}

      <div className="hidden items-center gap-2 sm:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card font-mono text-[11px] font-medium text-foreground">
          {initials}
        </div>
        <div className="hidden flex-col leading-tight md:flex">
          <span className="text-xs font-medium text-foreground">
            {user?.full_name || user?.email}
          </span>
          <span className="text-[10px] text-muted-foreground">{user?.email}</span>
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </header>
  );
}
