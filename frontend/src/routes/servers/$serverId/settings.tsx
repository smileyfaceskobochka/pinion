import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/auth";
import { apiFetch } from "../../../lib/api";
import { type Server } from "../../../lib/types";

export const Route = createFileRoute("/servers/$serverId/settings")({
  component: ServerSettings,
});

function ServerSettings() {
  const { serverId } = useParams({ from: "/servers/$serverId/settings" });
  const { token } = useAuth();

  const { data: server, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => apiFetch<Server>(`/api/servers/${serverId}`, {}, token),
    enabled: !!token,
  });

  if (isLoading) return <div className="h-96 animate-pulse bg-neutral-900 rounded-xl" />;

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* General Configuration Section */}
      <section className="space-y-6">
        <header className="border-b border-border-subtle pb-4">
          <h2 className="text-xl font-bold text-white">Instance Configuration</h2>
          <p className="text-sm text-text-secondary mt-1">Manage the primary identity and metadata for this server deployment.</p>
        </header>
        
        <div className="card-solid p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Server Name</label>
              <input 
                type="text" 
                defaultValue={server?.name} 
                className="input-field"
                placeholder="My Awesome Server"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Description</label>
              <input 
                type="text" 
                defaultValue={server?.description} 
                className="input-field"
                placeholder="Briefly describe this instance"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border-subtle flex justify-end">
            <button className="btn-brand h-10 px-8 text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand/20">
              Save Configuration
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone Section - High-Contrast & Explicit */}
      <section className="space-y-6">
        <header className="border-b border-red-500/20 pb-4">
          <h2 className="text-xl font-bold text-red-500">Decommissioning & Safety</h2>
          <p className="text-sm text-text-secondary mt-1">Irreversible actions that affect data persistence and deployment lifecycle.</p>
        </header>

        <div className="card-solid p-8 border-red-500/20 bg-red-500/[0.02]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="font-bold text-white text-lg">Destroy Instance</h4>
              <p className="text-xs text-text-tertiary max-w-md">Permanently remove this server deployment from the node. This will erase all associated file volumes and configurations immediately.</p>
            </div>
            <button className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all duration-200 active:scale-95">
              Destroy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
