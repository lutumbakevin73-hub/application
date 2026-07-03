export function getWeakThemeDetails(testResult) {
  if (!testResult) {
    return [];
  }

  if (testResult.weak_theme_details?.length > 0) {
    return testResult.weak_theme_details;
  }

  const weakThemes = testResult.weak_themes || [];
  const breakdown = testResult.theme_breakdown || [];
  const byTheme = testResult.by_theme || {};

  return weakThemes.map((theme) => {
    const fromBreakdown = breakdown.find(
      (item) => item.theme?.toLowerCase() === String(theme).toLowerCase()
    );
    if (fromBreakdown) {
      return {
        theme,
        total: fromBreakdown.total,
        correct: fromBreakdown.correct,
        failed: fromBreakdown.failed ?? Math.max(0, fromBreakdown.total - fromBreakdown.correct),
        percent: fromBreakdown.percent
      };
    }

    const stats = byTheme[theme];
    if (stats) {
      const total = Number(stats.total || 0);
      const correct = Number(stats.correct || 0);
      return {
        theme,
        total,
        correct,
        failed: Math.max(0, total - correct),
        percent: total > 0 ? Math.round((correct / total) * 100) : 0
      };
    }

    return { theme, total: 0, correct: 0, failed: 0, percent: 0 };
  });
}

export function getWeakThemesFromEvaluation(byTheme = {}) {
  return Object.entries(byTheme)
    .filter(([, stats]) => {
      const total = Number(stats?.total || 0);
      const correct = Number(stats?.correct || 0);
      return total > 0 && (correct / total) * 100 < 70;
    })
    .map(([theme, stats]) => {
      const total = Number(stats.total || 0);
      const correct = Number(stats.correct || 0);
      return {
        theme,
        total,
        correct,
        failed: Math.max(0, total - correct),
        percent: total > 0 ? Math.round((correct / total) * 100) : 0
      };
    });
}

function getBestQuizScore(raw) {
  if (!raw) {
    return null;
  }
  if (raw.bestScore != null) {
    return Number(raw.bestScore);
  }
  if (Array.isArray(raw.attempts) && raw.attempts.length > 0) {
    const scores = raw.attempts
      .map((item) => Number(item?.score))
      .filter((score) => Number.isFinite(score));
    return scores.length ? Math.max(...scores) : null;
  }
  if (raw.passed != null) {
    return raw.passed ? 100 : 0;
  }
  return null;
}

export function buildThemeEvolution(testResult, sessions = [], progress = {}) {
  const weakDetails = getWeakThemeDetails(testResult);
  if (!weakDetails.length) {
    return [];
  }

  const lessonScores = {};
  for (const session of sessions) {
    const theme = session.theme;
    if (!theme) {
      continue;
    }
    const key = theme.toLowerCase();
    const order = session.session_order;
    const raw =
      progress?.quizAttempts?.[order] ??
      progress?.quizAttempts?.[String(order)];
    const bestScore = getBestQuizScore(raw);
    if (bestScore == null) {
      continue;
    }
    lessonScores[key] =
      lessonScores[key] == null ? bestScore : Math.max(lessonScores[key], bestScore);
  }

  return weakDetails.map((item) => {
    const lessonBest = lessonScores[item.theme.toLowerCase()] ?? null;
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
