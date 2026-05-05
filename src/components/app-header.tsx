import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ALL_ROLES, useRole, type Role } from "@/lib/roles";

export function AppHeader() {
  const { role, setRole } = useRole();
  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex flex-1 items-center gap-2">
        <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-50">
          DRAFT — NOT FOR CLINICAL RELEASE
        </Badge>
      </div>
      <Badge variant="secondary" className="hidden md:inline-flex">Mock auth (dev)</Badge>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:inline">Acting as</span>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="h-8 w-[230px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}