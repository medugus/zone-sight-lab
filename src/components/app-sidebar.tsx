import { Link, useRouterState } from "@tanstack/react-router";
import {
  Camera,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Microscope,
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
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
            D
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">DiskDiff Reader</span>
            <span className="text-[10px] text-muted-foreground">Clinical decision support</span>
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
