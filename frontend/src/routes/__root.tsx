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
    <div className="min-h-screen text-text flex flex-col antialiased">
      {/* CLI Status Bar */}
      <header className="border-b border-surface1 bg-crust select-none">
        <div className="flex flex-wrap items-center justify-between px-4 py-2 text-xs">
          
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="font-bold text-mauve hover:text-text transition-colors">
              [ PINION OS ]
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-2 text-subtext0">
                <span className="text-surface2">|</span>
                <NavLink to="/servers" label="SERVERS" />
                <NavLink to="/admin/nodes" label="NODES" />
                <NavLink to="/admin/eggs" label="EGGS" />
                <NavLink to="/admin/users" label="USERS" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-text">
                  <span className="text-surface2">USER:</span> {user?.username}
                </span>
                <span className="text-surface2">|</span>
                <button
                  onClick={logout}
                  className="text-red hover:bg-red hover:text-base px-2 transition-colors font-bold"
                >
                  [ LOGOUT ]
                </button>
              </div>
            ) : (
              <span className="text-subtext0 animate-pulse">_ UNAUTHENTICATED</span>
            )}
          </div>

        </div>
      </header>

      {/* Main Terminal Viewport */}
      <main className="flex-1 p-4 md:p-8 max-w-[1200px] mx-auto w-full">
        <Outlet />
      </main>

      {/* CLI Footer Status */}
      <footer className="border-t border-surface1 bg-crust p-2 text-[10px] text-surface2 flex justify-between">
        <span>PINION DAEMON v1.0.0</span>
        <span>SYSTEM: ONLINE</span>
      </footer>

      <TanStackRouterDevtools />
    </div>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-subtext0 hover:text-text px-2 hover:bg-surface0 transition-none"
      activeProps={{ className: "!text-green !font-bold" }}
    >
      [ {label} ]
    </Link>
  );
}
