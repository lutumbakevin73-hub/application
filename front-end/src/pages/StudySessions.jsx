import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import CodeEditor from "../components/CodeEditor";
import QuestionContent from "../components/QuestionContent";
import { PhaseIcon } from "../components/PhaseIcon";
import PageHeader from "../components/PageHeader";
import { useDialog } from "../context/DialogContext";
import {
  getQuizData,
  getExercises,
  normalizeStudySession,
  parseExercise
} from "../utils/courseContent";
import {
  checkQuizAnswer,
  isSessionCompleted,
  isSessionUnlocked,
  loadProgress,
  markSessionCompleted,
  recordQuizAttempt,
  saveProgress
} from "../utils/lessonProgress";
import { isPracticalQuestion } from "../utils/questionContent";

const PHASES = {
  overview: "overview",
  lesson: "lesson",
  exercise: "exercise",
  quiz: "quiz",
  review: "review"
};

const PHASE_STEPS = [
  { id: PHASES.lesson, label: "Cours", icon: "lesson" },
  { id: PHASES.exercise, label: "Exercices", icon: "exercise" },
  { id: PHASES.quiz, label: "Quiz", icon: "quiz" },
  { id: PHASES.review, label: "Bilan", icon: "review" }
];

function SectionHeading({ icon, title }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 font-semibold text-udbl-blue">
      <span className="course-section-icon">
        <PhaseIcon name={icon} className="h-5 w-5" />
      </span>
      {title}
    </h3>
  );
}

function PhaseSteps({ currentPhase }) {
  const order = [PHASES.lesson, PHASES.exercise, PHASES.quiz, PHASES.review];
  const currentIndex = order.indexOf(currentPhase);

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {PHASE_STEPS.map((step, index) => {
        const isActive = step.id === currentPhase;
        const isDone = currentIndex > index;
        return (
          <span
            key={step.id}
            className={`course-phase-step ${
              isActive
                ? "course-phase-step--active"
                : isDone
                  ? "course-phase-step--done"
                  : "course-phase-step--idle"
            }`}
          >
            <PhaseIcon name={step.icon} className="h-4 w-4" />
            {step.label}
          </span>
        );
      })}
    </div>
  );
}

function LessonContent({ session }) {
  const lesson = session.lesson || {};

  return (
    <div className="space-y-6 text-udbl-dark/90">
      {lesson.introduction && (
        <section>
          <SectionHeading icon="lesson" title="Introduction" />
          <p className="leading-relaxed">{lesson.introduction}</p>
        </section>
      )}

      {Array.isArray(lesson.learning_objectives) && lesson.learning_objectives.length > 0 && (
        <section className="rounded-xl bg-udbl-blue/5 p-4">
          <SectionHeading icon="lesson" title="Objectifs de la leçon" />
          <ul className="grid gap-2 sm:grid-cols-2">
            {lesson.learning_objectives.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <span className="text-udbl-green">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lesson.definition && (
        <section className="course-hint-card rounded-xl px-4 py-3">
          <h3 className="mb-1 font-semibold text-udbl-blue">Définition</h3>
          <p className="text-sm">{lesson.definition}</p>
        </section>
      )}

      {lesson.why_it_matters && (
        <section>
          <h3 className="mb-2 font-semibold text-udbl-blue">Pourquoi c&apos;est important</h3>
          <p className="leading-relaxed">{lesson.why_it_matters}</p>
        </section>
      )}

      {lesson.detailed_explanation && (
        <section>
          <h3 className="mb-2 font-semibold text-udbl-blue">Explication détaillée</h3>
          <p className="leading-relaxed whitespace-pre-line">{lesson.detailed_explanation}</p>
        </section>
      )}

      {lesson.example_code && (
        <section>
          <h3 className="mb-2 font-semibold text-udbl-blue">Exemple principal</h3>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-green-300">
            {lesson.example_code}
          </pre>
          {lesson.example_output && (
            <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-mono">
              Sortie : {lesson.example_output}
            </p>
          )}
          {lesson.example_explanation && (
            <p className="mt-2 text-sm leading-relaxed">{lesson.example_explanation}</p>
          )}
        </section>
      )}

      {Array.isArray(lesson.additional_examples) && lesson.additional_examples.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-semibold text-udbl-blue">Exemples supplémentaires</h3>
          {lesson.additional_examples.map((example, index) => (
            <div
              key={example.title || index}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <h4 className="mb-2 font-medium text-udbl-dark">
                {example.title || `Exemple ${index + 1}`}
              </h4>
              {example.code && (
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-sm text-green-300">
                  {example.code}
                </pre>
              )}
              {example.output && (
                <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm font-mono text-udbl-muted">
                  Sortie : {example.output}
                </p>
              )}
              {example.explanation && (
                <p className="mt-2 text-sm leading-relaxed">{example.explanation}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {Array.isArray(lesson.step_by_step) && lesson.step_by_step.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold text-udbl-blue">Étapes clés</h3>
          <ol className="space-y-2">
            {lesson.step_by_step.map((step, index) => (
              <li
                key={step}
                className="flex gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-udbl-blue/10 text-xs font-bold text-udbl-blue">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {lesson.real_world_example && (
        <section className="rounded-xl bg-udbl-green/5 p-4">
          <h3 className="mb-2 font-semibold text-udbl-green-dark">Exemple concret</h3>
          <p className="text-sm leading-relaxed">{lesson.real_world_example}</p>
        </section>
      )}

      {lesson.common_mistakes && (
        <section className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
          <h3 className="mb-1 font-semibold">Erreurs fréquentes à éviter</h3>
          <p>{lesson.common_mistakes}</p>
        </section>
      )}
    </div>
  );
}

function ExerciseContent({ exercise, language, index }) {
  const [showHints, setShowHints] = useState(false);
  const data = parseExercise(exercise);

  return (
    <div className="space-y-5">
      {index != null && (
        <span className="inline-flex rounded-full bg-udbl-green/10 px-2 py-0.5 text-xs font-bold text-udbl-green-dark">
          Exercice {index + 1}
        </span>
      )}
      <SectionHeading icon="exercise" title={data.title} />
      <p className="leading-relaxed whitespace-pre-line">{data.instructions}</p>

      {data.starter_code && (
        <section>
          <h4 className="mb-2 text-sm font-semibold text-udbl-blue">Code de départ</h4>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-green-300">
            {data.starter_code}
          </pre>
        </section>
      )}

      {data.expected_result && (
        <p className="rounded-xl border border-udbl-green/20 bg-udbl-green/5 px-4 py-3 text-sm">
          <strong>Résultat attendu :</strong> {data.expected_result}
        </p>
      )}

      {data.hints?.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowHints((v) => !v)}
            className="btn-outline text-sm"
          >
            {showHints ? "Masquer les indices" : `Afficher ${data.hints.length} indice(s)`}
          </button>
          {showHints && (
            <ul className="mt-3 space-y-2">
              {data.hints.map((hint) => (
                <li key={hint} className="course-hint-card rounded-lg px-3 py-2 text-sm">
                  💡 {hint}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {data.solution_approach && (
        <p className="text-sm italic text-udbl-muted">
          Méthode suggérée : {data.solution_approach}
        </p>
      )}
    </div>
  );
}

function SessionStatusBadge({ session, progress }) {
  if (isSessionCompleted(session.session_order, progress)) {
    return <span className="badge-green">✓ Terminée</span>;
  }
  if (isSessionUnlocked(session.session_order, progress)) {
    return <span className="badge-blue">Disponible</span>;
  }
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">🔒 Verrouillée</span>;
}

export default function StudySessions() {
  const { alert } = useDialog();
  const [sessions, setSessions] = useState([]);
  const [programId, setProgramId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ completed: [], quizAttempts: {} });
  const [activeSession, setActiveSession] = useState(null);
  const [phase, setPhase] = useState(PHASES.lesson);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      let list = [];
      let storedProgramId = localStorage.getItem("programId");

      const raw = localStorage.getItem("studySessions");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed.map(normalizeStudySession);
          }
        } catch {
          // ignore
        }
      }

      if (list.length === 0) {
        try {
          const data = await api.getCurrentProgram();
          list = (data.sessions || []).map(normalizeStudySession);
          storedProgramId = String(data.programId || storedProgramId || "");
          if (list.length > 0) {
            localStorage.setItem("studySessions", JSON.stringify(list));
            if (data.programId) {
              localStorage.setItem("programId", String(data.programId));
            }
            if (data.program) {
              localStorage.setItem("selectedProgram", data.program);
            }
          }
        } catch (err) {
          if (!cancelled) {
            setError(err.message || "Impossible de charger vos cours.");
          }
        }
      }

      if (!cancelled) {
        setSessions(list);
        setProgramId(storedProgramId);

        let loadedProgress = loadProgress(storedProgramId);
        if (storedProgramId && list.length > 0) {
          try {
            const remote = await api.getLessonProgress();
            if (remote?.progress) {
              const mergedCompleted = [
                ...new Set([
                  ...loadedProgress.completed,
                  ...(remote.progress.completed || [])
                ])
              ].sort((a, b) => a - b);
              loadedProgress = {
                completed: mergedCompleted,
                quizAttempts: {
                  ...(remote.progress.quizAttempts || {}),
                  ...loadedProgress.quizAttempts
                }
              };
              saveProgress(storedProgramId, loadedProgress);
              if (mergedCompleted.length > (remote.progress.completed?.length || 0)) {
                await api.saveLessonProgress({
                  completed: loadedProgress.completed,
                  quizAttempts: loadedProgress.quizAttempts
                });
              }
            }
          } catch {
            // progression locale uniquement
          }
        }

        setProgress(loadedProgress);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedCount = progress.completed.length;
  const totalCount = sessions.length;

  const nextSession = useMemo(() => {
    return sessions.find((session) => !isSessionCompleted(session.session_order, progress));
  }, [sessions, progress]);

  async function showLessonSuccessDialog(session, score, correct, total) {
    const isLastLesson =
      !sessions.find((item) => item.session_order === session.session_order + 1);
    const scoreLine = total > 0 ? `${correct}/${total} bonnes réponses` : "Leçon complétée avec succès";

    await alert({
      title: isLastLesson ? "Félicitations ! Parcours terminé 🎉" : "Félicitations ! 🎉",
      message: isLastLesson
        ? `Bravo ! Vous avez validé la dernière leçon « ${session.theme} » avec ${score}%.\n\n${scoreLine}. Vous avez terminé tout votre parcours !`
        : `Bravo ! Vous avez validé la leçon « ${session.theme} » avec ${score}%.\n\n${scoreLine}. Continuez sur cette lancée !`,
      confirmLabel: "Continuer",
      variant: "success"
    });
  }

  function openSession(session) {
    if (!isSessionUnlocked(session.session_order, progress)) return;
    setActiveSession(session);
    setPhase(PHASES.lesson);
    setQuizAnswers({});
    setQuizFeedback(null);
    setQuizResults(null);
  }

  function backToOverview() {
    setActiveSession(null);
    setPhase(PHASES.lesson);
    setQuizAnswers({});
    setQuizFeedback(null);
    setQuizResults(null);
  }

  async function submitQuiz() {
    const quizData = getQuizData(
      activeSession?.mini_quiz,
      activeSession?.theme,
      activeSession?.language || "C"
    );
    const { questions, passing_score: passingScore } = quizData;

    if (questions.length === 0) {
      let nextProgress = markSessionCompleted(
        programId,
        progress,
        activeSession.session_order
      );
      setProgress(nextProgress);
      void api.saveLessonProgress({
        completed: nextProgress.completed,
        quizAttempts: nextProgress.quizAttempts
      });
      setQuizFeedback({ passed: true, score: 100, message: "Leçon validée." });
      setQuizResults([]);
      await showLessonSuccessDialog(activeSession, 100, 0, 0);
      setPhase(PHASES.review);
      return;
    }

    const unanswered = questions.some((question, index) => {
      const answer = quizAnswers[index];
      if (isPracticalQuestion(question)) {
        return !String(answer || "").trim();
      }
      return answer == null || answer === "";
    });

    if (unanswered) {
      setQuizFeedback({
        passed: false,
        score: 0,
        message: "Répondez à toutes les questions avant de valider."
      });
      return;
    }

    setQuizSubmitting(true);

    try {
      let correct = 0;
      const results = [];

      for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        const answer = quizAnswers[index];
        let isCorrect = false;

        if (isPracticalQuestion(question)) {
          const correction = await api.correctCode({
            language: question.language || activeSession.language || "C",
            question: question.question,
            correctAnswer: question.correctAnswer || question.answer,
            userAnswer: String(answer).trim()
          });
          isCorrect = Boolean(correction.correct);
        } else if (
          checkQuizAnswer(answer, question.answer, question.options || [])
        ) {
          isCorrect = true;
        }

        if (isCorrect) {
          correct += 1;
        }

        results.push({ index, correct: isCorrect });
      }

      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= (passingScore || 70);

      setQuizResults(results);
      setQuizFeedback({
        passed,
        score,
        correct,
        total: questions.length,
        message: passed
          ? `Excellent ! ${correct}/${questions.length} — leçon validée (${score}%).`
          : `Score : ${score}%. Il faut ${passingScore || 70}% minimum. Révisez puis réessayez.`
      });

      let nextProgress = recordQuizAttempt(
        programId,
        progress,
        activeSession.session_order,
        {
          passed,
          score,
          correct,
          total: questions.length,
          theme: activeSession.theme
        }
      );

      if (passed) {
        nextProgress = markSessionCompleted(
          programId,
          nextProgress,
          activeSession.session_order
        );
      }

      setProgress(nextProgress);
      void api.saveLessonProgress({
        completed: nextProgress.completed,
        quizAttempts: nextProgress.quizAttempts
      });

      if (passed) {
        await showLessonSuccessDialog(
          activeSession,
          score,
          correct,
          questions.length
        );
      }

      setPhase(PHASES.review);
    } catch (err) {
      await alert({
        title: "Erreur de correction",
        message: err.message || "Impossible de corriger le quiz.",
        variant: "danger"
      });
    } finally {
      setQuizSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container flex min-h-[40vh] items-center justify-center">
        <p className="text-udbl-muted">Chargement de vos cours...</p>
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="page-container text-center">
        <div className="card card-body mx-auto max-w-md">
          <p className="text-udbl-muted">{error || "Aucun programme trouvé."}</p>
          <Link to="/plan" className="link mt-4 inline-block">
            Choisir un programme
          </Link>
        </div>
      </div>
    );
  }

  if (activeSession) {
    const lesson = activeSession.lesson || {};
    const quizData = getQuizData(
      activeSession.mini_quiz,
      activeSession.theme,
      activeSession.language || "C"
    );
    const exercises = getExercises(activeSession.exercise ?? activeSession.exercises);
    const nextUnlocked = sessions.find(
      (session) =>
        session.session_order === activeSession.session_order + 1 &&
        isSessionUnlocked(session.session_order, progress)
    );

    return (
      <div className="page-container max-w-4xl">
        <button type="button" onClick={backToOverview} className="link mb-4 text-sm">
          ← Retour au parcours
        </button>

        <PageHeader
          badge={`Leçon ${activeSession.session_order}/${totalCount}`}
          title={activeSession.theme}
          subtitle={`${activeSession.language || "C"} — ${lesson.estimated_duration || "25 minutes"} — ${lesson.difficulty || "Adapté à votre niveau"}`}
        />

        <PhaseSteps currentPhase={phase} />

        <div className="card card-body">
          {phase === PHASES.lesson && (
            <>
              <LessonContent session={activeSession} />
              {lesson.summary && (
                <p className="mt-6 border-l-4 border-udbl-green pl-3 text-sm italic text-udbl-muted">
                  {lesson.summary}
                </p>
              )}
              <button
                type="button"
                onClick={() => setPhase(PHASES.exercise)}
                className="btn-primary mt-6"
              >
                <PhaseIcon name="exercise" className="h-4 w-4" />
                Passer aux exercices
              </button>
            </>
          )}

          {phase === PHASES.exercise && (
            <>
              <p className="mb-4 text-sm text-udbl-muted">
                {exercises.length} exercice(s) pratique(s) — du plus simple au plus exigeant
              </p>
              <div className="space-y-8">
                {exercises.map((exercise, index) => (
                  <div
                    key={`${exercise.title || "exercise"}-${index}`}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <ExerciseContent
                      exercise={exercise}
                      index={index}
                      language={activeSession.language || "C"}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => setPhase(PHASES.lesson)} className="btn-outline">
                  Revoir le cours
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhase(PHASES.quiz);
                    setQuizFeedback(null);
                  }}
                  className="btn-primary"
                >
                  <PhaseIcon name="quiz" className="h-4 w-4" />
                  Passer au quiz ({quizData.questions.length} questions)
                </button>
              </div>
            </>
          )}

          {phase === PHASES.quiz && (
            <>
              <SectionHeading icon="quiz" title={quizData.title} />
              <p className="mb-4 text-sm text-udbl-muted">
                {quizData.questions.length} question(s) — dont{" "}
                {quizData.questions.filter((q) => isPracticalQuestion(q)).length} pratique(s) —
                score minimum : {quizData.passing_score || 70}%
              </p>

              <div className="space-y-6">
                {quizData.questions.map((question, qIndex) => (
                  <div key={qIndex} className="rounded-xl border border-slate-100 p-4">
                    <div className="mb-3">
                      <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-udbl-blue/10 px-2 py-0.5 text-xs font-bold text-udbl-blue">
                        <PhaseIcon name="quiz" className="h-3.5 w-3.5" />
                        Q{qIndex + 1}
                      </span>
                      {isPracticalQuestion(question) && (
                        <span className="mr-2 inline-flex rounded-full bg-udbl-green/10 px-2 py-0.5 text-xs font-semibold text-udbl-green-dark">
                          Pratique
                        </span>
                      )}
                      <QuestionContent text={question.question} />
                    </div>

                    {isPracticalQuestion(question) ? (
                      <CodeEditor
                        value={quizAnswers[qIndex] || ""}
                        onChange={(value) =>
                          setQuizAnswers((prev) => ({ ...prev, [qIndex]: value }))
                        }
                        language={question.language || activeSession.language || "C"}
                        disabled={quizSubmitting}
                      />
                    ) : (
                      <div className="space-y-2">
                        {(question.options || []).map((option, oIndex) => {
                          const selected = quizAnswers[qIndex] === option;
                          return (
                            <button
                              type="button"
                              key={`${qIndex}-${oIndex}`}
                              onClick={() =>
                                setQuizAnswers((prev) => ({ ...prev, [qIndex]: option }))
                              }
                              className={`course-quiz-option ${
                                selected ? "course-quiz-option--selected" : ""
                              }`}
                            >
                              <span className="course-quiz-option-letter">
                                {String.fromCharCode(65 + oIndex)}
                              </span>
                              <span className="whitespace-pre-wrap text-left">{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {quizData.questions.length === 0 && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Aucune question disponible pour cette leçon. Rechargez la page ou contactez
                  le support.
                </p>
              )}

              {quizFeedback && !quizFeedback.passed && phase === PHASES.quiz && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {quizFeedback.message}
                </p>
              )}

              <button
                type="button"
                onClick={submitQuiz}
                disabled={quizData.questions.length === 0 || quizSubmitting}
                className="btn-primary mt-6"
              >
                {quizSubmitting ? "Correction en cours..." : "Valider le quiz"}
              </button>
            </>
          )}

          {phase === PHASES.review && (
            <div>
              <SectionHeading
                icon="review"
                title={quizFeedback?.passed ? "Leçon validée !" : "Révision recommandée"}
              />
              <p className="mt-2 text-udbl-dark">{quizFeedback?.message}</p>
              {quizFeedback?.score != null && (
                <p className="mt-1 text-sm text-udbl-muted">
                  Score : {quizFeedback.score}% ({quizFeedback.correct}/
                  {quizFeedback.total} bonnes réponses)
                </p>
              )}

              {lesson.summary && (
                <p className="mt-4 border-l-4 border-udbl-green pl-3 text-sm italic text-udbl-muted">
                  {lesson.summary}
                </p>
              )}

              {!quizFeedback?.passed && (
                <div className="mt-4 space-y-3">
                  {quizData.questions.map(
                    (question, index) => {
                      const wasCorrect = quizResults?.find((r) => r.index === index)?.correct;
                      const wasWrong =
                        quizResults != null
                          ? !wasCorrect
                          : !isPracticalQuestion(question) &&
                            !checkQuizAnswer(
                              quizAnswers[index],
                              question.answer,
                              question.options || []
                            );

                      return (
                        question.explanation &&
                        wasWrong && (
                          <p
                            key={index}
                            className="rounded-xl bg-udbl-blue/5 px-4 py-3 text-sm"
                          >
                            <strong>Q{index + 1} :</strong> {question.explanation}
                          </p>
                        )
                      );
                    }
                  )}
                  {Array.isArray(lesson.learning_objectives) && (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {lesson.learning_objectives.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {!quizFeedback?.passed && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase(PHASES.lesson);
                        setQuizAnswers({});
                        setQuizFeedback(null);
                      }}
                      className="btn-outline"
                    >
                      Revoir la leçon
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase(PHASES.quiz);
                        setQuizFeedback(null);
                      }}
                      className="btn-primary"
                    >
                      Réessayer le quiz
                    </button>
                  </>
                )}

                {quizFeedback?.passed && nextUnlocked && (
                  <button
                    type="button"
                    onClick={() => openSession(nextUnlocked)}
                    className="btn-primary"
                  >
                    Leçon suivante →
                  </button>
                )}

                {quizFeedback?.passed && !nextUnlocked && (
                  <button type="button" onClick={backToOverview} className="btn-success">
                    🎉 Parcours terminé
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        badge="Cours"
        title="Votre parcours personnalisé"
        subtitle={`${completedCount}/${totalCount} leçon(s) validée(s) — adapté à vos lacunes`}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/agenda" className="link text-sm">
          Consulter mon agenda →
        </Link>
        {nextSession && (
          <button
            type="button"
            onClick={() => openSession(nextSession)}
            className="btn-primary text-sm"
          >
            Continuer : {nextSession.theme}
          </button>
        )}
      </div>

      <div className="card card-body mb-6">
        <div className="mb-2 flex justify-between text-sm text-udbl-muted">
          <span>Progression du parcours</span>
          <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => {
          const unlocked = isSessionUnlocked(session.session_order, progress);
          const completed = isSessionCompleted(session.session_order, progress);

          return (
            <article
              key={session.session_order}
              className={`card overflow-hidden ${!unlocked ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-udbl-blue text-sm font-bold text-white">
                    {session.session_order}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-udbl-muted">
                      Leçon {session.session_order}
                    </p>
                    <h2 className="font-bold text-udbl-blue">{session.theme}</h2>
                    {session.language && (
                      <span className="badge-blue mt-1">{session.language}</span>
                    )}
                  </div>
                </div>
                <SessionStatusBadge session={session} progress={progress} />
              </div>

              <div className="card-body flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-sm text-udbl-muted">
                  {session.lesson?.introduction
                    ? `${session.lesson.introduction.slice(0, 160)}...`
                    : "Leçon personnalisée sur vos lacunes."}
                </p>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => openSession(session)}
                  className={completed ? "btn-outline" : "btn-primary"}
                >
                  {completed ? "Revoir" : unlocked ? "Commencer" : "Verrouillée"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
