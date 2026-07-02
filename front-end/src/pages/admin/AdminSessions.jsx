import { useEffect, useState } from "react";
import { api } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import AdminPagination from "../../components/admin/AdminPagination";
import { formatSessionDate, normalizePage } from "../../utils/adminData";

const SESSIONS_PER_PAGE = 10;

export default function AdminSessions() {
  const [sessionsPage, setSessionsPage] = useState(() =>
    normalizePage(null, SESSIONS_PER_PAGE)
  );
  const [pageNum, setPageNum] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await api.adminAgendas({
          sessionPage: pageNum,
          sessionLimit: SESSIONS_PER_PAGE,
          agendaPage: 1,
          agendaLimit: 1
        });

        if (cancelled) return;

        setSessionsPage(normalizePage(data.upcoming_sessions, SESSIONS_PER_PAGE));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Impossible de charger les séances.");
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
  }, [pageNum]);

  if (loading) {
    return <p className="text-udbl-muted">Chargement des séances...</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
    );
  }

  const sessions = sessionsPage.items;

  return (
    <div>
      <PageHeader
        badge="Admin"
        title="Séances planifiées"
        subtitle={`${sessionsPage.total} séance(s) à venir`}
      />

      <div className="card card-body">
        {!sessions.length ? (
          <p className="text-sm text-udbl-muted">Aucune séance à venir.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-udbl-muted">
                <tr>
                  <th className="pb-2 font-semibold">Étudiant</th>
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Programme</th>
                  <th className="pb-2 font-semibold">Thème</th>
                  <th className="pb-2 font-semibold">Téléphone</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={`${session.agenda_id}-${session.date}-${session.time}`}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3">
                      <p className="font-medium">{session.student}</p>
                      <p className="text-xs text-udbl-muted">{session.email}</p>
                    </td>
                    <td className="py-3 text-udbl-muted">
                      {formatSessionDate(session.date, session.time)}
                    </td>
                    <td className="py-3">
                      <span className="badge-blue">{session.program || "—"}</span>
                    </td>
                    <td className="py-3">{session.theme || "—"}</td>
                    <td className="py-3">{session.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          page={sessionsPage.page}
          totalPages={sessionsPage.totalPages}
          total={sessionsPage.total}
          onPageChange={setPageNum}
          label="séances"
        />
      </div>
    </div>
  );
}
