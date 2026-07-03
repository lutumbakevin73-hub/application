import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {
    to: "/admin",
    label: "Tableau de bord",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    to: "/admin/users",
    label: "Utilisateurs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    )
  },
  {
    to: "/admin/agendas",
    label: "Agendas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    )
  },
  {
    to: "/admin/progress",
    label: "Progression",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-6" />
      </svg>
    )
  },
  {
    to: "/admin/sessions",
    label: "Séances",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    )
  }
];

export default function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-udbl-dark text-white">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">Espace admin</p>
              <p className="text-sm font-semibold">UDBL Learning</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-xs text-white/70 md:inline">{user.email}</span>
            )}
            <button type="button" onClick={handleLogout} className="btn-outline border-white/30 text-white text-sm py-2 px-3 hover:bg-white/10">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white lg:block">
          <p className="px-4 pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-udbl-muted">
            Administration
          </p>
          <nav className="flex flex-col gap-1 px-3 pb-6">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    isActive
                      ? "bg-udbl-blue text-white"
                      : "text-udbl-muted hover:bg-slate-100 hover:text-udbl-blue"
                  }`
                }
              >
                <span className="shrink-0 opacity-90">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <nav className="flex flex-wrap gap-2">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      isActive ? "bg-udbl-blue text-white" : "bg-slate-100 text-udbl-muted"
                    }`
                  }
                >
                  <span className="shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="page-container max-w-6xl py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
