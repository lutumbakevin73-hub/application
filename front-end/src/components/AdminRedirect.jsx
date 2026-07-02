import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminRedirect({ children }) {
  const { user, profileLoading, token } = useAuth();

  if (token && profileLoading) {
    return (
      <div className="page-container flex min-h-[40vh] items-center justify-center">
        <p className="text-udbl-muted">Chargement...</p>
      </div>
    );
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
