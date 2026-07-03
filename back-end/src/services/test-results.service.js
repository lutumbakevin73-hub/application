import { getDb } from "../config/database.js";
import { getRecommendedProgram } from "../config/programs.js";
import { findUserById } from "./auth.service.js";

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

function toJsonColumn(value) {
  return JSON.stringify(value ?? null);
}

export function normalizeTestPayload(payload = {}) {
  const score = Math.round(Number(payload.score ?? payload.percentage ?? 0));
  const correctCount = Number(payload.correct_count ?? payload.correct ?? 0);
  const totalCount = Number(payload.total_count ?? payload.total ?? 0);
  const weakThemes = Array.isArray(payload.weak_themes ?? payload.weakThemes)
    ? (payload.weak_themes ?? payload.weakThemes).map(String).filter(Boolean)
    : [];

  const byTheme =
    payload.by_theme && typeof payload.by_theme === "object"
      ? payload.by_theme
      : payload.byTheme && typeof payload.byTheme === "object"
        ? payload.byTheme
        : {};

  const byLanguage =
    payload.by_language && typeof payload.by_language === "object"
      ? payload.by_language
      : payload.byLanguage && typeof payload.byLanguage === "object"
        ? payload.byLanguage
        : {};

  const details = Array.isArray(payload.details) ? payload.details : [];

  const themes =
    weakThemes.length > 0
      ? weakThemes
      : Object.entries(byTheme)
          .filter(([, stats]) => {
            const total = Number(stats?.total || 0);
            const correct = Number(stats?.correct || 0);
            return total > 0 && (correct / total) * 100 < 70;
          })
          .map(([theme]) => theme);

  const safeThemes = themes.length > 0 ? themes : ["variables", "conditions"];

  return {
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0,
    correct_count: Number.isFinite(correctCount) ? correctCount : 0,
    total_count: Number.isFinite(totalCount) ? totalCount : 0,
    weak_themes: safeThemes,
    by_theme: byTheme,
    by_language: byLanguage,
    details,
    recommended_program: getRecommendedProgram(score)
  };
}

export function formatTestResult(row) {
  if (!row) {
    return null;
  }

  const byTheme = parseJsonField(row.by_theme, {});
  const themeEntries = Object.entries(byTheme).map(([theme, stats]) => {
    const total = Number(stats?.total || 0);
    const correct = Number(stats?.correct || 0);
    const failed = Math.max(0, total - correct);
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { theme, total, correct, failed, percent };
  });

  const weakThemesList = parseJsonField(row.weak_themes, []);
  const weakThemeDetails = weakThemesList.map((theme) => {
    const entry =
      themeEntries.find((item) => item.theme.toLowerCase() === String(theme).toLowerCase()) ||
      { theme, total: 0, correct: 0, failed: 0, percent: 0 };
    return entry;
  });

  return {
    score: row.score,
    correct_count: row.correct_count,
    total_count: row.total_count,
    language: row.language || null,
    recommended_program: row.recommended_program,
    weak_themes: weakThemesList,
    weak_theme_details: weakThemeDetails,
    by_theme: byTheme,
    by_language: parseJsonField(row.by_language, {}),
    theme_breakdown: themeEntries,
    details: parseJsonField(row.details, []),
    completed_at: row.completed_at,
    chart: {
      labels: themeEntries.map((item) => item.theme),
      scores: themeEntries.map((item) => item.percent)
    }
  };
}

export async function saveTestResult(userId, payload) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  const normalized = normalizeTestPayload(payload);
  const db = getDb();

  const data = {
    user_id: userId,
    score: normalized.score,
    correct_count: normalized.correct_count,
    total_count: normalized.total_count,
    language: user.preferred_language || payload.language || null,
    recommended_program: normalized.recommended_program,
    weak_themes: toJsonColumn(normalized.weak_themes),
    by_theme: toJsonColumn(normalized.by_theme),
    by_language: toJsonColumn(normalized.by_language),
    details: toJsonColumn(normalized.details),
    completed_at: db.fn.now()
  };

  const existing = await db("test_results").where({ user_id: userId }).first();
  if (existing) {
    await db("test_results").where({ id: existing.id }).update(data);
  } else {
    await db("test_results").insert(data);
  }

  await db("users").where({ id: userId }).update({ has_passed_test: true });

  const row = await db("test_results").where({ user_id: userId }).first();
  return formatTestResult(row);
}

export async function getTestResult(userId) {
  const row = await getDb()("test_results").where({ user_id: userId }).first();
  return formatTestResult(row);
}

export async function markTestComplete(userId) {
  await getDb()("users").where({ id: userId }).update({ has_passed_test: true });
}
