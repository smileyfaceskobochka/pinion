import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/auth";
import { apiFetch } from "../../lib/api";
import { type Node } from "../../lib/types";

export const Route = createFileRoute("/admin/nodes")({
  component: AdminNodes,
});

function AdminNodes() {
  const { token } = useAuth();

  const { data: nodes, isLoading } = useQuery({
    queryKey: ["admin", "nodes"],
    queryFn: () => apiFetch<Node[]>("/api/nodes", {}, token),
    enabled: !!token,
  });

  if (isLoading) return <div className="h-96 animate-pulse bg-neutral-900 rounded-xl" />;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border-subtle pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-display text-white">Infrastructure Nodes</h1>
          <p className="text-text-secondary mt-2 font-medium max-w-lg">Manage distributed compute resources and global edge scaling.</p>
        </div>
        <button className="btn-brand h-11 px-8 shadow-lg shadow-brand/20">
          Provision Node
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {nodes?.map((node) => (
          <div key={node.id} className="card-solid p-8 flex flex-col gap-6 shadow-xl shadow-black/40">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-border-subtle flex items-center justify-center text-2xl shadow-inner">
                  🖥️
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{node.name}</h3>
                  <code className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{node.fqdn}</code>
                </div>
              </div>
              <span className={`badge ${node.public ? 'badge-success' : 'badge-warning'}`}>
                {node.public ? 'Public' : 'Private'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-xl p-4 border border-border-subtle">
                <p className="text-[10px] text-text-tertiary uppercase font-black tracking-[0.2em] mb-2">Connectivity</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  <span className="text-sm font-bold text-white">Operational</span>
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-4 border border-border-subtle">
                <p className="text-[10px] text-text-tertiary uppercase font-black tracking-[0.2em] mb-2">Resource Utilization</p>
                <span className="text-sm font-bold text-white">12% / 64GB</span>
              </div>
            </div>

            <div className="pt-6 border-t border-border-subtle flex justify-end">
              <button className="btn-outline h-9 px-4 text-[10px] uppercase font-bold tracking-widest">
                Configure Node
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
