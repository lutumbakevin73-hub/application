import { getDb } from "../config/database.js";
import { normalizeLearningLanguage } from "../config/languages.js";
import { generateTestQuestions } from "./llm.service.js";

export async function saveQuestions(questions) {
  const db = getDb();

  for (const q of questions) {
    await db("questions").insert({
      type: q.type,
      language: q.language,
      theme: q.theme,
      question: q.question,
      options: q.options ? JSON.stringify(q.options) : null,
      correct_answer: String(q.correctAnswer)
    });
  }
}

export async function getQuestionsFromDB(limit = 10, language = "C") {
  const db = getDb();
  const lang = normalizeLearningLanguage(language) || "C";
  const randomFn = db.client.config.client === "mysql2" ? "RAND()" : "RANDOM()";
  const rows = await db("questions")
    .where({ language: lang })
    .orderByRaw(randomFn)
    .limit(limit);

  if (rows.length < limit) {
    const fallbackRows = await db("questions").orderByRaw(randomFn).limit(limit);
    return fallbackRows.map(mapQuestionRow);
  }

  return rows.map(mapQuestionRow);
}

function mapQuestionRow(q) {
  return {
    id: q.id,
    type: q.type,
    language: q.language,
    theme: q.theme,
    question: q.question,
    options: q.options
      ? typeof q.options === "string"
        ? JSON.parse(q.options)
        : q.options
      : null,
    correctAnswer: isNaN(Number(q.correct_answer))
      ? q.correct_answer
      : Number(q.correct_answer)
  };
}

const TEST_QUESTION_COUNT = 20;

function isValidQuestion(q) {
  if (!q || typeof q !== "object") return false;
  if (!q.question || String(q.question).trim().length < 10) return false;
  if (!q.theme) return false;

  if (q.type === "qcm") {
    return (
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every((o) => String(o).trim().length > 0) &&
      Number.isInteger(Number(q.correctAnswer)) &&
      q.correctAnswer >= 0 &&
      q.correctAnswer < 4
    );
  }

  if (q.type === "pratique") {
    return String(q.correctAnswer || "").trim().length >= 8;
  }

  return false;
}

function normalizeQuestions(questions, language) {
  const lang = normalizeLearningLanguage(language) || "C";
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .filter(isValidQuestion)
    .slice(0, TEST_QUESTION_COUNT)
    .map((q, index) => ({
      ...q,
      id: index + 1,
      language: normalizeLearningLanguage(q.language) || lang
    }));
}

export async function startTest(language) {
  const lang = normalizeLearningLanguage(language);
  if (!lang) {
    throw new Error("Choisissez d'abord un langage (C ou Python).");
  }

  try {
    const questions = normalizeQuestions(await generateTestQuestions(lang), lang);
    if (questions.length < TEST_QUESTION_COUNT) {
      throw new Error("Nombre de questions insuffisant");
    }
    await saveQuestions(questions);
    return questions;
  } catch {
    const fallback = await getQuestionsFromDB(TEST_QUESTION_COUNT, lang);
    if (fallback.length >= TEST_QUESTION_COUNT) {
      return normalizeQuestions(fallback, lang);
    }
    throw new Error(`Aucune question disponible en ${lang} (ni IA ni base de données)`);
  }
}
