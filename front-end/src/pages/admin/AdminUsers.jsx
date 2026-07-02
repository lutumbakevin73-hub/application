import { useEffect, useState } from "react";
import { api } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import StudentProgressBar from "../../components/admin/StudentProgressBar";

const STEP_BADGE = {
  test: "badge-blue",
  programme: "badge-blue",
  agenda: "badge-green",
  cours: "badge-green"
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminUsers()
      .then((data) => setUsers(data.users || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const students = users.filter((user) => user.role !== "admin");

  if (loading) {
    return <p className="text-udbl-muted">Chargement des utilisateurs...</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
    );
  }

  return (
    <div>
      <PageHeader
        badge="Admin"
        title="Utilisateurs"
        subtitle={`${students.length} étudiant(s) · ${users.length} compte(s) au total`}
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-udbl-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Étudiant</th>
                <th className="px-4 py-3 font-semibold">Progression du cours</th>
                <th className="px-4 py-3 font-semibold">Étape actuelle</th>
                <th className="px-4 py-3 font-semibold">Programme</th>
                <th className="px-4 py-3 font-semibold">Inscription</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-udbl-muted">
                    Aucun étudiant inscrit pour le moment.
                  </td>
                </tr>
              ) : (
                students.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-udbl-dark">{user.username}</p>
                      <p className="text-xs text-udbl-muted">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StudentProgressBar
                        completed={user.course_completed ?? 0}
                        total={user.course_total ?? 0}
                        percent={user.course_percent}
                        label={user.course_label}
                        unlocked={user.course_unlocked !== false}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={STEP_BADGE[user.journey_step] || "badge-blue"}>
                        {user.journey_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-udbl-muted">
                      {user.program ? (
                        <>
                          <span className="font-medium text-udbl-dark">{user.program}</span>
                          {user.sessions_total > 0 && (
                            <span className="block text-xs">
                              {user.sessions_total} séance{user.sessions_total > 1 ? "s" : ""}
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-udbl-muted">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
