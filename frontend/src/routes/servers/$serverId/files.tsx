import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/auth";
import { apiFetch } from "../../../lib/api";
import { type FileItem } from "../../../lib/types";
import { AsciiBox } from "../../../components/AsciiBox";

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
    return <div className="text-subtext0 animate-pulse">{"> Scanning file system: " + path}</div>;
  }

  return (
    <div className="space-y-4 text-sm">
      
      {/* Path Breadcrumbs */}
      <div className="flex items-center gap-2 bg-surface0 border border-surface1 p-2">
        <span className="text-mauve font-bold">~/pinion/vols/{serverId.split("-")[0]}</span>
        <span className="text-surface2">/</span>
        <button 
          onClick={() => setPath("/")}
          className="hover:text-text hover:underline underline-offset-4"
        >
          root
        </button>
        {path.split("/").filter(Boolean).map((part, i, arr) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-surface2">/</span>
            <button 
              onClick={() => setPath("/" + arr.slice(0, i+1).join("/"))}
              className="hover:text-text hover:underline underline-offset-4"
            >
              {part}
            </button>
          </div>
        ))}
      </div>

      {/* File Table */}
      <AsciiBox borderColor="border-surface2">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-subtext0 border-b border-surface1 border-dashed">
                <th className="font-normal py-2 px-4 w-8">T</th>
                <th className="font-normal py-2 px-4">FILENAME</th>
                <th className="font-normal py-2 px-4 w-32 text-right">SIZE</th>
                <th className="font-normal py-2 px-4 w-48 text-right">MODIFIED</th>
              </tr>
            </thead>
            <tbody>
              {path !== "/" && (
                <tr 
                  onClick={handleBack}
                  className="hover:bg-surface0 border-b border-surface1 border-dashed cursor-pointer transition-none"
                >
                  <td className="py-2 px-4 text-blue font-bold">d</td>
                  <td className="py-2 px-4 text-blue font-bold">..</td>
                  <td colSpan={2} />
                </tr>
              )}
              {files?.sort((a, b) => (b.is_directory ? 1 : 0) - (a.is_directory ? 1 : 0)).map((file) => (
                <tr 
                  key={file.name}
                  onClick={() => file.is_directory ? handleFolderClick(file.name) : null}
                  className={`hover:bg-surface0 border-b border-surface1 border-dashed last:border-none transition-none ${file.is_directory ? 'cursor-pointer' : ''}`}
                >
                  <td className="py-2 px-4 font-bold">
                    <span className={file.is_directory ? "text-blue" : "text-surface2"}>
                      {file.is_directory ? "d" : "-"}
                    </span>
                  </td>
                  <td className={`py-2 px-4 font-bold ${file.is_directory ? 'text-blue' : 'text-text'}`}>
                    {file.is_directory ? `${file.name}/` : file.name}
                  </td>
                  <td className="py-2 px-4 text-right text-subtext0">
                    {file.is_file ? formatSize(file.size) : "4.0K"}
                  </td>
                  <td className="py-2 px-4 text-right text-subtext0">
                    {new Date(file.modified).toISOString().replace("T", " ").substring(0, 19)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {files?.length === 0 && (
            <div className="py-8 text-center text-subtext0 border-t border-surface1 border-dashed mt-2">
              {"( empty directory )"}
            </div>
          )}
        </div>
      </AsciiBox>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0.0K";
  const k = 1024;
  const sizes = ["B", "K", "M", "G"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}
