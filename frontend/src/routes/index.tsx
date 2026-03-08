import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "../context/auth";

export const Route = createFileRoute("/")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/servers" />;
  }

  return <Navigate to="/auth" />;
}
