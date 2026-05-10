import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isExpired = useAuthStore((s) => s.isExpired);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  useEffect(() => {
    if (!token || !expiresAt) return;
    const timeout = expiresAt - Date.now() - 10_000;
    if (timeout <= 0) {
      clearAuth();
      return;
    }
    const timer = setTimeout(() => clearAuth(), timeout);
    return () => clearTimeout(timer);
  }, [token, expiresAt, clearAuth]);

  if (!isInitialized) return null;

  if (!token || isExpired()) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
