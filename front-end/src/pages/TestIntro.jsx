import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

export default function TestIntro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const language = user?.preferred_language || "C";

  async function startTest() {
    setLoading(true);
    setError("");
    try {
      const data = await api.startTest();
      localStorage.setItem("currentTest", JSON.stringify(data.questions));
      localStorage.setItem("learningLanguage", data.language || language);
      navigate("/quiz");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        badge={`Parcours ${language}`}
        title="Évaluation de vos connaissances"
        subtitle={`Test de niveau en ${language} — 10 questions pour identifier vos lacunes`}
      />

      <div className="mb-6 max-w-2xl mx-auto rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Ce test ne se passe qu&apos;une seule fois, entièrement en {language}. Tant qu&apos;il
        n&apos;est pas terminé, le programme, les cours et l&apos;agenda restent verrouillés.
      </div>

      <div className="card max-w-2xl mx-auto">
        <div className="card-body text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-udbl-blue/10 text-2xl">
            📝
          </div>
          <p className="text-udbl-muted leading-relaxed">
            Ce test comprend des QCM et des exercices pratiques en {language}. Vos résultats
            serviront à générer un programme de renforcement personnalisé dans le même langage.
          </p>

          <ul className="mt-6 space-y-2 text-left text-sm text-udbl-muted">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-udbl-blue" />
              5 questions QCM ({language})
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-udbl-green" />
              5 exercices de code ({language})
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-udbl-blue" />
              Correction IA pour le code
            </li>
          </ul>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            onClick={startTest}
            disabled={loading}
            className="btn-primary mt-8 min-w-[200px]"
          >
            {loading ? "Préparation..." : `Commencer le test ${language}`}
          </button>
        </div>
      </div>
    </div>
  );
}
