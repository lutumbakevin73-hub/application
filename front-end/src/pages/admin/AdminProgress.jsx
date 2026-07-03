import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { PROGRAMS } from "../../config/programs";
import PageHeader from "../../components/PageHeader";
import { ThemeEvolutionPanel, WeakThemesDetail } from "../../components/ThemeProgress";
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

function getProgramMeta(programId) {
  return PROGRAMS.find((p) => p.id === programId) || null;
}

function scoreTone(score) {
  if (score == null) return "slate";
  if (score >= 80) return "green";
  if (score >= 60) return "blue";
  if (score >= 40) return "amber";
  return "red";
}

function ScoreBadge({ score, size = "sm" }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
        Non passé
      </span>
    );
  }

  const tone = scoreTone(score);
  const sizeClass = size === "lg" ? "text-lg px-4 py-1.5" : "text-xs px-2.5 py-0.5";

  const tones = {
    green: "bg-udbl-green/15 text-udbl-green-dark",
    blue: "bg-udbl-blue/15 text-udbl-blue",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700"
  };

  return (
    <span className={`inline-flex items-center rounded-full font-bold ${tones[tone]} ${sizeClass}`}>
      {score} %
    </span>
  );
}

function JourneySteps({ steps = [] }) {
  if (!steps.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={`relative rounded-xl border px-4 py-4 ${
            step.done ? "border-udbl-green/30 bg-udbl-green/5" : "border-slate-200 bg-slate-50"
          }`}
        >
          <span className="absolute right-3 top-3 text-xs font-bold text-slate-300">
            {index + 1}
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-udbl-muted">
            {step.label}
          </p>
          <p className="mt-2 text-lg font-bold text-udbl-blue">{step.detail}</p>
          <p className="mt-1 text-xs text-udbl-muted">
            {step.done ? "✓ Atteint" : "En attente"}
          </p>
        </div>
      ))}
    </div>
  );
}

function EntryTestPanel({ entryTest }) {
  if (!entryTest) {
    return (
      <div className="card card-body flex items-center gap-4 text-sm text-udbl-muted">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl">
          ?
        </span>
        <div>
          <p className="font-medium text-udbl-dark">Test d&apos;entrée non passé</p>
          <p className="mt-1">L&apos;étudiant n&apos;a pas encore terminé le test de niveau.</p>
        </div>
      </div>
    );
  }

  const program = getProgramMeta(entryTest.recommended_program);
  const themes = entryTest.theme_breakdown || [];
  const weakDetails = entryTest.weak_theme_details || [];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-r from-udbl-blue/5 to-udbl-green/5 px-6 py-5">
        <div className="flex flex-wrap items-center gap-6">
          <div
            className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg ${
              scoreTone(entryTest.score) === "green"
                ? "bg-gradient-to-br from-udbl-green to-emerald-600"
                : scoreTone(entryTest.score) === "blue"
                  ? "bg-gradient-to-br from-udbl-blue to-blue-600"
                  : scoreTone(entryTest.score) === "amber"
                    ? "bg-gradient-to-br from-amber-400 to-orange-500"
                    : "bg-gradient-to-br from-red-400 to-red-600"
            }`}
          >
            {entryTest.score}%
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-udbl-dark">Test d&apos;entrée</h3>
            <p className="mt-1 text-sm text-udbl-muted">
              {entryTest.correct_count} / {entryTest.total_count} bonnes réponses
              {" · "}
              {formatDate(entryTest.completed_at)}
            </p>
            {program && (
              <p className="mt-2 text-sm">
                <span className="text-udbl-muted">Programme assigné : </span>
                <span className="font-semibold text-udbl-blue">
                  {program.icon} {program.title}
                </span>
                <span className="text-udbl-muted"> — {program.desc}</span>
              </p>
            )}
            {entryTest.language && (
              <span className="badge-blue mt-2">Parcours {entryTest.language}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold text-udbl-blue">Scores par thème</h4>
          <LessonScoreChart
            labels={entryTest.chart?.labels || []}
            scores={entryTest.chart?.scores || []}
            completed={entryTest.chart?.labels?.map(() => true) || []}
          />
        </div>

        <div>
          {weakDetails.length > 0 ? (
            <WeakThemesDetail items={weakDetails} title="Lacunes détaillées" />
          ) : entryTest.weak_themes?.length > 0 ? (
            <WeakThemesDetail
              items={entryTest.weak_themes.map((theme) => ({ theme, total: 0, correct: 0, failed: 0, percent: 0 }))}
              title="Lacunes identifiées"
            />
          ) : null}

          {themes.length > 0 && (
            <div className={`overflow-hidden rounded-xl border border-slate-200 ${weakDetails.length > 0 ? "mt-5" : ""}`}>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-udbl-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Thème</th>
                    <th className="px-3 py-2 font-semibold">Score</th>
                    <th className="px-3 py-2 font-semibold">Réussies</th>
                    <th className="px-3 py-2 font-semibold">Échouées</th>
                  </tr>
                </thead>
                <tbody>
                  {themes.map((row) => (
                    <tr key={row.theme} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium capitalize text-udbl-dark">{row.theme}</td>
                      <td className="px-3 py-2">
                        <ScoreBadge score={row.percent} />
                      </td>
                      <td className="px-3 py-2 text-udbl-muted">{row.correct}</td>
                      <td className="px-3 py-2 text-udbl-muted">{row.failed ?? row.total - row.correct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
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
        : "En attente",
      tone: entryTest ? scoreTone(entryTest.score) : "slate"
    },
    {
      label: "Leçons validées",
      value: `${summary.lessons_completed}/${summary.lessons_total}`,
      hint: `${summary.completion_percent}% du parcours`,
      tone: summary.completion_percent >= 80 ? "green" : "blue"
    },
    {
      label: "Score moyen leçons",
      value: summary.average_best_score != null ? `${summary.average_best_score} %` : "—",
      hint: "Meilleurs scores par quiz",
      tone: summary.average_best_score != null ? scoreTone(summary.average_best_score) : "slate"
    }
  ];

  const valueColors = {
    green: "text-udbl-green-dark",
    blue: "text-udbl-blue",
    amber: "text-amber-600",
    red: "text-red-600",
    slate: "text-udbl-blue"
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="card card-body">
          <p className="text-xs font-semibold uppercase tracking-wide text-udbl-muted">
            {card.label}
          </p>
          <p className={`mt-2 text-2xl font-bold ${valueColors[card.tone]}`}>{card.value}</p>
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
  const [search, setSearch] = useState("");
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

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (item) =>
        item.user.username.toLowerCase().includes(query) ||
        item.user.email.toLowerCase().includes(query)
    );
  }, [students, search]);

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
        subtitle="Test d'entrée enregistré, programme assigné et résultats par leçon"
      />

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-udbl-muted">
              Étudiants ({students.length})
            </p>
            <input
              type="search"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field mt-3"
            />
          </div>
          <div className="max-h-[640px] overflow-y-auto p-3">
            {filteredStudents.length === 0 ? (
              <p className="px-2 py-4 text-sm text-udbl-muted">
                {students.length === 0 ? "Aucun étudiant inscrit." : "Aucun résultat."}
              </p>
            ) : (
              filteredStudents.map((item) => {
                const active = item.user.id === selectedId;
                return (
                  <button
                    key={item.user.id}
                    type="button"
                    onClick={() => setSelectedId(item.user.id)}
                    className={`mb-1.5 w-full rounded-xl px-4 py-3.5 text-left transition ${
                      active ? "bg-udbl-blue text-white shadow-sm" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-semibold leading-tight">{item.user.username}</p>
                      {active ? (
                        <span className="shrink-0 text-xs font-bold text-white/90">
                          {item.entry_test_score != null ? `${item.entry_test_score}%` : "—"}
                        </span>
                      ) : (
                        <ScoreBadge score={item.entry_test_score} />
                      )}
                    </div>
                    <p className={`mt-1 text-xs ${active ? "text-white/80" : "text-udbl-muted"}`}>
                      {item.user.email}
                    </p>
                    {item.has_course && (
                      <p className={`mt-2 text-xs ${active ? "text-white/90" : "text-udbl-dark"}`}>
                        {item.summary.lessons_completed}/{item.summary.lessons_total} leçons
                        {item.program && (
                          <span className={active ? " text-white/70" : " text-udbl-muted"}>
                            {" "}
                            · {getProgramMeta(item.program)?.title || item.program}
                          </span>
                        )}
                      </p>
                    )}
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
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {detail.language && (
                        <span className="badge-blue">Parcours {detail.language}</span>
                      )}
                      {detail.program && (
                        <span className="badge-green">
                          {getProgramMeta(detail.program)?.title || detail.program}
                        </span>
                      )}
                      {detail.entry_test && (
                        <ScoreBadge score={detail.entry_test.score} size="lg" />
                      )}
                    </div>
                  </div>

                  {detail.has_course && activeSummary && (
                    <div className="min-w-[200px]">
                      <StudentProgressBar
                        completed={activeSummary.lessons_completed}
                        total={activeSummary.lessons_total}
                        percent={activeSummary.completion_percent}
                        label={`${activeSummary.lessons_completed}/${activeSummary.lessons_total} leçons`}
                        unlocked
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="card card-body">
                <h3 className="mb-4 font-bold text-udbl-blue">Étapes du parcours</h3>
                <JourneySteps steps={detail.progress_overview?.journey || []} />
              </div>

              <SummaryCards summary={detail.summary} entryTest={detail.entry_test} />

              <EntryTestPanel entryTest={detail.entry_test} />

              <ThemeEvolutionPanel items={detail.theme_evolution || []} />

              {detail.entry_test && detail.progress_overview?.combined?.labels?.length > 1 && (
                <div className="card card-body">
                  <h3 className="mb-1 font-bold text-udbl-blue">Courbe de progression</h3>
                  <p className="mb-4 text-xs text-udbl-muted">
                    Test d&apos;entrée puis meilleurs scores par leçon
                  </p>
                  <LessonTrendChart
                    labels={detail.progress_overview.combined.labels}
                    scores={detail.progress_overview.combined.scores}
                  />
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
