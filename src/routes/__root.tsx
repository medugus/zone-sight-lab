import { Outlet, Link, createRootRoute, HeadContent, Scripts, Navigate, useRouterState } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { AuthProvider, useAuth } from "@/lib/auth";
import { canAccessRoute } from "@/lib/access";

function NotFoundComponent() { return <div className="p-6">Page not found. <Link to="/">Go home</Link></div>; }
export const Route = createRootRoute({ head: () => ({ links: [{ rel: "stylesheet", href: appCss }] }), shellComponent: RootShell, component: RootComponent, notFoundComponent: NotFoundComponent });
function RootShell({ children }: { children: React.ReactNode }) { return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>; }
function ProtectedLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;
  if (!user) return <Navigate to="/login" search={{ redirect: path }} />;
  if (!canAccessRoute(user.role, path)) return <Navigate to="/access-denied" />;
  return <SidebarProvider><div className="flex min-h-screen w-full bg-background"><AppSidebar /><SidebarInset className="flex flex-1 flex-col"><AppHeader /><main className="flex-1"><Outlet /></main></SidebarInset></div></SidebarProvider>;
}
function RootComponent() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const authPage = path === "/login" || path === "/access-denied";
  return <AuthProvider>{authPage ? <Outlet /> : <ProtectedLayout />}</AuthProvider>;
}
