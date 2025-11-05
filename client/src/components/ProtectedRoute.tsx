import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { UserRole } from "@/types/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRoles,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, roles, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setLocation("/");
      return;
    }

    if (requireAdmin && !isAdmin) {
      setLocation("/dashboard");
      return;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) => roles.includes(role));
      if (!hasRequiredRole) {
        setLocation("/dashboard");
        return;
      }
    }
  }, [user, roles, isAdmin, loading, requireAdmin, requiredRoles, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  if (requireAdmin && !isAdmin) return null;

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => roles.includes(role));
    if (!hasRequiredRole) return null;
  }

  return <>{children}</>;
}
