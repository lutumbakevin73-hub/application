import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

const NAV_ITEMS = [
  {
    to: "/sessions",
    label: "Cours",
    paths: ["/sessions"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        <path d="M8 7h6M8 11h4" />
      </svg>
    )
  },
  {
    to: "/agenda",
    label: "Agenda",
    paths: ["/agenda"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    )
  }
];

function isActive(pathname, paths) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay lg:hidden"
          onClick={onClose}
          aria-label="Fermer le menu"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Logo size="sm" />
        </div>

        <p className="sidebar-section">Navigation</p>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = isActive(location.pathname, item.paths);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
