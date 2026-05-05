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
import { useAuth } from "@/lib/auth";
import { canAccessRoute } from "@/lib/access-control";

const workflow = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Plate Capture", url: "/capture", icon: Camera },
  { title: "Plate QC", url: "/qc-plate", icon: ShieldCheck },
  { title: "Zone Measurement", url: "/measure", icon: Ruler },
  { title: "EUCAST Interpretation", url: "/interpret", icon: Microscope },
];

const lab = [
  { title: "QC Strains", url: "/qc-strains", icon: FlaskConical },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Report Authorisation", url: "/reports/authorise", icon: FileText },
  { title: "Audit Trail", url: "/audit", icon: ScrollText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  const isActive = (url: string) => (url === "/" ? path === "/" : path.startsWith(url));
  const filterByRole = <T extends { url: string }>(items: T[]) =>
    items.filter((item) => (user ? canAccessRoute(user.role, item.url) : false));

  const renderItems = (items: typeof workflow) => (
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
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-3 text-sm font-semibold">DiskDiff Reader</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workflow</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(filterByRole(workflow))}</SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Laboratory</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(filterByRole(lab))}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
