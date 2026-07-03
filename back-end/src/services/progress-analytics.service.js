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

export async function getStudentLessonAnalytics(db, user) {
  if (!user || user.role === "admin") {
    return null;
  }

  const program = await db("study_programs")
    .where({ user_id: user.id })
    .orderBy("id", "desc")
    .first();

  if (!program) {
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        preferred_language: user.preferred_language || null
      },
      has_course: false,
      program: null,
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

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      preferred_language: user.preferred_language || null
    },
    has_course: sessions.length > 0,
    program: program.program || null,
    program_id: program.id,
    language: sessions[0]?.language || user.preferred_language || null,
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
