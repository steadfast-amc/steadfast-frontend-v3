import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { Role } from "../types";

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;

  return <>{children}</>;
}
