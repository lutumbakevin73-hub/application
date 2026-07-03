import { Navigate, useLocation } from "react-router-dom";
import { getJourneyPath, useAuth } from "../context/AuthContext";

function AuthLoading() {
  return (
    <div className="page-container flex min-h-[40vh] items-center justify-center">
      <p className="text-udbl-muted">Chargement...</p>
    </div>
  );
}

function AuthGate({ children, redirectIf }) {
  const { token, user, profileLoading } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profileLoading) {
    return <AuthLoading />;
  }

  const target = redirectIf(user);
  if (target) {
    return <Navigate to={target} replace />;
  }

  return children;
}

export default function ProtectedRoute({ children }) {
  const { token, profileLoading } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profileLoading) {
    return <AuthLoading />;
  }

  return children;
}

function redirectAdmin(user) {
  if (user?.role === "admin") {
    return "/admin";
  }
  return null;
}

export function LanguagePendingOnly({ children }) {
  return (
    <AuthGate
      redirectIf={(user) => {
        const admin = redirectAdmin(user);
        if (admin) return admin;
        if (user?.preferred_language || user?.has_passed_test) {
          return getJourneyPath(user);
        }
        return null;
      }}
    >
      {children}
    </AuthGate>
  );
}

export function TestPendingOnly({ children }) {
  return (
    <AuthGate
      redirectIf={(user) => {
        const admin = redirectAdmin(user);
        if (admin) return admin;
        if (user?.has_passed_test) {
          return getJourneyPath(user);
        }
        if (!user?.preferred_language) {
          return "/language";
        }
        return null;
      }}
    >
      {children}
    </AuthGate>
  );
}

export function RequireProgramPending({ children }) {
  return (
    <AuthGate
      redirectIf={(user) => {
        const admin = redirectAdmin(user);
        if (admin) return admin;
        if (!user?.has_passed_test) {
          return getJourneyPath(user);
        }
        if (user?.has_chosen_program) {
          return user.has_saved_agenda ? "/sessions" : "/agenda";
        }
        return null;
      }}
    >
      {children}
    </AuthGate>
  );
}

export function RequireProgramChosen({ children }) {
  return (
    <AuthGate
      redirectIf={(user) => {
        const admin = redirectAdmin(user);
        if (admin) return admin;
        if (!user?.has_passed_test) {
          return getJourneyPath(user);
        }
        if (!user?.has_chosen_program) {
          return "/plan";
        }
        return null;
      }}
    >
      {children}
    </AuthGate>
  );
}

export function RequireAgendaSaved({ children }) {
  return (
    <AuthGate
      redirectIf={(user) => {
        const admin = redirectAdmin(user);
        if (admin) return admin;
        if (!user?.has_passed_test) {
          return getJourneyPath(user);
        }
        if (!user?.has_chosen_program) {
          return "/plan";
        }
        if (!user?.has_saved_agenda) {
          return "/agenda";
        }
        return null;
      }}
    >
      {children}
    </AuthGate>
  );
}

export function RequireAgendaPending({ children }) {
  return (
    <AuthGate
      redirectIf={(user) => {
        const admin = redirectAdmin(user);
        if (admin) return admin;
        if (!user?.has_passed_test) {
          return getJourneyPath(user);
        }
        if (!user?.has_chosen_program) {
          return "/plan";
        }
        if (user?.has_saved_agenda) {
          return "/sessions";
        }
        return null;
      }}
    >
      {children}
    </AuthGate>
  );
}

export function RequireAdmin({ children }) {
  return (
    <AuthGate
      redirectIf={(user) => {
        if (user?.role !== "admin") {
          return "/";
        }
        return null;
      }}
    >
      {children}
    </AuthGate>
  );
}
