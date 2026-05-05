import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Camera,
  ShieldCheck,
  Ruler,
  FlaskConical,
  Microscope,
  FileText,
  ScrollText,
  Settings,
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
  { title: "Audit Trail", url: "/audit", icon: ScrollText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? path === "/" : path.startsWith(url));

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
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            D
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">DiskDiff Reader</span>
            <span className="text-[10px] text-muted-foreground">Clinical decision support</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workflow</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(workflow)}</SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Laboratory</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(lab)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}