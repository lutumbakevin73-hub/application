import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

const SESSION_COUNTS = {
  prog1: 2,
  prog2: 3,
  prog3: 5,
  prog4: 7
};

export default function Agenda() {
  const navigate = useNavigate();
  const { user, markAgendaSaved, refreshProfile } = useAuth();
  const program = localStorage.getItem("selectedProgram") || "prog2";
  const count = SESSION_COUNTS[program] || 3;

  const initialSessions = useMemo(
    () => Array.from({ length: count }, () => ({ date: "", time: "" })),
    [count]
  );

  const [sessions, setSessions] = useState(initialSessions);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const filled = sessions.filter((s) => s.date && s.time).length;
  const progress = (filled / sessions.length) * 100;

  function updateSession(index, field, value) {
    setSessions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  async function save() {
    setError("");
    try {
      await api.saveAgenda({ phone, program, sessions, userId: user?.id });
      markAgendaSaved();
      await refreshProfile();
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (success) {
    return (
      <div className="page-container max-w-lg">
        <div className="card card-body text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-udbl-green/15 text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-udbl-blue">Merci !</h2>
          <p className="mt-2 text-udbl-muted">
            Votre agenda est enregistré. Un rappel SMS vous sera envoyé avant chaque séance.
          </p>
          <button onClick={() => navigate("/sessions")} className="btn-primary mt-6">
            Voir mes séances
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        badge="Étape 3"
        title="Planification des séances"
        subtitle={`Programme ${program} — ${count} séance(s)`}
      />

      <div className="card card-body mb-6">
        <div className="flex justify-between text-sm text-udbl-muted mb-2">
          <span>{filled} / {sessions.length} séance(s) planifiée(s)</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <div key={index} className="card card-body">
            <h2 className="font-bold text-udbl-blue mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-udbl-blue/10 text-sm">
                {index + 1}
              </span>
              Séance {index + 1}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={session.date}
                  onChange={(e) => updateSession(index, "date", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Heure</label>
                <input
                  type="time"
                  className="input-field"
                  value={session.time}
                  onChange={(e) => updateSession(index, "time", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-body mt-6">
        <label className="mb-1 block font-medium">Téléphone (rappels SMS)</label>
        <input
          type="tel"
          placeholder="+243xxxxxxxxx"
          className="input-field"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button onClick={save} className="btn-primary mt-6 w-full">
        Enregistrer l'agenda
      </button>
    </div>
  );
}
