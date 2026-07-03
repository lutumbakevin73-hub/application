import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

const OPTIONS = [
  {
    id: "C",
    title: "Langage C",
    description: "Test de niveau, cours et exercices entièrement en C.",
    badge: "Système · mémoire · performance"
  },
  {
    id: "Python",
    title: "Python",
    description: "Test de niveau, cours et exercices entièrement en Python.",
    badge: "Lisible · polyvalent · débutant friendly"
  }
];

export default function ChooseLanguage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function choose(language) {
    setLoading(language);
    setError("");
    try {
      await api.chooseLanguage(language);
      await refreshProfile();
      navigate("/test", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        badge="Première étape"
        title="Choisissez votre langage"
        subtitle="Votre test de niveau et tous vos cours suivront ce choix."
      />

      <div className="mb-6 rounded-xl border border-udbl-blue/20 bg-udbl-blue/5 px-4 py-3 text-sm text-udbl-dark">
        Ce choix oriente tout votre parcours : évaluation initiale, programme généré et
        séances de cours. Il ne mélange plus C et Python.
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option.id)}
            disabled={Boolean(loading)}
            className="card card-body text-left transition hover:border-udbl-blue hover:shadow-md disabled:opacity-60"
          >
            <span className="badge-blue mb-3">{option.badge}</span>
            <h2 className="text-xl font-bold text-udbl-blue">{option.title}</h2>
            <p className="mt-2 text-sm text-udbl-muted">{option.description}</p>
            <span className="link mt-4 inline-block text-sm">
              {loading === option.id ? "Enregistrement..." : "Choisir ce langage →"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
