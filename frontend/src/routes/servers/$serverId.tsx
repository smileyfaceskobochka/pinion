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
    return <div className="text-subtext0 animate-pulse">{"> Resolving instance identity..."}</div>;
  }

  if (!server) {
    return (
      <div className="text-red font-bold">
        ERR: Instance not found or access denied.
        <br />
        <Link to="/servers" className="text-blue hover:underline">{"<-"} Return to infrastructure</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      
      {/* CLI Header Blocks */}
      <div className="flex flex-wrap items-end gap-1 mb-6">
        <Link to="/servers" className="text-blue hover:underline underline-offset-4 font-bold">
          ~/pinion/servers
        </Link>
        <span className="text-surface2">/</span>
        <span className="text-mauve font-bold">{server.name}</span>
      </div>

      <div className="border border-surface1 p-4 bg-crust flex flex-col md:flex-row justify-between gap-4">
        <div>
          <span className="text-surface2">ID: </span>
          <span className="text-text font-bold">{server.id}</span>
        </div>
        <div>
          <span className="text-surface2">NODE: </span>
          <span className="text-green font-bold">{server.node_id}</span>
        </div>
      </div>

      {/* ASCII Tabs */}
      <div className="flex gap-2 border-b border-surface1 border-dashed pb-2">
        <TabLink to="/servers/$serverId" params={{ serverId }} label="CONSOLE" />
        <span className="text-surface2">|</span>
        <TabLink to="/servers/$serverId/files" params={{ serverId }} label="FILESYSTEM" />
        <span className="text-surface2">|</span>
        <TabLink to="/servers/$serverId/settings" params={{ serverId }} label="CONFIGURATION" />
      </div>

      {/* Viewport */}
      <div className="pt-2">
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
      className="text-subtext0 hover:text-text hover:bg-surface0 px-2 transition-none"
      activeProps={{ className: "!text-blue !font-bold" }}
    >
      [ {label} ]
    </Link>
  );
}
