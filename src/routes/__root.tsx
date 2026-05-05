import { HeadContent, Navigate, Outlet, Scripts, createRootRoute, useRouterState } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { canAccessRoute } from "@/lib/access-control";
import { AuthProvider, useAuth } from "@/lib/auth";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return <div className="p-8">Page not found</div>;
}

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ProtectedLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Checking session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" search={{ redirect: path }} replace />;
  }

  if (!canAccessRoute(user.role, path)) {
    return <Navigate to="/access-denied" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function RootComponent() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isPublicRoute = path === "/login" || path === "/access-denied";

  return <AuthProvider>{isPublicRoute ? <Outlet /> : <ProtectedLayout />}</AuthProvider>;
}
