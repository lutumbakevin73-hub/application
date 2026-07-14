import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { PROGRAMS } from "../config/programs";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

const PHASE_LABELS = {
  init: "Préparation",
  generating: "Génération IA",
  session_done: "Leçon terminée",
  sessions_ready: "Finalisation",
  saving: "Enregistrement",
  done: "Terminé",
  error: "Erreur"
};

export default function GeneratingProgram() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, markProgramChosen, refreshProfile } = useAuth();

  const weakThemes = location.state?.weakThemes || [];
  const programId = location.state?.program || "prog2";

  const assignedProgram = useMemo(
    () => PROGRAMS.find((item) => item.id === programId) || PROGRAMS[1],
    [programId]
  );

  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState("Démarrage de la génération...");
  const [phase, setPhase] = useState("init");
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(assignedProgram.sessions);
  const [completedThemes, setCompletedThemes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      navigate("/login", { replace: true });
      return;
    }

    if (!weakThemes.length && !programId) {
      navigate("/plan", { replace: true });
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        for await (const event of api.createStudyProgramStream({
          weakThemes,
          program: programId
        })) {
          if (cancelled) {
            return;
          }

          if (event.phase) {
            setPhase(event.phase);
          }
          if (event.message) {
            setMessage(event.message);
          }
          if (event.percent != null) {
            setPercent(event.percent);
          }
          if (event.current != null) {
            setCurrent(event.current);
          }
          if (event.total != null) {
            setTotal(event.total);
          }

          if (event.phase === "session_done" && event.theme) {
            setCompletedThemes((prev) =>
              prev.includes(event.theme) ? prev : [...prev, event.theme]
            );
          }

          if (event.phase === "error") {
            setError(event.message || "La génération a échoué.");
            return;
          }

          if (event.phase === "done") {
            localStorage.setItem("studySessions", JSON.stringify(event.sessions || []));
            localStorage.setItem("programId", String(event.programId));
            localStorage.setItem("selectedProgram", programId);
            markProgramChosen(event.programId);
            await refreshProfile();
            setTimeout(() => {
              if (!cancelled) {
                navigate("/agenda", { replace: true });
              }
            }, 900);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Impossible de générer le programme.");
          setPhase("error");
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    weakThemes,
    programId,
    navigate,
    markProgramChosen,
    refreshProfile
  ]);

  return (
    <div className="page-container max-w-2xl">
      <PageHeader
        badge="Étape 2"
        title="Création de votre cours"
        subtitle="Génération détaillée leçon par leçon — cela peut prendre plusieurs minutes"
      />

      <div className="card card-body space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-udbl-blue">
              {PHASE_LABELS[phase] || "En cours"}
            </span>
            <span className="text-udbl-muted">{percent}%</span>
          </div>
          <div className="progress-track h-3">
            <div className="progress-fill transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          {total > 0 && (
            <p className="mt-2 text-xs text-udbl-muted">
              Leçon {current}/{total} · Programme {assignedProgram.title}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-udbl-blue/15 bg-udbl-blue/5 px-4 py-4">
          <p className="text-sm font-medium text-udbl-dark">{message}</p>
          <p className="mt-2 text-xs text-udbl-muted">
            Chaque leçon inclut un cours détaillé, des exemples, un exercice et un quiz complet.
            Ne fermez pas cette page.
          </p>
        </div>

        {completedThemes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-udbl-muted">
              Leçons générées
            </p>
            <ul className="space-y-2">
              {completedThemes.map((theme) => (
                <li
                  key={theme}
                  className="flex items-center gap-2 rounded-lg bg-udbl-green/10 px-3 py-2 text-sm text-udbl-green-dark"
                >
                  <span>✓</span>
                  <span>{theme}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase !== "error" && phase !== "done" && (
          <div className="flex items-center justify-center gap-3 py-2 text-sm text-udbl-muted">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-udbl-blue border-t-transparent" />
            Génération en cours...
          </div>
        )}

        {phase === "done" && (
          <p className="text-center text-sm font-medium text-udbl-green-dark">
            Redirection vers la planification de l&apos;agenda...
          </p>
        )}

        {error && (
          <div className="space-y-3">
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            <button type="button" onClick={() => navigate("/plan")} className="btn-outline w-full">
              Retour au programme
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
