import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "preact/hooks";
import { useAuth } from "../context/auth";
import { apiFetch } from "../lib/api";

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

  const handleSubmit = async (e: Event) => {
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
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-[420px] space-y-8">
        {/* Branding Area */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand rounded-2xl shadow-xl shadow-brand/20 mb-4">
            <span className="text-2xl font-black text-white">P</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display">
            {isLogin ? "Sign in to Pinion" : "Create your account"}
          </h1>
          <p className="text-text-secondary text-sm font-medium">
            {isLogin ? "Welcome back. Manage your game infrastructure." : "Get started with high-performance game hosting."}
          </p>
        </div>

        {/* Auth Card */}
        <div className="card-solid p-8 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onInput={(e) => setUsername(e.currentTarget.value)}
                  placeholder="admin"
                  className="input-field"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onInput={(e) => setEmail(e.currentTarget.value)}
                placeholder="admin@pinion.local"
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Password</label>
              <input
                type="password"
                value={password}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder="••••••••••••"
                className="input-field"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-brand h-11 text-sm font-bold shadow-lg shadow-brand/20"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                isLogin ? "Sign In" : "Register Account"
              )}
            </button>
          </form>

          {/* Toggle Area */}
          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs font-semibold text-text-secondary hover:text-white transition-colors uppercase tracking-widest"
            >
              {isLogin ? "Need an account? Register" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-text-tertiary">
          Secure, low-latency, distributed game server orchestration.
        </p>
      </div>
    </div>
  );
}
