import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/auth";
import { apiFetch } from "../../lib/api";
import { type Server } from "../../lib/types";

export const Route = createFileRoute("/servers/")({
  component: ServerList,
});

function ServerList() {
  const { token, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/auth" />;

  const { data: servers, isLoading, error } = useQuery({
    queryKey: ["servers"],
    queryFn: () => apiFetch<Server[]>("/api/servers", {}, token),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 bg-neutral-900 border border-border-subtle rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 font-bold flex items-center gap-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <h4 className="text-sm uppercase tracking-widest opacity-60 font-bold">Failed to load infrastructure</h4>
          <p>{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border-subtle pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-display text-white">
            Servers
          </h1>
          <p className="text-text-secondary mt-2 font-medium max-w-lg">
            Manage your high-performance game instances across our distributed edge node network.
          </p>
        </div>
        <button className="btn-brand shadow-lg shadow-brand/20 h-11 px-8">
          Deploy New Server
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {servers?.map((server) => (
          <Link
            key={server.id}
            to="/servers/$serverId"
            params={{ serverId: server.id }}
            className="card-solid p-7 group card-interactive flex flex-col justify-between h-64 border-l-2 border-l-transparent hover:border-l-brand"
          >
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-border-subtle flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-300">
                  🎮
                </div>
                <StatusBadge status={server.status} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-brand transition-colors">
                  {server.name}
                </h3>
                <p className="text-xs text-text-secondary mt-1.5 font-medium line-clamp-2 leading-relaxed">
                  {server.description || "No primary description provided for this instance."}
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${server.status === 'running' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-neutral-700'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  {server.node_id.split("-")[0]}
                </span>
              </div>
              <span className="text-[10px] font-bold font-mono text-text-tertiary bg-black px-2 py-0.5 rounded border border-border-subtle">
                {server.uuid.split("-")[0]}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {servers?.length === 0 && (
        <div className="py-24 bg-neutral-900/30 border border-dashed border-border-strong rounded-3xl flex flex-col items-center justify-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-neutral-900 border border-border-subtle flex items-center justify-center text-4xl opacity-40">
            📡
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">No active deployments</h3>
            <p className="text-text-secondary text-sm max-w-xs mt-2 leading-relaxed">
              Your edge network is idle. Deploy your first game server template to get started.
            </p>
          </div>
          <button className="btn-outline h-10 px-6 text-xs uppercase tracking-widest font-bold">
            Create Deployment
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  let classes = "badge badge-neutral";
  
  if (normalized === "running") classes = "badge badge-success";
  if (normalized === "starting" || normalized === "stopping") classes = "badge badge-warning";
  if (normalized === "offline") classes = "badge badge-danger";

  return <span className={classes}>{status}</span>;
}
