import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/auth";
import { apiFetch } from "../../lib/api";
import { AsciiBox } from "../../components/AsciiBox";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  root_admin: boolean;
  created_at: string;
}

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { token } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiFetch<UserProfile[]>("/api/users", {}, token),
    enabled: !!token,
  });

  if (isLoading) return <div className="text-subtext0 animate-pulse">{"> Fetching identity matrix..."}</div>;

  return (
    <div className="space-y-6 text-sm">
      <div className="flex justify-between items-center bg-surface0 p-2 border border-surface1">
        <span className="text-mauve font-bold">~/pinion/admin/users</span>
        <button className="ascii-btn-primary font-bold text-xs uppercase">
          + ADD USER
        </button>
      </div>

      <AsciiBox borderColor="border-surface2">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-subtext0 border-b border-surface1 border-dashed">
                <th className="font-normal py-2 px-4">USERNAME</th>
                <th className="font-normal py-2 px-4">EMAIL_ADDR</th>
                <th className="font-normal py-2 px-4 text-center">ROLE</th>
                <th className="font-normal py-2 px-4 text-right">CREATED_AT</th>
                <th className="font-normal py-2 px-4 w-24 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-surface0 border-b border-surface1 border-dashed last:border-none transition-none group">
                  <td className="py-3 px-4 font-bold text-text group-hover:text-blue">
                    {user.username}
                  </td>
                  <td className="py-3 px-4 text-subtext0">
                    {user.email}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.root_admin ? (
                      <span className="text-mauve font-bold">[ ROOT_ADMIN ]</span>
                    ) : (
                      <span className="text-surface2">[ USER ]</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-subtext0">
                    {new Date(user.created_at).toISOString().replace("T", " ").substring(0, 19)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-red hover:text-mauve font-bold">
                      [ DEL ]
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsciiBox>
    </div>
  );
}
