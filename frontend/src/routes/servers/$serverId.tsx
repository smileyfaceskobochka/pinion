import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/auth";
import { apiFetch } from "../../lib/api";
import { type Server } from "../../lib/types";

export const Route = createFileRoute("/servers/$serverId")({
  component: ServerLayout,
});

function ServerLayout() {
  const { serverId } = useParams({ from: "/servers/$serverId" });
  const { token } = useAuth();

  const { data: server, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => apiFetch<Server>(`/api/servers/${serverId}`, {}, token),
    enabled: !!token && !!serverId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-neutral-900 rounded-lg" />
        <div className="h-px bg-border-subtle" />
        <div className="h-96 bg-neutral-900 rounded-xl" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Instance not found</h2>
        <p className="text-text-secondary">The server you are looking for does not exist or has been decommissioned.</p>
        <Link to="/servers" className="btn-brand">Back to Infrastructure</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Server Header & Identity */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-text-tertiary">
          <Link to="/servers" className="hover:text-white transition-colors">Infrastructure</Link>
          <span>/</span>
          <span className="text-text-secondary">Instance</span>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-white">{server.name}</h1>
          <div className="px-2 py-0.5 rounded bg-neutral-900 border border-border-subtle text-[10px] font-mono font-bold text-text-tertiary">
            {server.uuid}
          </div>
        </div>
      </div>

      {/* High-Contrast Tab Navigation */}
      <div className="flex gap-1 bg-black border border-border-subtle p-1 rounded-xl w-fit">
        <TabLink to="/servers/$serverId" params={{ serverId }} label="Console" />
        <TabLink to="/servers/$serverId/files" params={{ serverId }} label="Files" />
        <TabLink to="/servers/$serverId/settings" params={{ serverId }} label="Settings" />
      </div>

      {/* Main Viewport Area */}
      <div className="relative">
        <Outlet />
      </div>
    </div>
  );
}

function TabLink({ to, params, label }: { to: string; params: any; label: string }) {
  return (
    <Link
      to={to}
      params={params}
      activeOptions={{ exact: true }}
      className="px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 text-text-secondary hover:text-white hover:bg-neutral-900"
      activeProps={{ className: "!bg-white !text-black shadow-lg" }}
    >
      {label}
    </Link>
  );
}
