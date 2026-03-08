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
    <div className="min-h-screen text-white flex flex-col font-sans selection:bg-brand/30 selection:text-white antialiased">
      {/* High-Contrast Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-black border-b border-border-subtle h-16 flex items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-black text-white text-sm">
              P
            </div>
            <span className="text-lg font-extrabold tracking-tighter font-display uppercase">
              Pinion
            </span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex gap-6 items-center text-[13px] font-semibold text-text-secondary">
              <NavLink to="/servers" label="Servers" />
              <div className="w-px h-3 bg-border-subtle" />
              <NavLink to="/admin/nodes" label="Nodes" />
              <NavLink to="/admin/eggs" label="Eggs" />
              <NavLink to="/admin/users" label="Users" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <div className="flex items-center gap-4 border-l border-border-subtle pl-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold leading-tight">{user?.username}</span>
                <button
                  onClick={logout}
                  className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary hover:text-red-400 transition-colors"
                >
                  Sign Out
                </button>
              </div>
              <div className="w-9 h-9 rounded-full bg-neutral-900 border border-border-strong flex items-center justify-center font-bold text-xs text-text-secondary">
                {user?.username[0].toUpperCase()}
              </div>
            </div>
          ) : (
            <Link to="/auth" className="btn-brand px-4 py-2 text-xs uppercase tracking-widest font-bold">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 p-6 lg:p-12 max-w-[1400px] mx-auto w-full animate-in fade-in duration-700">
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
      className="hover:text-white transition-all duration-200 relative py-1.5"
      activeProps={{ className: "!text-brand" }}
    >
      {label}
      <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand rounded-full transition-all duration-200 group-hover:w-full" />
      {/* Active Indicator is handled by TanStack Router activeProps styling above */}
    </Link>
  );
}
