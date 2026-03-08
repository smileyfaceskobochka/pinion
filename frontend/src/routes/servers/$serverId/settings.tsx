import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/auth";
import { apiFetch } from "../../../lib/api";
import { type Server } from "../../../lib/types";
import { AsciiBox } from "../../../components/AsciiBox";

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

  if (isLoading) return <div className="text-subtext0 animate-pulse">{"> Loading instance parameters..."}</div>;

  return (
    <div className="space-y-8 text-sm max-w-4xl pb-10">
      
      {/* General Configuration */}
      <AsciiBox title="INSTANCE PARAMS" borderColor="border-surface2">
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-blue font-bold">NAME_ENV:</label>
            <div className="flex items-center gap-2">
              <span className="text-surface2">{">"}</span>
              <input 
                type="text" 
                defaultValue={server?.name} 
                className="ascii-input w-full md:w-2/3"
                placeholder="Instance Name"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-blue font-bold">DESC_META:</label>
            <div className="flex items-start gap-2">
              <span className="text-surface2 pt-2">{">"}</span>
              <textarea 
                defaultValue={server?.description ?? ""} 
                className="ascii-input w-full h-24 resize-none"
                placeholder="Metadata description"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-surface1 border-dashed text-right">
            <button className="ascii-btn-primary font-bold">
              [ WRITE REVISION ]
            </button>
          </div>
        </div>
      </AsciiBox>

      {/* Danger Zone */}
      <AsciiBox title="DESTRUCTIVE OPERATIONS" borderColor="border-red">
        <div className="space-y-4">
          <div className="text-red font-bold">
            WARNING: Executing a destruction protocol is irreversible. All persistent volumes and metadata blocks will be permanently purged.
          </div>
          <div className="flex justify-between items-center border-t border-red/30 border-dashed pt-4">
            <span className="text-subtext0 text-xs text-red">Require root privileges for confirmation.</span>
            <button className="ascii-btn-danger font-bold uppercase tracking-widest">
              [ PURGE INSTANCE ]
            </button>
          </div>
        </div>
      </AsciiBox>

    </div>
  );
}
