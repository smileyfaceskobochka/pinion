import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../context/auth";
import { apiFetch } from "../../lib/api";
import { type Egg } from "../../lib/types";
import { AsciiBox } from "../../components/AsciiBox";
import { AsciiModal } from "../../components/AsciiModal";
import { TerminalInput } from "../../components/TerminalInput";

export const Route = createFileRoute("/admin/eggs")({
  component: AdminEggs,
});

function AdminEggs() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    author: "Pinion System",
    description: "",
    docker_image: "",
    startup: "",
  });

  const { data: eggs, isLoading } = useQuery({
    queryKey: ["admin", "eggs"],
    queryFn: () => apiFetch<Egg[]>("/api/eggs", {}, token),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (newEgg: typeof formData) =>
      apiFetch("/api/eggs", {
        method: "POST",
        body: JSON.stringify({ ...newEgg, config: {}, variables: [] }),
      }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "eggs"] });
      setIsModalOpen(false);
      setFormData({ name: "", author: "Pinion System", description: "", docker_image: "", startup: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) return <div className="text-subtext0 animate-pulse">{"> Parsing global template registry..."}</div>;

  return (
    <div className="space-y-6 text-sm">
      <div className="flex justify-between items-center bg-surface0 p-2 border border-surface1">
        <span className="text-mauve font-bold">~/pinion/admin/eggs</span>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ascii-btn-primary font-bold text-xs uppercase"
        >
          + IMPORT CONFIG
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {eggs?.map((egg) => (
          <AsciiBox key={egg.id} title={egg.name} borderColor="border-surface2">
            <div className="flex flex-col h-40">
              <div className="text-[10px] text-mauve/60 mb-1">AUTHOR: {egg.author}</div>
              <div className="flex-1 text-text mb-4 mt-2 overflow-hidden text-ellipsis line-clamp-3">
                <span className="text-surface2">{">"}</span> {egg.description || "Default application configuration block."}
              </div>

              <div className="pt-4 border-t border-surface1 border-dashed flex justify-between items-end mt-auto">
                <div className="text-[10px] text-yellow font-bold uppercase tracking-widest bg-yellow/10 px-1 border border-yellow/20">
                  {egg.docker_image.split(':').pop() || "latest"}
                </div>
                <button className="text-blue hover:text-mauve font-bold hover:underline underline-offset-4">
                  [ vi init.sh ]
                </button>
              </div>
            </div>
          </AsciiBox>
        ))}
      </div>

      <AsciiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="IMPORT NEW EGG TEMPLATE"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TerminalInput
              label="Template Name"
              placeholder="Minecraft Paper 1.20"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
            <TerminalInput
              label="Author"
              value={formData.author}
              onChange={e => setFormData({...formData, author: e.target.value})}
              required
            />
          </div>
          
          <TerminalInput
            label="Description"
            placeholder="High-performance Minecraft server implementation."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />

          <TerminalInput
            label="Docker Image"
            placeholder="ghcr.io/pterodactyl/yolks:java_17"
            value={formData.docker_image}
            onChange={e => setFormData({...formData, docker_image: e.target.value})}
            required
          />

          <TerminalInput
            label="Startup Command"
            placeholder="java -Xms128M -Xmx1024M -jar server.jar"
            value={formData.startup}
            onChange={e => setFormData({...formData, startup: e.target.value})}
            required
          />

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
              {createMutation.isPending ? "[ EXECUTING... ]" : "[ IMPORT_TEMPLATE ]"}
            </button>
          </div>
        </form>
      </AsciiModal>
    </div>
  );
}
