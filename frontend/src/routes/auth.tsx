import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../context/auth";
import { apiFetch } from "../lib/api";
import { AsciiBox } from "../components/AsciiBox";

export const Route = createFileRoute("/auth" as any)({
  component: AuthComponent,
});

function AuthComponent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/servers" });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email, password }
        : { email, username, password };

      const response = await apiFetch<{ token: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      login(response.token, {
        id: "placeholder",
        email,
        username: username || email.split("@")[0],
        root_admin: false,
      });

      navigate({ to: "/servers" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-sm">
      <div className="w-full max-w-[500px] space-y-4">

        <div className="text-center font-bold text-mauve whitespace-pre leading-none mb-6">
          {`
░▒▓███████▓▒░░▒▓█▓▒░▒▓███████▓▒░░▒▓█▓▒░░▒▓██████▓▒░░▒▓███████▓▒░  
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓███████▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░ 

`}
        </div>

        <AsciiBox title="[ SYSTEM LOGIN ]" borderColor="border-surface1">
          <div className="mb-6 space-y-1">
            <div className="text-green">guest@pinion:~# ./authenticate --mode={isLogin ? "login" : "register"}</div>
            <div className="text-subtext0">Initializing authentication sequence...</div>
            <div className="text-subtext0">Targeting secure orchestration node.</div>
            {error && <div className="text-red font-bold">ERR: {error}</div>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="flex flex-col gap-1">
                <label className="text-blue font-bold">Username:</label>
                <div className="flex items-center">
                  <span className="text-surface2 mr-2">{">"}</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin_root"
                    className="ascii-input w-full"
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-blue font-bold">Email Address:</label>
              <div className="flex items-center">
                <span className="text-surface2 mr-2">{">"}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pinion.local"
                  className="ascii-input w-full"
                  required
                  autoFocus={isLogin}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-blue font-bold">Password:</label>
              <div className="flex items-center">
                <span className="text-surface2 mr-2">{">"}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="************"
                  className="ascii-input w-full"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-surface1 border-dashed mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-subtext0 hover:text-text underline decoration-surface2 underline-offset-4"
              >
                [{isLogin ? "Switch to Register" : "Switch to Login"}]
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="ascii-btn-primary font-bold"
              >
                {isLoading ? "EXECUTING..." : isLogin ? "LOG IN" : "REGISTER"}
              </button>
            </div>
          </form>
        </AsciiBox>

        <div className="text-center text-subtext0 text-xs">
          PINION ORCHESTRATION {">"} CLI INTERFACE
        </div>
      </div>
    </div>
  );
}
