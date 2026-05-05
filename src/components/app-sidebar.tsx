import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Camera, ShieldCheck, Ruler, FlaskConical, Microscope, FileText, ScrollText, Settings } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { canAccessRoute } from "@/lib/access";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Plate Capture", url: "/capture", icon: Camera },
  { title: "Plate QC", url: "/qc-plate", icon: ShieldCheck },
  { title: "Zone Measurement", url: "/measure", icon: Ruler },
  { title: "EUCAST Interpretation", url: "/interpret", icon: Microscope },
  { title: "QC Strains", url: "/qc-strains", icon: FlaskConical },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Audit Trail", url: "/audit", icon: ScrollText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() { const path = useRouterState({ select: (s) => s.location.pathname }); const { user } = useAuth(); const isActive = (url: string) => (url === "/" ? path === "/" : path.startsWith(url));
  const visible = items.filter((i) => user && canAccessRoute(user.role, i.url));
  return <Sidebar collapsible="icon"><SidebarHeader><div className="px-2 py-3 text-sm font-semibold">DiskDiff Reader</div></SidebarHeader><SidebarContent><SidebarGroup><SidebarGroupLabel>Navigation</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{visible.map((item) => <SidebarMenuItem key={item.url}><SidebarMenuButton asChild isActive={isActive(item.url)}><Link to={item.url}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent></Sidebar>;
}
