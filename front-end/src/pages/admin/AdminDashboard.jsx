import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import StudentProgressBar from "../../components/admin/StudentProgressBar";

function StatCard({ label, value, hint }) {
  return (
    <div className="card card-body">
      <p className="text-sm text-udbl-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-udbl-blue">{value}</p>
      {hint && <p className="mt-1 text-xs text-udbl-muted">{hint}</p>}
    </div>
  );
}

function formatSessionDate(dateStr, timeStr) {
  try {
    const date = new Date(`${dateStr}T${timeStr || "12:00"}`);
    return date.toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return `${dateStr} ${timeStr || ""}`.trim();
  }
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-udbl-muted">Chargement du tableau de bord...</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
    );
  }

  const { totals, journey, students = [], upcoming_sessions: upcoming } = data;

  return (
    <div>
      <PageHeader
        badge="Admin"
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la plateforme d'apprentissage"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Étudiants" value={totals.students ?? totals.users} />
        <StatCard label="Test passé" value={totals.test_passed} />
        <StatCard label="Programmes" value={totals.programs} />
        <StatCard label="Agendas" value={totals.agendas} />
      </div>

      <div className="mb-8 card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="font-bold text-udbl-blue">Progression du cours par étudiant</h2>
          <p className="text-sm text-udbl-muted">
            Leçons validées sur le programme assigné
          </p>
        </div>
        {!students.length ? (
          <p className="px-4 py-8 text-sm text-udbl-muted sm:px-6">
            Aucun étudiant inscrit pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-udbl-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold sm:px-6">Étudiant</th>
                  <th className="px-4 py-3 font-semibold">Progression du cours</th>
                  <th className="px-4 py-3 font-semibold">Étape</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 sm:px-6">
                      <p className="font-medium text-udbl-dark">{student.username}</p>
                      <p className="text-xs text-udbl-muted">{student.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StudentProgressBar
                        completed={student.course_completed ?? 0}
                        total={student.course_total ?? 0}
                        percent={student.course_percent}
                        label={student.course_label}
                        unlocked={student.course_unlocked !== false}
                        compact
                      />
                    </td>
                    <td className="px-4 py-3 text-udbl-muted">{student.journey_label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-200 px-4 py-3 sm:px-6">
          <Link to="/admin/users" className="link text-sm">
            Voir le détail de tous les comptes →
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card card-body">
          <h2 className="mb-4 font-bold text-udbl-blue">Parcours des étudiants</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span>Test de niveau</span>
              <span className="font-semibold">{journey.test || 0}</span>
            </li>
            <li className="flex justify-between">
              <span>Choix du programme</span>
              <span className="font-semibold">{journey.programme || 0}</span>
            </li>
            <li className="flex justify-between">
              <span>Planification agenda</span>
              <span className="font-semibold">{journey.agenda || 0}</span>
            </li>
            <li className="flex justify-between">
              <span>Cours débloqués</span>
              <span className="font-semibold">{journey.cours || 0}</span>
            </li>
          </ul>
          <Link to="/admin/users" className="link mt-4 inline-block text-sm">
            Voir tous les utilisateurs →
          </Link>
        </div>

        <div className="card card-body">
          <h2 className="mb-4 font-bold text-udbl-blue">Prochaines séances</h2>
          {!upcoming?.length ? (
            <p className="text-sm text-udbl-muted">Aucune séance planifiée à venir.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {upcoming.map((session) => (
                <li
                  key={`${session.agenda_id}-${session.date}-${session.time}`}
                  className="rounded-lg border border-slate-100 px-3 py-2"
                >
                  <p className="font-medium text-udbl-dark">{session.student}</p>
                  <p className="text-udbl-muted">
                    {formatSessionDate(session.date, session.time)}
                    {session.theme ? ` — ${session.theme}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/sessions" className="link mt-4 inline-block text-sm">
            Voir toutes les séances →
          </Link>
        </div>
      </div>
    </div>
  );
}
