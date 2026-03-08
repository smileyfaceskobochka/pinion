import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/auth";
import { apiFetch } from "../../lib/api";
import { type Egg } from "../../lib/types";

export const Route = createFileRoute("/admin/eggs")({
  component: AdminEggs,
});

function AdminEggs() {
  const { token } = useAuth();

  const { data: eggs, isLoading } = useQuery({
    queryKey: ["admin", "eggs"],
    queryFn: () => apiFetch<Egg[]>("/api/eggs", {}, token),
    enabled: !!token,
  });

  if (isLoading) return <div className="h-96 animate-pulse bg-neutral-900 rounded-xl" />;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border-subtle pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-display text-white">Application Eggs</h1>
          <p className="text-text-secondary mt-2 font-medium max-w-lg">Manage game server templates and primary deployment configurations.</p>
        </div>
        <button className="btn-brand h-11 px-8 shadow-lg shadow-brand/20">
          Import Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {eggs?.map((egg) => (
          <div key={egg.id} className="card-solid p-8 flex flex-col hover:border-brand/40 transition-all group shadow-xl shadow-black/40">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-border-subtle flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                📦
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-brand transition-colors font-display tracking-tight">{egg.name}</h3>
            </div>
            <p className="text-sm text-text-secondary line-clamp-3 flex-1 mb-8 leading-relaxed font-medium">
              {egg.description || "A standard deployment template for the Pinion orchestration platform."}
            </p>
            <div className="flex justify-between items-center pt-6 border-t border-border-subtle">
              <span className="badge badge-neutral bg-black">JSON-v2</span>
              <button className="text-xs font-black text-white hover:text-brand uppercase tracking-widest transition-colors font-sans">Edit Script</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
