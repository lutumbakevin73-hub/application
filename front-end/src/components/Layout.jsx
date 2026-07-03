import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import JourneyProgress from "./JourneyProgress";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { PUBLIC_PATHS } from "../config/journey";

export default function Layout() {
  const { token, isAdmin, hasSavedAgenda, profileLoading } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublicPath = PUBLIC_PATHS.includes(location.pathname);
  const showSidebar = Boolean(token && !isAdmin && hasSavedAgenda);
  const showJourneyProgress = Boolean(
    token && !isAdmin && !hasSavedAgenda && !profileLoading && !isPublicPath
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onMenuToggle={() => setMobileOpen((v) => !v)}
        showSidebar={showSidebar}
      />

      {showJourneyProgress && <JourneyProgress />}

      <div className="flex flex-1 min-h-0">
        {showSidebar && (
          <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        )}

        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 pb-8">
            <Outlet />
          </main>

          <footer className="border-t border-slate-200/80 bg-white/80 py-6 text-center text-sm text-udbl-muted">
            <div className="flex justify-center mb-2">
              <Logo size="sm" showText={false} />
            </div>
            <p className="font-medium text-udbl-blue">UDBL Learning</p>
            <p className="mt-2 text-xs">Université Don Bosco de Lubumbashi</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
