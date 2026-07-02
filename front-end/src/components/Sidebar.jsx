import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const TEST_ITEM = {
  to: "/test",
  label: "Test",
  paths: ["/test", "/quiz"],
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  )
};

const PROGRAM_ITEM = {
  to: "/plan",
  label: "Programme",
  paths: ["/plan"],
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8M8 11h8" />
    </svg>
  )
};

const AGENDA_ITEM = {
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
};

const COURSES_ITEM = {
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
};

function isActive(pathname, paths) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getNavItems({ profileLoading, hasPassedTest, hasChosenProgram, hasSavedAgenda }) {
  if (profileLoading || !hasPassedTest) {
    return [TEST_ITEM];
  }
  if (!hasChosenProgram) {
    return [PROGRAM_ITEM];
  }
  if (!hasSavedAgenda) {
    return [AGENDA_ITEM];
  }
  return [COURSES_ITEM, AGENDA_ITEM];
}

function getSidebarHint({ profileLoading, hasPassedTest, hasChosenProgram, hasSavedAgenda }) {
  if (profileLoading) {
    return null;
  }
  if (!hasPassedTest) {
    return "Terminez le test pour débloquer le programme.";
  }
  if (!hasChosenProgram) {
    return "Choisissez votre programme pour continuer.";
  }
  if (!hasSavedAgenda) {
    return "Planifiez votre agenda pour accéder aux cours.";
  }
  return null;
}

export default function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation();
  const { hasPassedTest, hasChosenProgram, hasSavedAgenda, profileLoading } = useAuth();

  const navItems = getNavItems({
    profileLoading,
    hasPassedTest,
    hasChosenProgram,
    hasSavedAgenda
  });
  const hint = getSidebarHint({
    profileLoading,
    hasPassedTest,
    hasChosenProgram,
    hasSavedAgenda
  });

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

        <p className="sidebar-section">Parcours</p>

        {hint && (
          <p className="mx-4 mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {hint}
          </p>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item) => {
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
