import { Link, useRouterState } from "@tanstack/react-router";
import {
  Camera,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Microscope,
  Upload,
  Ruler,
  ScrollText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { canAccessRoute } from "@/lib/access-control";
import { useAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const workflow: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Plate Capture", url: "/capture", icon: Camera },
  { title: "Plate QC", url: "/qc-plate", icon: ShieldCheck },
  { title: "Zone Measurement", url: "/measure", icon: Ruler },
  { title: "EUCAST Interpretation", url: "/interpret", icon: Microscope },
];

const laboratory: NavItem[] = [
  { title: "QC Strains", url: "/qc-strains", icon: FlaskConical },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "EUCAST Import", url: "/eucast/import", icon: Upload },
  { title: "Audit Trail", url: "/audit", icon: ScrollText },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (url: string) => (url === "/" ? path === "/" : path.startsWith(url));

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { user } = useAuth();
  const role = user?.role ?? ROLES.VIEWER;

  const visibleWorkflow = workflow.filter((item) => canAccessRoute(role, item.url));
  const visibleLaboratory = laboratory.filter((item) => canAccessRoute(role, item.url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-gradient-to-br from-primary/25 to-primary/5 shadow-[0_0_24px_-6px_var(--cyan-glow)]">
            <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_12px_var(--cyan-glow)]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-base font-bold tracking-tight text-foreground">
              DiskDiff
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary/80">
              Reader · v1
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavSection title="Workflow" items={visibleWorkflow} />
        <NavSection title="Laboratory" items={visibleLaboratory} />
      </SidebarContent>
    </Sidebar>
  );
}
