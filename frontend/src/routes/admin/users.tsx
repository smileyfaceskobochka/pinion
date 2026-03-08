import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/auth";
import { apiFetch } from "../../lib/api";

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

  if (isLoading) return <div className="h-96 animate-pulse bg-neutral-900 rounded-xl" />;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border-subtle pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight font-display text-white">Identity & Access</h1>
          <p className="text-text-secondary mt-2 font-medium max-w-lg">Manage user accounts, administrative privileges, and security policies.</p>
        </div>
        <button className="btn-brand h-11 px-8 shadow-lg shadow-brand/20">
          Create User Account
        </button>
      </div>

      <div className="card-solid overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm font-medium">
          <thead className="bg-black border-b border-border-subtle text-text-tertiary text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-4 font-black">Identity</th>
              <th className="px-8 py-4 font-black">Email Contact</th>
              <th className="px-8 py-4 font-black text-center">Authorization</th>
              <th className="px-8 py-4 text-right font-black">Provisioned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-900 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-sm font-black border border-border-subtle shadow-inner">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="font-bold text-white group-hover:text-brand transition-colors font-display text-lg">{user.username}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-text-secondary font-medium">{user.email}</td>
                <td className="px-8 py-5 text-center">
                  <span className={`badge ${user.root_admin ? 'badge-brand bg-brand/10 text-brand border-brand/20' : 'badge-neutral bg-black'}`}>
                    {user.root_admin ? 'Infrastructure Admin' : 'Standard User'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right text-text-tertiary text-xs font-mono">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
