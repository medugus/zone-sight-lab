import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function AppHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex flex-1 items-center gap-2">
        <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-50">DRAFT — NOT FOR CLINICAL RELEASE</Badge>
      </div>
      <Badge variant="secondary" className="hidden md:inline-flex">{user?.role}</Badge>
      <Button size="sm" variant="outline" onClick={() => signOut()}>Sign out</Button>
    </header>
  );
}
