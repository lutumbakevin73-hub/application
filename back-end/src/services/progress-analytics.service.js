import { getProgramLabel } from "../config/programs.js";
import { getTestResult } from "./test-results.service.js";

function parseJsonField(value, fallback) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

export function normalizeQuizEntry(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      attempts: [],
      bestScore: null,
      lastScore: null,
      passed: false,
      attemptCount: 0
    };
  }

  if (Array.isArray(raw.attempts)) {
    const attempts = raw.attempts.map((item) => ({
      score: Number.isFinite(Number(item?.score)) ? Number(item.score) : null,
      correct: Number.isFinite(Number(item?.correct)) ? Number(item.correct) : null,
      total: Number.isFinite(Number(item?.total)) ? Number(item.total) : null,
      passed: Boolean(item?.passed),
      theme: item?.theme || null,
      at: item?.at || null
    }));

    const scored = attempts.filter((item) => item.score != null);
    const bestScore =
      raw.bestScore != null
        ? Number(raw.bestScore)
        : scored.length
          ? Math.max(...scored.map((item) => item.score))
          : null;
    const lastAttempt = attempts[attempts.length - 1];

    return {
      attempts,
      bestScore,
      lastScore: lastAttempt?.score ?? null,
      passed: Boolean(raw.passed ?? lastAttempt?.passed),
      attemptCount: attempts.length
    };
  }

  const legacyPassed = Boolean(raw.passed);
  return {
    attempts: [
      {
        score: legacyPassed ? 100 : 0,
        correct: null,
        total: null,
        passed: legacyPassed,
        theme: raw.theme || null,
        at: raw.at || null
      }
    ],
    bestScore: legacyPassed ? 100 : 0,
    lastScore: legacyPassed ? 100 : 0,
    passed: legacyPassed,
    attemptCount: 1
  };
}

export function buildLessonAnalytics(sessions, lessonProgress) {
  const completedOrders = new Set(
    (lessonProgress?.completed || []).map(Number).filter((n) => Number.isInteger(n) && n > 0)
  );
  const quizAttempts = lessonProgress?.quizAttempts || {};

  const lessons = sessions.map((session) => {
    const order = Number(session.session_order);
    const raw =
      quizAttempts[order] ??
      quizAttempts[String(order)] ??
      quizAttempts[`${order}`];
    const quiz = normalizeQuizEntry(raw);

    return {
      session_order: order,
      theme: session.theme,
      language: session.language || null,
      completed: completedOrders.has(order),
      ...quiz
    };
  });

  const attempted = lessons.filter((lesson) => lesson.attemptCount > 0);
  const scored = attempted.filter((lesson) => lesson.bestScore != null);
  const averageBestScore =
    scored.length > 0
      ? Math.round(scored.reduce((sum, lesson) => sum + lesson.bestScore, 0) / scored.length)
      : null;

  return {
    lessons,
    summary: {
      lessons_total: lessons.length,
      lessons_completed: completedOrders.size,
      lessons_attempted: attempted.length,
      average_best_score: averageBestScore,
      completion_percent:
        lessons.length > 0
          ? Math.round((completedOrders.size / lessons.length) * 100)
          : 0
    },
    chart: {
      labels: lessons.map((lesson) => `Leçon ${lesson.session_order}`),
      themes: lessons.map((lesson) => lesson.theme),
      best_scores: lessons.map((lesson) => lesson.bestScore),
      last_scores: lessons.map((lesson) => lesson.lastScore),
      completed: lessons.map((lesson) => lesson.completed)
    }
  };
}

function findLessonScoreForTheme(lessons, theme) {
  const key = String(theme).toLowerCase();
  let bestScore = null;

  for (const lesson of lessons || []) {
    if (String(lesson.theme || "").toLowerCase() !== key) {
      continue;
    }
    if (lesson.bestScore == null) {
      continue;
    }
    bestScore = bestScore == null ? lesson.bestScore : Math.max(bestScore, lesson.bestScore);
  }

  return bestScore;
}

export function buildThemeEvolution(entryTest, lessons = []) {
  if (!entryTest) {
    return [];
  }

  const details =
    entryTest.weak_theme_details?.length > 0
      ? entryTest.weak_theme_details
      : (entryTest.weak_themes || []).map((theme) => {
          const stats = entryTest.by_theme?.[theme];
          const total = Number(stats?.total || 0);
          const correct = Number(stats?.correct || 0);
          return {
            theme,
            total,
            correct,
            failed: Math.max(0, total - correct),
            percent: total > 0 ? Math.round((correct / total) * 100) : 0
          };
        });

  return details.map((item) => {
    const lessonBest = findLessonScoreForTheme(lessons, item.theme);
    const delta = lessonBest != null ? lessonBest - item.percent : null;

    return {
      theme: item.theme,
      test_score: item.percent,
      test_correct: item.correct,
      test_total: item.total,
      test_failed: item.failed,
      lesson_best_score: lessonBest,
      delta,
      improved: delta != null && delta > 0,
      reached_goal: lessonBest != null && lessonBest >= 70,
      status:
        lessonBest == null
          ? "pending"
          : lessonBest >= 70
            ? "achieved"
            : delta > 0
              ? "progressing"
              : "stagnant"
    };
  });
}

function buildProgressOverview(entryTest, lessonAnalytics) {
  const lessonChart = lessonAnalytics?.chart || {
    labels: [],
    best_scores: [],
    completed: []
  };

  const combined = {
    labels: entryTest ? ["Test d'entrée", ...lessonChart.labels] : [...lessonChart.labels],
    scores: entryTest
      ? [entryTest.score, ...lessonChart.best_scores]
      : [...lessonChart.best_scores],
    completed: entryTest
      ? [true, ...lessonChart.completed]
      : [...lessonChart.completed]
  };

  const journey = [
    {
      key: "test",
      label: "Test d'entrée",
      done: Boolean(entryTest),
      detail: entryTest ? `${entryTest.score}%` : "Non passé"
    },
    {
      key: "program",
      label: "Programme assigné",
      done: Boolean(lessonAnalytics?.lessons?.length),
      detail: entryTest?.recommended_program
        ? getProgramLabel(entryTest.recommended_program)
        : "—"
    },
    {
      key: "lessons",
      label: "Leçons validées",
      done: (lessonAnalytics?.summary?.lessons_completed || 0) > 0,
      detail: lessonAnalytics?.summary
        ? `${lessonAnalytics.summary.lessons_completed}/${lessonAnalytics.summary.lessons_total}`
        : "0/0"
    }
  ];

  return { combined, journey };
}

export async function getStudentLessonAnalytics(db, user) {
  if (!user || user.role === "admin") {
    return null;
  }

  const entryTest = await getTestResult(user.id);

  const program = await db("study_programs")
    .where({ user_id: user.id })
    .orderBy("id", "desc")
    .first();

  if (!program) {
    const emptyLessons = {
      lessons: [],
      summary: {
        lessons_total: 0,
        lessons_completed: 0,
        lessons_attempted: 0,
        average_best_score: null,
        completion_percent: 0
      },
      chart: {
        labels: [],
        themes: [],
        best_scores: [],
        last_scores: [],
        completed: []
      }
    };
    const overview = buildProgressOverview(entryTest, emptyLessons);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        preferred_language: user.preferred_language || null
      },
      has_course: false,
      program: entryTest?.recommended_program || null,
      entry_test: entryTest,
      theme_evolution: buildThemeEvolution(entryTest, []),
      progress_overview: overview,
      ...emptyLessons
    };
  }

  const sessions = await db("study_sessions")
    .where({ program_id: program.id })
    .orderBy("session_order", "asc");

  const progressRow = await db("lesson_progress")
    .where({ user_id: user.id, program_id: program.id })
    .first();

  const lessonProgress = {
    completed: parseJsonField(progressRow?.completed, []),
    quizAttempts: parseJsonField(progressRow?.quiz_attempts, {})
  };

  const analytics = buildLessonAnalytics(sessions, lessonProgress);
  const overview = buildProgressOverview(entryTest, analytics);
  const themeEvolution = buildThemeEvolution(entryTest, analytics.lessons);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      preferred_language: user.preferred_language || null
    },
    has_course: sessions.length > 0,
    program: program.program || entryTest?.recommended_program || null,
    program_id: program.id,
    language: sessions[0]?.language || user.preferred_language || null,
    entry_test: entryTest,
    theme_evolution: themeEvolution,
    progress_overview: overview,
    ...analytics
  };
}

export async function listStudentsLessonProgress(db) {
  const users = await db("users")
    .select("id", "username", "email", "role", "preferred_language", "has_passed_test")
    .where({ role: "user" })
    .orderBy("username", "asc");

  const results = await Promise.all(users.map((user) => getStudentLessonAnalytics(db, user)));

  return results
    .filter(Boolean)
    .map((item) => ({
      user: item.user,
      has_course: item.has_course,
      program: item.program,
      language: item.language,
      entry_test_score: item.entry_test?.score ?? null,
      summary: item.summary
    }));
}

export async function getStudentLessonProgressDetail(db, userId) {
  const user = await db("users")
    .select("id", "username", "email", "role", "preferred_language", "has_passed_test")
    .where({ id: userId })
    .first();

  if (!user) {
    return null;
  }

  if (user.role === "admin") {
    throw new Error("Les comptes administrateur n'ont pas de progression de cours.");
  }

  return getStudentLessonAnalytics(db, user);
}
