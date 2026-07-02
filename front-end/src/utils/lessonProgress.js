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

export function recordQuizAttempt(programId, progress, sessionOrder, passed) {
  const quizAttempts = {
    ...progress.quizAttempts,
    [sessionOrder]: { passed, at: new Date().toISOString() }
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
