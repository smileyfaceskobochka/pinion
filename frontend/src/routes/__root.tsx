import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../context/auth";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayout />
      </AuthProvider>
    </QueryClientProvider>
  ),
});

function RootLayout() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <div className="min-h-screen text-white flex flex-col font-sans bg-bg-main">
      <nav className="sticky top-0 z-50 h-16 border-b border-border-subtle bg-bg-main/95 backdrop-blur">
        <div className="max-w-[1200px] mx-auto h-full px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-black text-white text-sm">P</div>
              <span className="text-base font-bold tracking-tight font-display uppercase">Pinion</span>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1 text-sm text-text-secondary">
                <NavLink to="/servers" label="Servers" />
                <NavLink to="/admin/nodes" label="Nodes" />
                <NavLink to="/admin/eggs" label="Eggs" />
                <NavLink to="/admin/users" label="Users" />
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-text-secondary">{user?.username}</span>
                <button
                  onClick={logout}
                  className="text-[11px] text-text-tertiary hover:text-red-400 transition-colors"
                >
                  Sign out
                </button>
              </div>
              <div className="w-9 h-9 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center text-xs font-semibold text-text-secondary">
                {user?.username[0].toUpperCase()}
              </div>
            </div>
          ) : (
            <Link to="/auth" className="btn-brand px-4 py-2 text-xs uppercase tracking-wide">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>

      <TanStackRouterDevtools />
    </div>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/5 transition-colors"
      activeProps={{ className: "text-white bg-white/10" }}
    >
      {label}
    </Link>
  );
}
