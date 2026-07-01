import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { api } from "../api/client";

import { useAuth } from "../context/AuthContext";

import PageHeader from "../components/PageHeader";



const PROGRAMS = [

  { id: "prog1", title: "1–2 jours", desc: "Lacunes légères", icon: "🟢" },

  { id: "prog2", title: "3 jours", desc: "Lacunes modérées", icon: "🔵" },

  { id: "prog3", title: "5 jours", desc: "Lacunes importantes", icon: "🟡" },

  { id: "prog4", title: "7 jours", desc: "Grandes lacunes", icon: "🔴" }

];



function getRecommended(score) {

  if (score >= 80) return "prog1";

  if (score >= 60) return "prog2";

  if (score >= 40) return "prog3";

  return "prog4";

}



export default function StudyPlan() {

  const navigate = useNavigate();

  const { user, markProgramChosen, refreshProfile } = useAuth();

  const score = Number(localStorage.getItem("userScore") || 50);

  const weakThemes = useMemo(() => {
    try {
      const raw = localStorage.getItem("weakThemes");
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore invalid localStorage
    }
    return ["variables", "conditions", "boucles", "fonctions"];
  }, []);



  const recommended = getRecommended(score);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);



  async function chooseProgram(programId) {
    const isTooShort = score < 40 && (programId === "prog1" || programId === "prog2");
    const isTooLong = score >= 80 && (programId === "prog3" || programId === "prog4");

    if (isTooShort || isTooLong) {
      setError("Ce programme n'est pas adapté à votre niveau.");
      return;
    }

    if (!user?.id) {
      setError("Session expirée. Reconnectez-vous.");
      return;
    }

    setLoading(true);
    setError("");

    async function persistProgram(data) {
      localStorage.setItem("studySessions", JSON.stringify(data.sessions));
      localStorage.setItem("programId", String(data.programId));
      localStorage.setItem("selectedProgram", programId);
      markProgramChosen(data.programId);
      await refreshProfile();
      navigate("/agenda");
    }

    try {
      if (user.has_chosen_program && user.program_id) {
        try {
          const existing = await api.getCurrentProgram();
          await persistProgram(existing);
          return;
        } catch {
          // pas encore en base, on tente la création
        }
      }

      const data = await api.createStudyProgram({ weakThemes });
      await persistProgram(data);
    } catch (err) {
      try {
        const existing = await api.getCurrentProgram();
        await persistProgram(existing);
      } catch {
        setError(err.message || "Impossible de créer le programme.");
      }
    } finally {
      setLoading(false);
    }
  }



  return (

    <div className="page-container">

      <PageHeader

        badge="Étape 2"

        title="Programme personnalisé"

        subtitle={`Score au test : ${score}% — choisissez votre rythme (une seule fois)`}

      />



      <div className="mb-6 max-w-3xl rounded-xl border border-udbl-blue/20 bg-udbl-blue/5 px-4 py-3 text-sm text-udbl-dark">

        Après votre choix, vos cours seront générés et vous passerez à la planification de l&apos;agenda.

      </div>



      {error && (

        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>

      )}



      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {PROGRAMS.map((p) => {

          const isRec = p.id === recommended;

          return (

            <div

              key={p.id}

              className={`card card-body relative transition hover:shadow-xl ${

                isRec ? "ring-2 ring-udbl-green shadow-udbl-green/20" : ""

              }`}

            >

              {isRec && (

                <span className="absolute -top-2 right-3 badge-green shadow-sm">

                  Recommandé

                </span>

              )}

              <span className="text-2xl">{p.icon}</span>

              <h3 className="mt-2 font-bold text-udbl-blue">{p.title}</h3>

              <p className="text-sm text-udbl-muted mt-1">{p.desc}</p>

              <button

                disabled={loading}

                onClick={() => chooseProgram(p.id)}

                className={`mt-4 w-full ${isRec ? "btn-success" : "btn-primary"}`}

              >

                {loading ? "Génération..." : "Choisir"}

              </button>

            </div>

          );

        })}

      </div>

    </div>

  );

}

