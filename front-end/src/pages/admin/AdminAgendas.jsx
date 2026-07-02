import { useEffect, useState } from "react";
import { api } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import AdminPagination from "../../components/admin/AdminPagination";
import { formatSessionDate, normalizePage } from "../../utils/adminData";

const AGENDAS_PER_PAGE = 5;

export default function AdminAgendas() {
  const [agendasPage, setAgendasPage] = useState(() =>
    normalizePage(null, AGENDAS_PER_PAGE)
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
          sessionPage: 1,
          sessionLimit: 1,
          agendaPage: pageNum,
          agendaLimit: AGENDAS_PER_PAGE
        });

        if (cancelled) return;

        setAgendasPage(normalizePage(data.agendas, AGENDAS_PER_PAGE));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Impossible de charger les agendas.");
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
    return <p className="text-udbl-muted">Chargement des agendas...</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
    );
  }

  const agendas = agendasPage.items;

  return (
    <div>
      <PageHeader
        badge="Admin"
        title="Agendas"
        subtitle={`${agendasPage.total} agenda(s) enregistré(s)`}
      />

      <div className="space-y-4">
        {!agendas.length ? (
          <p className="text-sm text-udbl-muted">Aucun agenda enregistré.</p>
        ) : (
          agendas.map((agenda) => (
            <article key={agenda.id} className="card card-body">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-udbl-blue">
                    {agenda.username || agenda.email || "Utilisateur inconnu"}
                  </h2>
                  <p className="text-sm text-udbl-muted">{agenda.email}</p>
                </div>
                <div className="text-right text-sm">
                  <span className="badge-blue">{agenda.program}</span>
                  <p className="mt-1 text-udbl-muted">{agenda.phone}</p>
                </div>
              </div>

              <ul className="grid gap-2 sm:grid-cols-2">
                {(agenda.sessions || []).map((session, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-slate-100 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">
                      Séance {index + 1}
                      {session.theme ? ` — ${session.theme}` : ""}
                    </p>
                    <p className="text-udbl-muted">
                      {formatSessionDate(session.date, session.time)}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </div>

      <AdminPagination
        page={agendasPage.page}
        totalPages={agendasPage.totalPages}
        total={agendasPage.total}
        onPageChange={setPageNum}
        label="agendas"
      />
    </div>
  );
}
