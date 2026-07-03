export function getProgressKey(programId) {
  return `lessonProgress_${programId}`;
}

export function loadProgress(programId) {
  if (!programId) {
    return { completed: [], quizAttempts: {} };
  }
  try {
    const raw = localStorage.getItem(getProgressKey(programId));
    if (!raw) {
      return { completed: [], quizAttempts: {} };
    }
    const parsed = JSON.parse(raw);
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      quizAttempts:
        parsed.quizAttempts && typeof parsed.quizAttempts === "object"
          ? parsed.quizAttempts
          : {}
    };
  } catch {
    return { completed: [], quizAttempts: {} };
  }
}

export function saveProgress(programId, progress) {
  if (!programId) return;
  localStorage.setItem(getProgressKey(programId), JSON.stringify(progress));
}

export function isSessionUnlocked(sessionOrder, progress) {
  if (sessionOrder <= 1) return true;
  return progress.completed.includes(sessionOrder - 1);
}

export function isSessionCompleted(sessionOrder, progress) {
  return progress.completed.includes(sessionOrder);
}

export function markSessionCompleted(programId, progress, sessionOrder) {
  const completed = [...new Set([...progress.completed, sessionOrder])].sort(
    (a, b) => a - b
  );
  const next = { ...progress, completed };
  saveProgress(programId, next);
  return next;
}

export function recordQuizAttempt(programId, progress, sessionOrder, result) {
  const key = String(sessionOrder);
  const existing = progress.quizAttempts?.[key] ?? progress.quizAttempts?.[sessionOrder];
  const previousAttempts = Array.isArray(existing?.attempts)
    ? existing.attempts
    : existing?.passed != null
      ? [
          {
            score: existing.passed ? 100 : 0,
            correct: null,
            total: null,
            passed: Boolean(existing.passed),
            theme: existing.theme || null,
            at: existing.at || null
          }
        ]
      : [];

  const attempt = {
    score: Number.isFinite(Number(result?.score)) ? Number(result.score) : null,
    correct: Number.isFinite(Number(result?.correct)) ? Number(result.correct) : null,
    total: Number.isFinite(Number(result?.total)) ? Number(result.total) : null,
    passed: Boolean(result?.passed),
    theme: result?.theme || null,
    at: new Date().toISOString()
  };

  const attempts = [...previousAttempts, attempt];
  const scored = attempts.filter((item) => item.score != null);
  const bestScore = scored.length ? Math.max(...scored.map((item) => item.score)) : null;
  const lastScore = attempt.score;

  const quizAttempts = {
    ...progress.quizAttempts,
    [key]: {
      attempts,
      bestScore,
      lastScore,
      passed: attempts.some((item) => item.passed),
      attemptCount: attempts.length
    }
  };

  const next = { ...progress, quizAttempts };
  saveProgress(programId, next);
  return next;
}

export function checkQuizAnswer(selected, expected, options = []) {
  const normalized = (value) => String(value ?? "").trim().toLowerCase();
  const selectedNorm = normalized(selected);
  const expectedNorm = normalized(expected);

  if (selectedNorm === expectedNorm) {
    return true;
  }

  const expectedIndex = Number(expected);
  if (
    Number.isInteger(expectedIndex) &&
    options[expectedIndex] != null &&
    normalized(options[expectedIndex]) === selectedNorm
  ) {
    return true;
  }

  const selectedIndex = options.findIndex(
    (option) => normalized(option) === selectedNorm
  );
  if (selectedIndex >= 0 && normalized(options[selectedIndex]) === expectedNorm) {
    return true;
  }

  return false;
}
