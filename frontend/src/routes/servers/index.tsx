import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../context/auth";
import { apiFetch } from "../../lib/api";
import { type Server, type Node, type Egg } from "../../lib/types";
import { AsciiBox } from "../../components/AsciiBox";
import { AsciiModal } from "../../components/AsciiModal";
import { TerminalInput } from "../../components/TerminalInput";

export const Route = createFileRoute("/servers/")({
  component: ServerList,
});

function ServerList() {
  const { token, isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    node_id: "",
    egg_id: "",
    limits: {
      memory: 2048,
      swap: 0,
      disk: 5000,
      io: 500,
      cpu: 100,
      threads: 0,
    },
    environment: {
      "EULA": "true"
    }
  });

  if (!isAuthenticated) return <Navigate to="/auth" />;

  const { data: servers, isLoading, error } = useQuery({
    queryKey: ["servers"],
    queryFn: () => apiFetch<Server[]>("/api/servers", {}, token),
    enabled: !!token,
  });

  const { data: nodes } = useQuery({
    queryKey: ["admin", "nodes"],
    queryFn: () => apiFetch<Node[]>("/api/nodes", {}, token),
    enabled: isModalOpen,
  });

  const { data: eggs } = useQuery({
    queryKey: ["admin", "eggs"],
    queryFn: () => apiFetch<Egg[]>("/api/eggs", {}, token),
    enabled: isModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: (newServer: typeof formData) =>
      apiFetch("/api/servers", {
        method: "POST",
        body: JSON.stringify({
          ...newServer,
          owner_id: user?.id,
          limits: { ...newServer.limits, threads: Number(newServer.limits.threads) }
        }),
      }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      setIsModalOpen(false);
      setFormData({
        name: "", description: "", node_id: "", egg_id: "",
        limits: { memory: 2048, swap: 0, disk: 5000, io: 500, cpu: 100, threads: 0 },
        environment: { "EULA": "true" }
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="text-subtext0 animate-pulse">{"> Fetching infrastructure state..."}</div>;
  }

  if (error) {
    return <div className="text-red font-bold">ERR: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-6 text-sm">
      <div className="flex justify-between items-center bg-surface0 p-2 border border-surface1">
        <span className="text-mauve font-bold">~/pinion/servers</span>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ascii-btn-primary font-bold text-xs uppercase"
        >
          + DEPLOY INSTANCE
        </button>
      </div>

      <AsciiBox borderColor="border-surface2">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-subtext0 border-b border-surface1 border-dashed">
                <th className="font-normal py-2 px-4 w-24">UUID</th>
                <th className="font-normal py-2 px-4">NAME</th>
                <th className="font-normal py-2 px-4 w-32">NODE</th>
                <th className="font-normal py-2 px-4 w-32">STATUS</th>
                <th className="font-normal py-2 px-4 w-24 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {servers?.map((server) => (
                <tr key={server.id} className="hover:bg-surface0 border-b border-surface1 border-dashed last:border-none group transition-none">
                  <td className="py-3 px-4 text-surface2 font-bold group-hover:text-subtext1">
                    {server.id.split("-")[0]}
                  </td>
                  <td className="py-3 px-4 font-bold text-text group-hover:text-blue">
                    <Link to="/servers/$serverId" params={{ serverId: server.id }} className="hover:underline underline-offset-4">
                      {server.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-subtext0">
                    {server.node_id.split("-")[0]}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={server.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to="/servers/$serverId" params={{ serverId: server.id }} className="text-blue hover:text-mauve font-bold">
                      [ MANAGE ]
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {servers?.length === 0 && (
            <div className="py-8 text-center text-subtext0 font-bold border-t border-surface1 border-dashed mt-2">
              {"( 0 instances running. Network idle. )"}
            </div>
          )}
        </div>
      </AsciiBox>
      
      <div className="text-surface2 text-xs text-right">
        {servers?.length} processes loaded. Let's build something.
      </div>

      <AsciiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="DEPLOY VIRTUAL INSTANCE"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <TerminalInput
              label="Instance Name"
              placeholder="Minecraft Survival"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
            <TerminalInput
              label="Description"
              placeholder="Local play"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-blue text-[10px] font-bold uppercase tracking-wider">Target Node</label>
              <select 
                className="w-full bg-surface0 border border-surface1 px-2 py-2 text-text font-mono focus:outline-none focus:border-mauve"
                value={formData.node_id}
                onChange={e => setFormData({...formData, node_id: e.target.value})}
                required
              >
                <option value="">[ SELECT_NODE ]</option>
                {nodes?.map(n => <option key={n.id} value={n.id}>{n.name} ({n.fqdn})</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-blue text-[10px] font-bold uppercase tracking-wider">Application Type</label>
              <select 
                className="w-full bg-surface0 border border-surface1 px-2 py-2 text-text font-mono focus:outline-none focus:border-mauve"
                value={formData.egg_id}
                onChange={e => setFormData({...formData, egg_id: e.target.value})}
                required
              >
                <option value="">[ SELECT_TEMPLATE ]</option>
                {eggs?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-surface1 border-dashed pt-4 mt-2">
            <span className="text-surface2 text-[10px] font-bold uppercase mb-2 block">Resource Allocation Limits</span>
            <div className="grid grid-cols-3 gap-4">
              <TerminalInput
                label="RAM (MiB)"
                type="number"
                value={formData.limits.memory}
                onChange={e => setFormData({...formData, limits: {...formData.limits, memory: parseInt(e.target.value)}})}
                required
              />
              <TerminalInput
                label="Disk (MiB)"
                type="number"
                value={formData.limits.disk}
                onChange={e => setFormData({...formData, limits: {...formData.limits, disk: parseInt(e.target.value)}})}
                required
              />
              <TerminalInput
                label="CPU %"
                type="number"
                value={formData.limits.cpu}
                onChange={e => setFormData({...formData, limits: {...formData.limits, cpu: parseInt(e.target.value)}})}
                required
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-surface1 border-dashed mt-4">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-subtext0 font-bold hover:underline"
            >
              [ ABORT ]
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending}
              className="text-mauve font-bold hover:underline"
            >
              {createMutation.isPending ? "[ PROVISIONING... ]" : "[ EXECUTE_DEPLOYMENT ]"}
            </button>
          </div>
        </form>
      </AsciiModal>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  
  if (normalized === "running") return <span className="text-green font-bold">[ RUNNING ]</span>;
  if (normalized === "offline") return <span className="text-red font-bold">[ OFFLINE ]</span>;
  if (normalized === "starting" || normalized === "stopping" || normalized === "installing") return <span className="text-yellow font-bold animate-pulse">[ {status.toUpperCase()} ]</span>;

  return <span className="text-subtext0">[{status.toUpperCase()}]</span>;
}
