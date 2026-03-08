import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../context/auth";
import { apiFetch } from "../../lib/api";
import { type Node } from "../../lib/types";
import { AsciiBox } from "../../components/AsciiBox";
import { AsciiModal } from "../../components/AsciiModal";
import { TerminalInput } from "../../components/TerminalInput";

export const Route = createFileRoute("/admin/nodes")({
  component: AdminNodes,
});

function AdminNodes() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    fqdn: "",
    port: 8080,
    daemon_token: "",
    memory: 16384,
    disk: 100000,
  });

  const { data: nodes, isLoading } = useQuery({
    queryKey: ["admin", "nodes"],
    queryFn: () => apiFetch<Node[]>("/api/nodes", {}, token),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (newNode: typeof formData) => 
      apiFetch("/api/nodes", {
        method: "POST",
        body: JSON.stringify({ ...newNode, public: true }),
      }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "nodes"] });
      setIsModalOpen(false);
      setFormData({ name: "", fqdn: "", port: 8080, daemon_token: "", memory: 16384, disk: 100000 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) return <div className="text-subtext0 animate-pulse">{"> Polling node daemons..."}</div>;

  return (
    <div className="space-y-6 text-sm">
      <div className="flex justify-between items-center bg-surface0 p-2 border border-surface1">
        <span className="text-mauve font-bold">~/pinion/admin/nodes</span>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ascii-btn-primary font-bold text-xs uppercase"
        >
          + REGISTER DAEMON
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {nodes?.map((node) => (
          <AsciiBox key={node.id} title={node.name} borderColor="border-surface2">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-surface1 border-dashed pb-4">
                <div>
                  <div className="text-text font-bold">{node.fqdn}</div>
                  <div className="text-surface2 text-xs mt-1">ID: {node.id.split("-")[0]}</div>
                </div>
                <div className={`font-bold ${node.public ? 'text-green' : 'text-yellow'}`}>
                  [{node.public ? ' PUBLIC ' : ' PRIVATE '}]
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-blue font-bold">PING</div>
                  <div className="text-text">14ms</div>
                </div>
                <div>
                  <div className="text-blue font-bold">SYSLOAD</div>
                  <div className="text-text">1.24 0.98 0.44</div>
                </div>
                <div>
                  <div className="text-blue font-bold">RAM</div>
                  <div className="text-text">{Math.round(node.memory / 1024)}GB TOTAL</div>
                </div>
                <div>
                  <div className="text-blue font-bold">DISK</div>
                  <div className="text-text">{Math.round(node.disk / 1024)}GB TOTAL</div>
                </div>
              </div>

              <div className="pt-4 border-t border-surface1 border-dashed text-right flex gap-3 justify-end mt-2">
                <button className="text-subtext0 hover:text-text hover:underline underline-offset-4">
                  [ SSH ]
                </button>
                <button className="text-blue hover:text-mauve font-bold hover:underline underline-offset-4">
                  [ CONFIGURE ]
                </button>
              </div>
            </div>
          </AsciiBox>
        ))}
      </div>

      <AsciiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="REGISTER NEW NODE DAEMON"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TerminalInput
              label="Node Name"
              placeholder="Primary Production Cluster"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
            <TerminalInput
              label="FQDN / IP"
              placeholder="127.0.0.1"
              value={formData.fqdn}
              onChange={e => setFormData({...formData, fqdn: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <TerminalInput
              label="Daemon Port"
              type="number"
              value={formData.port}
              onChange={e => setFormData({...formData, port: parseInt(e.target.value)})}
              required
            />
            <TerminalInput
              label="Daemon Token"
              type="password"
              placeholder="****************"
              value={formData.daemon_token}
              onChange={e => setFormData({...formData, daemon_token: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TerminalInput
              label="Total Memory (MiB)"
              type="number"
              value={formData.memory}
              onChange={e => setFormData({...formData, memory: parseInt(e.target.value)})}
              required
            />
            <TerminalInput
              label="Total Disk (MiB)"
              type="number"
              value={formData.disk}
              onChange={e => setFormData({...formData, disk: parseInt(e.target.value)})}
              required
            />
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
              {createMutation.isPending ? "[ EXECUTING... ]" : "[ REGISTER_SYSTEM ]"}
            </button>
          </div>
        </form>
      </AsciiModal>
    </div>
  );
}
