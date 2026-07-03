import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import PageHeader from "../../components/PageHeader";
import LessonScoreChart from "../../components/admin/LessonScoreChart";
import LessonTrendChart from "../../components/admin/LessonTrendChart";
import StudentProgressBar from "../../components/admin/StudentProgressBar";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

function JourneySteps({ steps = [] }) {
  if (!steps.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((step) => (
        <div
          key={step.key}
          className={`rounded-xl border px-4 py-3 ${
            step.done ? "border-udbl-green/30 bg-udbl-green/5" : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-udbl-muted">
            {step.label}
          </p>
          <p className="mt-2 font-bold text-udbl-blue">{step.detail}</p>
          <p className="mt-1 text-xs text-udbl-muted">{step.done ? "✓ Atteint" : "En attente"}</p>
        </div>
      ))}
    </div>
  );
}

function SummaryCards({ summary, entryTest }) {
  const cards = [
    {
      label: "Test d'entrée",
      value: entryTest ? `${entryTest.score} %` : "—",
      hint: entryTest
        ? `${entryTest.correct_count}/${entryTest.total_count} bonnes réponses`
        : "Non passé"
    },
    {
      label: "Leçons validées",
      value: `${summary.lessons_completed}/${summary.lessons_total}`,
      hint: `${summary.completion_percent}% du parcours`
    },
    {
      label: "Score moyen leçons",
      value: summary.average_best_score != null ? `${summary.average_best_score} %` : "—",
      hint: "Meilleurs scores par quiz"
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="card card-body">
          <p className="text-xs font-semibold uppercase tracking-wide text-udbl-muted">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold text-udbl-blue">{card.value}</p>
          <p className="mt-1 text-xs text-udbl-muted">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminProgress() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    api
      .adminProgressList()
      .then((data) => {
        const list = data.students || [];
        setStudents(list);
        if (list.length > 0) {
          setSelectedId(list[0].user.id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    setError("");

    api
      .adminProgressDetail(selectedId)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const activeSummary = useMemo(() => {
    return students.find((item) => item.user.id === selectedId)?.summary || detail?.summary;
  }, [students, selectedId, detail]);

  if (loadingList) {
    return <p className="text-udbl-muted">Chargement de la progression...</p>;
  }

  return (
    <div>
      <PageHeader
        badge="Admin"
        title="Progression des étudiants"
        subtitle="Test d'entrée, programme assigné et résultats détaillés par leçon"
      />

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="card overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-udbl-muted">
              Étudiants
            </p>
          </div>
          <div className="max-h-[520px] overflow-y-auto p-2">
            {students.length === 0 ? (
              <p className="px-2 py-4 text-sm text-udbl-muted">Aucun étudiant inscrit.</p>
            ) : (
              students.map((item) => {
                const active = item.user.id === selectedId;
                return (
                  <button
                    key={item.user.id}
                    type="button"
                    onClick={() => setSelectedId(item.user.id)}
                    className={`mb-1 w-full rounded-xl px-3 py-3 text-left transition ${
                      active ? "bg-udbl-blue text-white" : "hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-medium">{item.user.username}</p>
                    <p className={`text-xs ${active ? "text-white/80" : "text-udbl-muted"}`}>
                      {item.user.email}
                    </p>
                    <p className={`mt-2 text-xs ${active ? "text-white/90" : "text-udbl-dark"}`}>
                      Test : {item.entry_test_score != null ? `${item.entry_test_score}%` : "—"}
                      {item.has_course
                        ? ` · ${item.summary.lessons_completed}/${item.summary.lessons_total} leçons`
                        : ""}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="space-y-6">
          {loadingDetail ? (
            <p className="text-udbl-muted">Chargement du détail...</p>
          ) : !detail ? (
            <div className="card card-body text-sm text-udbl-muted">
              Sélectionnez un étudiant pour afficher sa progression complète.
            </div>
          ) : (
            <>
              <div className="card card-body">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-udbl-dark">{detail.user.username}</h2>
                    <p className="text-sm text-udbl-muted">{detail.user.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {detail.language && (
                        <span className="badge-blue">Parcours {detail.language}</span>
                      )}
                      {detail.program && <span className="badge-green">{detail.program}</span>}
                    </div>
                  </div>

                  {detail.has_course && activeSummary && (
                    <StudentProgressBar
                      completed={activeSummary.lessons_completed}
                      total={activeSummary.lessons_total}
                      percent={activeSummary.completion_percent}
                      label={`${activeSummary.lessons_completed}/${activeSummary.lessons_total} leçons`}
                      unlocked
                    />
                  )}
                </div>
              </div>

              <div className="card card-body">
                <h3 className="mb-4 font-bold text-udbl-blue">Parcours global</h3>
                <JourneySteps steps={detail.progress_overview?.journey || []} />
              </div>

              <SummaryCards summary={detail.summary} entryTest={detail.entry_test} />

              {detail.entry_test ? (
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="card card-body">
                    <h3 className="mb-1 font-bold text-udbl-blue">Résultats du test d&apos;entrée</h3>
                    <p className="mb-4 text-xs text-udbl-muted">
                      Score global : {detail.entry_test.score}% —{" "}
                      {formatDate(detail.entry_test.completed_at)}
                    </p>
                    <LessonScoreChart
                      labels={detail.entry_test.chart?.labels || []}
                      scores={detail.entry_test.chart?.scores || []}
                      completed={detail.entry_test.chart?.labels?.map(() => true) || []}
                    />
                    {detail.entry_test.weak_themes?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {detail.entry_test.weak_themes.map((theme) => (
                          <span key={theme} className="badge-blue">
                            {theme}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card card-body">
                    <h3 className="mb-1 font-bold text-udbl-blue">Progression globale</h3>
                    <p className="mb-4 text-xs text-udbl-muted">
                      Test d&apos;entrée puis scores des leçons
                    </p>
                    <LessonTrendChart
                      labels={detail.progress_overview?.combined?.labels || []}
                      scores={detail.progress_overview?.combined?.scores || []}
                    />
                  </div>
                </div>
              ) : (
                <div className="card card-body text-sm text-udbl-muted">
                  Cet étudiant n&apos;a pas encore passé le test d&apos;entrée.
                </div>
              )}

              {detail.has_course ? (
                <>
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="card card-body">
                      <h3 className="mb-1 font-bold text-udbl-blue">Scores par leçon</h3>
                      <LessonScoreChart
                        labels={detail.chart.labels}
                        scores={detail.chart.best_scores}
                        completed={detail.chart.completed}
                      />
                    </div>

                    <div className="card card-body">
                      <h3 className="mb-1 font-bold text-udbl-blue">Évolution des leçons</h3>
                      <LessonTrendChart
                        labels={detail.chart.labels}
                        scores={detail.chart.best_scores}
                      />
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <h3 className="font-bold text-udbl-blue">Détail par leçon</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[880px] text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-udbl-muted">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Leçon</th>
                            <th className="px-4 py-3 font-semibold">Thème</th>
                            <th className="px-4 py-3 font-semibold">Statut</th>
                            <th className="px-4 py-3 font-semibold">Meilleur score</th>
                            <th className="px-4 py-3 font-semibold">Dernier score</th>
                            <th className="px-4 py-3 font-semibold">Tentatives</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.lessons.map((lesson) => (
                            <tr key={lesson.session_order} className="border-b border-slate-100">
                              <td className="px-4 py-3 font-medium text-udbl-dark">
                                Leçon {lesson.session_order}
                              </td>
                              <td className="px-4 py-3 text-udbl-muted">{lesson.theme}</td>
                              <td className="px-4 py-3">
                                {lesson.completed ? (
                                  <span className="badge-green">Validée</span>
                                ) : lesson.attemptCount > 0 ? (
                                  <span className="badge-blue">En cours</span>
                                ) : (
                                  <span className="text-xs text-udbl-muted">Non commencée</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {lesson.bestScore != null ? `${lesson.bestScore} %` : "—"}
                              </td>
                              <td className="px-4 py-3">
                                {lesson.lastScore != null ? `${lesson.lastScore} %` : "—"}
                              </td>
                              <td className="px-4 py-3">{lesson.attemptCount || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card card-body text-sm text-udbl-muted">
                  Programme de cours pas encore généré pour cet étudiant.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
