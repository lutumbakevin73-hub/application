import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "—";
  return timeStr.slice(0, 5);
}

export default function Agenda() {
  const { hasSavedAgenda, markAgendaSaved, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("form");
  const [courseSessions, setCourseSessions] = useState([]);
  const [program, setProgram] = useState(
    () => localStorage.getItem("selectedProgram") || "prog2"
  );
  const [sessions, setSessions] = useState([]);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [smsNotice, setSmsNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        let courses = [];
        const raw = localStorage.getItem("studySessions");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              courses = parsed;
            }
          } catch {
            // ignore
          }
        }

        if (courses.length === 0) {
          try {
            const data = await api.getCurrentProgram();
            courses = data.sessions || [];
            if (courses.length > 0) {
              localStorage.setItem("studySessions", JSON.stringify(courses));
              if (data.programId) {
                localStorage.setItem("programId", String(data.programId));
              }
            }
          } catch {
            // pas de programme en base
          }
        }

        if (cancelled) return;
        setCourseSessions(courses);

        const count = Math.max(courses.length, 1);
        const emptySlots = Array.from({ length: count }, (_, i) => ({
          date: "",
          time: "",
          theme: courses[i]?.theme || null
        }));

        if (hasSavedAgenda) {
          try {
            const { agenda } = await api.getMyAgenda();
            if (cancelled) return;
            if (agenda) {
              setProgram(agenda.program || program);
              setPhone(agenda.phone || "");
              setSessions(
                Array.isArray(agenda.sessions) && agenda.sessions.length > 0
                  ? agenda.sessions
                  : emptySlots
              );
              setMode("view");
              return;
            }
            await refreshProfile();
          } catch {
            // route indisponible ou session expirée
          }
        }

        setSessions(emptySlots);
        setMode("form");
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Impossible de charger l'agenda.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [hasSavedAgenda]);

  const filled = sessions.filter((s) => s.date && s.time).length;
  const progress = sessions.length ? (filled / sessions.length) * 100 : 0;

  function updateSession(index, field, value) {
    setSessions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  async function save() {
    setError("");

    if (!phone.trim()) {
      setError("Indiquez votre numéro de téléphone pour les rappels SMS.");
      return;
    }

    if (sessions.some((s) => !s.date || !s.time)) {
      setError("Remplissez la date et l'heure de chaque séance.");
      return;
    }

    const payload = sessions.map((s, i) => ({
      date: s.date,
      time: s.time,
      theme: s.theme || courseSessions[i]?.theme || null
    }));

    setSaving(true);
    try {
      const data = await api.saveAgenda({ phone: phone.trim(), program, sessions: payload });
      markAgendaSaved();
      await refreshProfile();
      setSessions(payload);

      if (data.welcomeSms?.sent) {
        setSmsNotice(
          "Un SMS récapitulatif de votre programme d'étude vient d'être envoyé sur votre téléphone."
        );
      } else if (data.welcomeSms?.skipped) {
        setSmsNotice(
          "Agenda enregistré. Le SMS de programme avait déjà été envoyé pour ce compte."
        );
      } else if (data.welcomeSms?.error) {
        setSmsNotice(
          `Agenda enregistré, mais le SMS n'a pas pu être envoyé : ${data.welcomeSms.error}`
        );
      } else {
        setSmsNotice("");
      }

      setMode("view");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    setMode("form");
  }

  if (loading) {
    return (
      <div className="page-container flex min-h-[40vh] items-center justify-center">
        <p className="text-udbl-muted">Chargement de l'agenda...</p>
      </div>
    );
  }

  if (mode === "view") {
    return (
      <div className="page-container max-w-3xl">
        <PageHeader
          badge="Agenda"
          title="Mon agenda"
          subtitle={`Programme ${program} — ${sessions.length} séance(s) planifiée(s)`}
        />

        <div className="mb-6 flex flex-wrap gap-3">
          <Link to="/sessions" className="btn-primary">
            Voir mes cours
          </Link>
          <button type="button" onClick={startEdit} className="btn-outline">
            Modifier l'agenda
          </button>
        </div>

        {smsNotice && (
          <p
            className={`mb-4 rounded-xl px-4 py-3 text-sm ${
              smsNotice.includes("n'a pas pu")
                ? "border border-amber-200 bg-amber-50 text-amber-900"
                : "border border-udbl-green/20 bg-udbl-green/10 text-udbl-green-dark"
            }`}
          >
            {smsNotice}
          </p>
        )}

        <div className="card card-body mb-6">
          <p className="text-sm text-udbl-muted">Rappels SMS</p>
          <p className="font-medium text-udbl-blue">{phone || "—"}</p>
        </div>

        <div className="space-y-4">
          {sessions.map((session, index) => (
            <article key={index} className="card card-body">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-udbl-blue/10 text-sm font-bold text-udbl-blue">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {session.theme && (
                    <p className="font-semibold text-udbl-blue">{session.theme}</p>
                  )}
                  <p className="mt-1 text-udbl-dark">{formatDate(session.date)}</p>
                  <p className="text-sm text-udbl-muted">à {formatTime(session.time)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (courseSessions.length === 0) {
    return (
      <div className="page-container max-w-lg text-center">
        <div className="card card-body">
          <p className="text-udbl-muted">Aucun programme de cours trouvé.</p>
          <Link to="/plan" className="link mt-4 inline-block">
            Choisir un programme
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        badge="Étape 3"
        title="Planification des séances"
        subtitle={`Programme ${program} — ${sessions.length} séance(s) à planifier`}
      />

      <div className="card card-body mb-6">
        <div className="mb-2 flex justify-between text-sm text-udbl-muted">
          <span>
            {filled} / {sessions.length} séance(s) planifiée(s)
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <div key={index} className="card card-body">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-udbl-blue">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-udbl-blue/10 text-sm">
                {index + 1}
              </span>
              <span>
                Séance {index + 1}
                {courseSessions[index]?.theme && (
                  <span className="ml-2 text-sm font-normal text-udbl-muted">
                    — {courseSessions[index].theme}
                  </span>
                )}
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
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
          placeholder="0854721056 ou +243854721056"
          className="input-field"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="mt-2 text-xs text-udbl-muted">
          Horaires en heure de Lubumbashi (UTC+2). Un SMS récapitulatif est envoyé à la
          première validation de l&apos;agenda.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="btn-primary mt-6 w-full"
      >
        {saving ? "Enregistrement..." : "Enregistrer l'agenda"}
      </button>
    </div>
  );
}
