import { useNavigate } from "@tanstack/react-router";
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

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />

      <div className="flex flex-1 items-center gap-2">
        <Badge variant="outline" className="border-amber-500/40 bg-amber-50 text-amber-700">
          DRAFT - NOT FOR CLINICAL RELEASE
        </Badge>
      </div>

      {user?.role && <Badge variant="secondary">{user.role}</Badge>}

      <span className="hidden text-sm text-muted-foreground sm:inline">
        {user?.full_name || user?.email}
      </span>

      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </header>
  );
}
