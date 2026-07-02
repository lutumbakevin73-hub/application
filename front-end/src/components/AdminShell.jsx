import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/admin", label: "Tableau de bord", end: true },
  { to: "/admin/users", label: "Utilisateurs" },
  { to: "/admin/agendas", label: "Agendas" },
  { to: "/admin/sessions", label: "Séances" }
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
                  `rounded-xl px-4 py-3 text-sm font-medium ${
                    isActive
                      ? "bg-udbl-blue text-white"
                      : "text-udbl-muted hover:bg-slate-100 hover:text-udbl-blue"
                  }`
                }
              >
                {item.label}
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
                    `rounded-lg px-3 py-1.5 text-xs font-medium ${
                      isActive ? "bg-udbl-blue text-white" : "bg-slate-100 text-udbl-muted"
                    }`
                  }
                >
                  {item.label}
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
