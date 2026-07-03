import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, parseJwt } from "../api/client";

const AuthContext = createContext(null);

function syncProgramStorage(profile) {
  if (profile?.program_id) {
    localStorage.setItem("programId", String(profile.program_id));
  }
}

async function syncStudySessions(profile) {
  if (profile?.role === "admin" || !profile?.has_chosen_program) {
    return;
  }

  const raw = localStorage.getItem("studySessions");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return;
      }
    } catch {
      // continue
    }
  }

  try {
    const data = await api.getCurrentProgram();
    if (data.sessions?.length) {
      localStorage.setItem("studySessions", JSON.stringify(data.sessions));
      if (data.programId) {
        localStorage.setItem("programId", String(data.programId));
      }
    }
  } catch {
    // pas de programme en base
  }
}

export function getJourneyPath(profile) {
  if (profile?.role === "admin") {
    return "/admin";
  }
  if (!profile?.preferred_language && !profile?.has_passed_test) {
    return "/language";
  }
  if (!profile?.has_passed_test) {
    return "/test";
  }
  if (!profile?.has_chosen_program) {
    return "/plan";
  }
  if (!profile?.has_saved_agenda) {
    return "/agenda";
  }
  return "/sessions";
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(Boolean(localStorage.getItem("token")));

  const loadProfile = useCallback(async (activeToken) => {
    if (!activeToken) {
      setUser(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    try {
      const profile = await api.me();
      syncProgramStorage(profile);
      await syncStudySessions(profile);
      setUser(profile);
      return profile;
    } catch {
      setUser(parseJwt(activeToken));
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("token");
      setUser(null);
      setProfileLoading(false);
      return;
    }

    localStorage.setItem("token", token);
    loadProfile(token);
  }, [token, loadProfile]);

  const value = useMemo(
    () => ({
      token,
      user,
      profileLoading,
      hasPassedTest: Boolean(user?.has_passed_test),
      hasChosenProgram: Boolean(user?.has_chosen_program),
      hasSavedAgenda: Boolean(user?.has_saved_agenda),
      isAdmin: user?.role === "admin",
      journeyPath: getJourneyPath(user),
      login: (newToken) => {
        if (newToken) {
          localStorage.setItem("token", newToken);
        }
        setToken(newToken);
      },
      logout: () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setProfileLoading(false);
      },
      refreshProfile: () => loadProfile(token),
      markTestPassed: () =>
        setUser((prev) => (prev ? { ...prev, has_passed_test: true } : prev)),
      markProgramChosen: (programId) => {
        if (programId) {
          localStorage.setItem("programId", String(programId));
        }
        setUser((prev) =>
          prev
            ? {
                ...prev,
                has_chosen_program: true,
                program_id: programId ?? prev.program_id
              }
            : prev
        );
      },
      markAgendaSaved: () =>
        setUser((prev) => (prev ? { ...prev, has_saved_agenda: true } : prev))
    }),
    [token, user, profileLoading, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return ctx;
}
