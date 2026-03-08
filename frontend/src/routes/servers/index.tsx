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

  const totalServers = servers?.length ?? 0;
  const runningServers = servers?.filter((server) => server.status.toLowerCase() === "running").length ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-xl border border-border-subtle bg-bg-card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-panel p-5 border-red-500/30 text-red-300">
        <p className="text-sm font-semibold">Could not load servers</p>
        <p className="text-sm mt-1 opacity-90">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="dashboard-panel p-6 md:p-7 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display">Servers</h1>
          <p className="text-text-secondary mt-2 text-sm md:text-base">
            Clean overview of your deployments with quick status visibility.
          </p>
        </div>
        <button className="btn-brand h-10 px-5 text-sm">Deploy Server</button>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total" value={totalServers} />
        <StatCard label="Running" value={runningServers} accent="success" />
      </section>

      {totalServers === 0 ? (
        <section className="dashboard-panel p-10 text-center">
          <p className="text-lg font-semibold">No servers yet</p>
          <p className="text-sm text-text-secondary mt-2">Create your first deployment to populate this dashboard.</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servers?.map((server) => (
            <Link
              key={server.id}
              to="/servers/$serverId"
              params={{ serverId: server.id }}
              className="dashboard-panel p-5 hover:border-brand/50 hover:bg-bg-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold leading-tight">{server.name}</h3>
                <StatusBadge status={server.status} />
              </div>
              <p className="text-sm text-text-secondary mt-2 min-h-10">
                {server.description || "No description provided."}
              </p>
              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-tertiary">
                <span>Node: {server.node_id.split("-")[0]}</span>
                <span className="font-mono">{server.uuid.split("-")[0]}</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: number;
  accent?: "default" | "success";
}) {
  return (
    <div className={`dashboard-panel p-5 ${accent === "success" ? "border-green-500/30" : ""}`}>
      <p className="text-xs uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
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
