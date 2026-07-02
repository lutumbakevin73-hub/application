import { getDb } from "../config/database.js";

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

function normalizeProgress(row) {
  const completed = parseJsonField(row?.completed, []);
  const quizAttempts = parseJsonField(row?.quiz_attempts, {});

  return {
    completed: Array.isArray(completed)
      ? [...new Set(completed.map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort(
          (a, b) => a - b
        )
      : [],
    quizAttempts:
      quizAttempts && typeof quizAttempts === "object" ? quizAttempts : {}
  };
}

export async function getLessonProgress(userId, programId) {
  if (!userId || !programId) {
    return { completed: [], quizAttempts: {} };
  }

  const row = await getDb()("lesson_progress")
    .where({ user_id: userId, program_id: programId })
    .first();

  return normalizeProgress(row);
}

export async function saveLessonProgress(userId, programId, payload) {
  if (!userId || !programId) {
    throw new Error("Programme invalide");
  }

  const completed = Array.isArray(payload?.completed)
    ? [...new Set(payload.completed.map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort(
        (a, b) => a - b
      )
    : [];

  const quizAttempts =
    payload?.quizAttempts && typeof payload.quizAttempts === "object"
      ? payload.quizAttempts
      : {};

  const db = getDb();
  const existing = await db("lesson_progress")
    .where({ user_id: userId, program_id: programId })
    .first();

  const data = {
    completed: JSON.stringify(completed),
    quiz_attempts: JSON.stringify(quizAttempts),
    updated_at: db.fn.now()
  };

  if (existing) {
    await db("lesson_progress").where({ id: existing.id }).update(data);
  } else {
    await db("lesson_progress").insert({
      user_id: userId,
      program_id: programId,
      ...data
    });
  }

  return { completed, quizAttempts };
}
