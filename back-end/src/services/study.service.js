import { getDb, insertAndGetId } from "../config/database.js";
import { generateStudyProgram } from "./llm.service.js";

function normalizeMiniQuiz(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      question: value.question || "Question de révision",
      options: Array.isArray(value.options)
        ? value.options
        : ["A", "B", "C", "D"],
      answer:
        value.answer ||
        value.correct_answer ||
        value.correctAnswer ||
        value.options?.[0] ||
        "A"
    };
  }

  if (typeof value === "string" && value.trim()) {
    return {
      question: value.trim(),
      options: ["A", "B", "C", "D"],
      answer: "A"
    };
  }

  return {
    question: "Question de révision",
    options: ["A", "B", "C", "D"],
    answer: "A"
  };
}

function normalizeExercise(value) {
  if (typeof value === "string") {
    return value.trim() || "Exercice à compléter.";
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "Exercice à compléter.";
}

function normalizeLesson(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    return {
      introduction: value.trim(),
      detailed_explanation: value.trim(),
      summary: value.trim()
    };
  }
  return { introduction: "Cours à compléter." };
}

function normalizeSession(session, index) {
  return {
    session_order: Number(session.session_order) || index + 1,
    theme: String(session.theme || `Séance ${index + 1}`),
    language: session.language || (index % 2 === 0 ? "C" : "Python"),
    lesson: normalizeLesson(session.lesson),
    exercise: normalizeExercise(session.exercise),
    mini_quiz: normalizeMiniQuiz(session.mini_quiz)
  };
}

function toJsonColumn(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return value;
}

async function buildSessions(themes) {
  let rawSessions;
  try {
    rawSessions = await generateStudyProgram(themes);
  } catch (err) {
    console.error("Génération IA impossible :", err.message);
    rawSessions = [];
  }

  const sessions = (Array.isArray(rawSessions) ? rawSessions : [])
    .slice(0, 5)
    .map(normalizeSession);

  if (sessions.length === 0) {
    throw new Error("Impossible de générer les séances du programme");
  }

  return sessions;
}

async function saveSessions(trx, programId, sessions) {
  for (const session of sessions) {
    await trx("study_sessions").insert({
      program_id: programId,
      session_order: session.session_order,
      theme: session.theme,
      lesson: toJsonColumn(session.lesson),
      exercise: toJsonColumn(session.exercise),
      mini_quiz: toJsonColumn(session.mini_quiz)
    });
  }
}

export async function getUserProgram(userId) {
  const db = getDb();
  const numericUserId = Number(userId);
  const { program, sessions } = await findProgramWithSessions(db, numericUserId);

  if (!program || sessions.length === 0) {
    return null;
  }

  return {
    programId: program.id,
    sessions,
    existing: true
  };
}

export async function createStudyProgram(userId, weakThemes) {
  const db = getDb();
  const numericUserId = Number(userId);

  if (!Number.isFinite(numericUserId)) {
    throw new Error("Identifiant utilisateur invalide");
  }

  const user = await db("users").where({ id: numericUserId }).first();
  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  const themes =
    Array.isArray(weakThemes) && weakThemes.length > 0
      ? weakThemes.map(String)
      : ["variables", "conditions", "boucles"];

  const { program: existingProgram, sessions: existingSessions } =
    await findProgramWithSessions(db, numericUserId);

  if (existingSessions.length > 0 && existingProgram) {
    return {
      programId: existingProgram.id,
      sessions: existingSessions,
      existing: true
    };
  }

  if (existingProgram) {
    const sessions = await buildSessions(themes);
    await db.transaction(async (trx) => {
      await saveSessions(trx, existingProgram.id, sessions);
    });
    return { programId: existingProgram.id, sessions, repaired: true };
  }

  const sessions = await buildSessions(themes);

  return db.transaction(async (trx) => {
    const programId = await insertAndGetId(
      "study_programs",
      {
        user_id: numericUserId,
        weak_themes: toJsonColumn(themes)
      },
      trx
    );

    await saveSessions(trx, programId, sessions);
    return { programId, sessions };
  });
}

function parseStoredField(value) {
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function getProgramSessions(programId) {
  const db = getDb();
  const rows = await db("study_sessions")
    .where({ program_id: programId })
    .orderBy("session_order", "asc");

  return rows.map((row) => ({
    session_order: row.session_order,
    theme: row.theme,
    lesson: parseStoredField(row.lesson),
    exercise: parseStoredField(row.exercise),
    mini_quiz: parseStoredField(row.mini_quiz)
  }));
}

async function findProgramWithSessions(db, userId) {
  const programs = await db("study_programs")
    .where({ user_id: userId })
    .orderBy("id", "desc");

  for (const program of programs) {
    const sessions = await getProgramSessions(program.id);
    if (sessions.length > 0) {
      return { program, sessions };
    }
  }

  return { program: programs[0] || null, sessions: [] };
}
