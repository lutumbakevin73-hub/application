import { getDb, insertAndGetId } from "../config/database.js";
import { getSessionCount, normalizeProgramId } from "../config/programs.js";
import { generateStudyProgram } from "./llm.service.js";

function normalizeQuestionType(value) {
  const type = String(value?.type || value?.question_type || "").toLowerCase();
  if (type === "pratique" || type === "code" || type === "practical") {
    return "pratique";
  }

  const answer =
    value?.answer ||
    value?.correct_answer ||
    value?.correctAnswer ||
    value?.expected_answer;

  if (answer && (!Array.isArray(value?.options) || value.options.length === 0)) {
    return "pratique";
  }

  return "qcm";
}

function normalizeQuestion(value, language = "C") {
  if (!value || typeof value !== "object") {
    return {
      type: "qcm",
      question: "Question de révision",
      options: ["A", "B", "C", "D"],
      answer: "A",
      correctAnswer: "A",
      language,
      explanation: ""
    };
  }

  const type = normalizeQuestionType(value);
  const options =
    type === "qcm" && Array.isArray(value.options) && value.options.length > 0
      ? value.options
      : type === "qcm"
        ? ["A", "B", "C", "D"]
        : [];

  const answer =
    value.answer ||
    value.correct_answer ||
    value.correctAnswer ||
    value.expected_answer ||
    options[0] ||
    "A";

  return {
    type,
    question: value.question || "Question de révision",
    options,
    answer: String(answer),
    correctAnswer: String(answer),
    language: value.language || language,
    explanation: value.explanation || value.feedback || ""
  };
}

function normalizeMiniQuiz(value, language = "C") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Array.isArray(value.questions) && value.questions.length > 0) {
      return {
        title: value.title || "Quiz de fin de leçon",
        passing_score: Number(value.passing_score) || 70,
        questions: value.questions
          .map((q) => normalizeQuestion(q, value.language || language))
          .slice(0, 10)
      };
    }

    return {
      title: value.title || "Quiz de fin de leçon",
      passing_score: Number(value.passing_score) || 70,
      questions: [normalizeQuestion(value, language)]
    };
  }

  if (typeof value === "string" && value.trim()) {
    return {
      title: "Quiz de fin de leçon",
      passing_score: 70,
      questions: [
        {
          question: value.trim(),
          options: ["A", "B", "C", "D"],
          answer: "A",
          explanation: ""
        }
      ]
    };
  }

  return {
    title: "Quiz de fin de leçon",
    passing_score: 70,
    questions: [normalizeQuestion(null)]
  };
}

function normalizeExercise(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return {
        title: "Exercice pratique",
        instructions: "Exercice à compléter.",
        hints: [],
        starter_code: "",
        expected_result: ""
      };
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return normalizeExerciseObject(parsed);
      }
    } catch {
      // plain text
    }

    return {
      title: "Exercice pratique",
      instructions: trimmed,
      hints: [],
      starter_code: "",
      expected_result: ""
    };
  }

  if (value && typeof value === "object") {
    return normalizeExerciseObject(value);
  }

  return {
    title: "Exercice pratique",
    instructions: "Exercice à compléter.",
    hints: [],
    starter_code: "",
    expected_result: ""
  };
}

function normalizeExerciseObject(value) {
  return {
    title: value.title || "Exercice pratique",
    instructions: value.instructions || value.description || "",
    hints: Array.isArray(value.hints) ? value.hints : [],
    starter_code: value.starter_code || value.starterCode || "",
    expected_result: value.expected_result || value.expectedResult || "",
    solution_approach: value.solution_approach || value.solutionApproach || ""
  };
}

const EXERCISES_PER_LESSON = 3;

function normalizeExercises(value) {
  let items = [];

  if (Array.isArray(value)) {
    items = value;
  } else if (value && typeof value === "object") {
    items = [value];
  } else if (typeof value === "string" && value.trim()) {
    items = [{ instructions: value.trim() }];
  }

  const normalized = items.map((item) =>
    typeof item === "string" ? normalizeExercise({ instructions: item }) : normalizeExerciseObject(item)
  );

  if (normalized.length === 0) {
    normalized.push(normalizeExercise(null));
  }

  while (normalized.length < EXERCISES_PER_LESSON) {
    const base = normalized[normalized.length - 1];
    normalized.push({
      ...base,
      title: `${base.title || "Exercice pratique"} — variante ${normalized.length + 1}`,
      instructions: `${base.instructions}\n\nVariante : adaptez le programme avec de nouvelles valeurs ou contraintes.`
    });
  }

  return normalized.slice(0, EXERCISES_PER_LESSON);
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

function normalizeSession(session, index, language = "C") {
  const lang = language === "Python" ? "Python" : "C";
  return {
    session_order: Number(session.session_order) || index + 1,
    theme: String(session.theme || `Séance ${index + 1}`),
    language: session.language === "Python" || session.language === "C" ? session.language : lang,
    lesson: normalizeLesson(session.lesson),
    exercise: normalizeExercises(session.exercises ?? session.exercise),
    mini_quiz: normalizeMiniQuiz(session.mini_quiz, lang)
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

async function buildSessions(themes, program, language = "C", onProgress) {
  const sessionCount = getSessionCount(program);
  const lang = language === "Python" ? "Python" : "C";

  let rawSessions;
  try {
    rawSessions = await generateStudyProgram(themes, sessionCount, lang, onProgress);
  } catch (err) {
    console.error("Génération IA impossible :", err.message);
    rawSessions = [];
  }

  const sessions = (Array.isArray(rawSessions) ? rawSessions : [])
    .slice(0, sessionCount)
    .map((session, index) => normalizeSession(session, index, lang));

  if (sessions.length === 0) {
    throw new Error("Impossible de générer les séances du programme");
  }

  return sessions.map((session, index) => {
    const fallbackTheme = themes[index % themes.length] || `séance ${index + 1}`;
    const label =
      fallbackTheme.charAt(0).toUpperCase() + fallbackTheme.slice(1);

    return {
      ...session,
      session_order: index + 1,
      theme: session.theme || label
    };
  });
}

async function saveSessions(trx, programId, sessions) {
  for (const session of sessions) {
    await trx("study_sessions").insert({
      program_id: programId,
      session_order: session.session_order,
      theme: session.theme,
      language: session.language || "C",
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
    program: program.program || null,
    sessions,
    existing: true
  };
}

export async function createStudyProgram(userId, weakThemes, programCode, onProgress) {
  const program = normalizeProgramId(programCode);
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

  const learningLanguage = user.preferred_language === "Python" ? "Python" : "C";

  const { program: existingProgram, sessions: existingSessions } =
    await findProgramWithSessions(db, numericUserId);

  if (existingSessions.length > 0 && existingProgram) {
    if (typeof onProgress === "function") {
      onProgress({
        phase: "done",
        message: "Programme déjà disponible.",
        percent: 100,
        current: existingSessions.length,
        total: existingSessions.length
      });
    }
    return {
      programId: existingProgram.id,
      program: existingProgram.program || program,
      sessions: existingSessions,
      existing: true
    };
  }

  if (existingProgram) {
    const sessions = await buildSessions(themes, program, learningLanguage, onProgress);
    if (typeof onProgress === "function") {
      onProgress({ phase: "saving", message: "Enregistrement en base de données...", percent: 95 });
    }
    await db.transaction(async (trx) => {
      await trx("study_programs")
        .where({ id: existingProgram.id })
        .update({ program, weak_themes: toJsonColumn(themes) });
      await saveSessions(trx, existingProgram.id, sessions);
    });
    return {
      programId: existingProgram.id,
      program,
      sessions,
      repaired: true
    };
  }

  const sessions = await buildSessions(themes, program, learningLanguage, onProgress);

  if (typeof onProgress === "function") {
    onProgress({ phase: "saving", message: "Enregistrement de votre programme...", percent: 95 });
  }

  return db.transaction(async (trx) => {
    const programId = await insertAndGetId(
      "study_programs",
      {
        user_id: numericUserId,
        weak_themes: toJsonColumn(themes),
        program
      },
      trx
    );

    await saveSessions(trx, programId, sessions);
    return { programId, program, sessions };
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
    language: row.language || "C",
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
