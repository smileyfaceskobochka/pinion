import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/auth";
import { apiFetch } from "../../../lib/api";
import { type FileItem } from "../../../lib/types";

export const Route = createFileRoute("/servers/$serverId/files")({
  component: ServerFiles,
});

function ServerFiles() {
  const { serverId } = useParams({ from: "/servers/$serverId/files" });
  const { token } = useAuth();
  const [path, setPath] = useState("/");

  const { data: files, isLoading } = useQuery({
    queryKey: ["files", serverId, path],
    queryFn: () => apiFetch<FileItem[]>(`/api/servers/${serverId}/files?path=${path}`, {}, token),
    enabled: !!token,
  });

  const handleFolderClick = (name: string) => {
    setPath(path === "/" ? `/${name}` : `${path}/${name}`);
  };

  const handleBack = () => {
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    setPath("/" + parts.join("/"));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-full bg-neutral-900 rounded-lg" />
        <div className="h-96 w-full bg-neutral-900 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Explicit Path Breadcrumbs */}
      <div className="flex items-center gap-3 bg-neutral-900 border border-border-subtle px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-text-secondary">
        <button 
          onClick={() => setPath("/")}
          className="hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span>📁</span> root
        </button>
        {path.split("/").filter(Boolean).map((part, i, arr) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="text-text-tertiary">/</span>
            <button 
              onClick={() => setPath("/" + arr.slice(0, i+1).join("/"))}
              className="hover:text-white transition-colors"
            >
              {part}
            </button>
          </div>
        ))}
      </div>

      {/* Solid File Table Component */}
      <div className="card-solid overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm font-medium">
          <thead className="bg-black border-b border-border-subtle text-text-tertiary text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-4">Name</th>
              <th className="px-8 py-4 text-right">Size</th>
              <th className="px-8 py-4 text-right">Modified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {path !== "/" && (
              <tr 
                onClick={handleBack}
                className="hover:bg-neutral-900 cursor-pointer transition-colors group"
              >
                <td className="px-8 py-4 flex items-center gap-4 text-brand">
                  <span className="text-lg">📁</span>
                  <span className="font-bold underline decoration-brand/30 underline-offset-4">..</span>
                </td>
                <td colSpan={2} />
              </tr>
            )}
            {files?.sort((a, b) => (b.is_directory ? 1 : 0) - (a.is_directory ? 1 : 0)).map((file) => (
              <tr 
                key={file.name}
                onClick={() => file.is_directory ? handleFolderClick(file.name) : null}
                className={`hover:bg-neutral-900 transition-colors group ${file.is_directory ? 'cursor-pointer' : ''}`}
              >
                <td className="px-8 py-4 flex items-center gap-4">
                  <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity">
                    {file.is_directory ? "📁" : "📄"}
                  </span>
                  <span className={file.is_directory ? "font-bold text-white group-hover:text-brand transition-colors" : "text-text-secondary group-hover:text-white"}>
                    {file.name}
                  </span>
                </td>
                <td className="px-8 py-4 text-right text-text-tertiary font-mono text-xs">
                  {file.is_file ? formatSize(file.size) : "-"}
                </td>
                <td className="px-8 py-4 text-right text-text-tertiary text-xs font-mono">
                  {new Date(file.modified).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
