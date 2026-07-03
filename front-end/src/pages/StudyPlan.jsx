import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { PROGRAMS, getRecommendedProgram } from "../config/programs";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import { WeakThemesDetail } from "../components/ThemeProgress";
import { getWeakThemeDetails } from "../utils/themeAnalytics";

function readLocalTestData() {
  const score = Number(localStorage.getItem("userScore") || 0);
  let weakThemes = [];
  try {
    const raw = localStorage.getItem("weakThemes");
    weakThemes = raw ? JSON.parse(raw) : [];
  } catch {
    weakThemes = [];
  }
  return { score, weakThemes };
}

export default function StudyPlan() {
  const navigate = useNavigate();
  const { user, markProgramChosen, refreshProfile } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (user?.has_chosen_program) {
      navigate("/agenda", { replace: true });
      return;
    }

    let cancelled = false;

    async function load() {
      setLoadingData(true);
      try {
        const data = await api.getTestResult();
        if (!cancelled && data.testResult) {
          setTestResult(data.testResult);
          localStorage.setItem("userScore", String(data.testResult.score));
          localStorage.setItem("weakThemes", JSON.stringify(data.testResult.weak_themes || []));
          localStorage.setItem("selectedProgram", data.testResult.recommended_program);
        }
      } catch {
        if (!cancelled) {
          const local = readLocalTestData();
          const programId = getRecommendedProgram(local.score);
          setTestResult({
            score: local.score,
            correct_count: null,
            total_count: null,
            weak_themes: local.weakThemes.length ? local.weakThemes : ["variables", "conditions"],
            recommended_program: programId
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const assignedProgram = useMemo(() => {
    const programId = testResult?.recommended_program || getRecommendedProgram(testResult?.score || 0);
    return PROGRAMS.find((item) => item.id === programId) || PROGRAMS[1];
  }, [testResult]);

  async function continueToAgenda() {
    if (!user?.id) {
      setError("Session expirée. Reconnectez-vous.");
      return;
    }

    const weakThemes =
      testResult?.weak_themes?.length > 0
        ? testResult.weak_themes
        : readLocalTestData().weakThemes;

    setLoading(true);
    setError("");

    async function persistProgram(data, chosenProgram) {
      localStorage.setItem("studySessions", JSON.stringify(data.sessions));
      localStorage.setItem("programId", String(data.programId));
      localStorage.setItem("selectedProgram", chosenProgram);
      markProgramChosen(data.programId);
      await refreshProfile();
      navigate("/agenda");
    }

    try {
      if (user.has_chosen_program && user.program_id) {
        const existing = await api.getCurrentProgram();
        await persistProgram(existing, assignedProgram.id);
        return;
      }

      const data = await api.createStudyProgram({
        weakThemes,
        program: assignedProgram.id
      });
      await persistProgram(data, assignedProgram.id);
    } catch (err) {
      try {
        const existing = await api.getCurrentProgram();
        await persistProgram(existing, assignedProgram.id);
      } catch {
        setError(err.message || "Impossible de générer votre programme.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="page-container flex min-h-[40vh] items-center justify-center">
        <p className="text-udbl-muted">Préparation de votre programme...</p>
      </div>
    );
  }

  const score = testResult?.score ?? 0;
  const weakThemeDetails = getWeakThemeDetails(testResult);

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        badge={user?.preferred_language ? `Parcours ${user.preferred_language}` : "Étape 2"}
        title="Votre programme sur mesure"
        subtitle="Résultats du test et parcours généré automatiquement pour vous"
      />

      <div className="space-y-6">
        <div className="card card-body text-center">
          <span className="badge-green">Test d&apos;entrée terminé</span>
          <div className="my-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-udbl-blue to-udbl-green text-3xl font-bold text-white shadow-lg">
            {score}%
          </div>
          {testResult?.correct_count != null && testResult?.total_count != null && (
            <p className="text-udbl-muted">
              {testResult.correct_count} / {testResult.total_count} bonnes réponses
            </p>
          )}

          {weakThemeDetails.length > 0 && (
            <div className="mt-6">
              <WeakThemesDetail items={weakThemeDetails} />
            </div>
          )}
        </div>

        <div className="card card-body">
          <p className="text-xs font-semibold uppercase tracking-wide text-udbl-muted">
            Programme assigné
          </p>
          <div className="mt-4 flex items-start gap-4">
            <span className="text-3xl">{assignedProgram.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-udbl-blue">{assignedProgram.title}</h2>
              <p className="mt-1 text-sm text-udbl-muted">{assignedProgram.desc}</p>
              <p className="mt-3 text-sm text-udbl-dark">
                {assignedProgram.sessions} leçon(s) générées sur vos lacunes en{" "}
                {user?.preferred_language || "votre langage"}.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-udbl-blue/20 bg-udbl-blue/5 px-4 py-3 text-sm text-udbl-dark">
          Votre programme est choisi automatiquement selon votre score. Cliquez sur Suivant pour
          planifier vos séances.
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="button"
          onClick={continueToAgenda}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Génération du programme..." : "Suivant → Planifier mon agenda"}
        </button>
      </div>
    </div>
  );
}
