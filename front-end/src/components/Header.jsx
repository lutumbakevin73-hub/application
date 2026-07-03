import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

export default function Header({ onMenuToggle, showSidebar = false }) {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {showSidebar && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="sidebar-menu-btn lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <Link to="/" className="shrink-0">
            <Logo size="md" />
          </Link>
        </div>

        {!token ? (
          <nav className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-sm py-2 px-4">
              Connexion
            </Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">
              S'inscrire
            </Link>
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-xs text-udbl-muted md:inline max-w-[180px] truncate">
                {user.email}
              </span>
            )}
            <button type="button" onClick={handleLogout} className="btn-outline text-sm py-2 px-3">
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
