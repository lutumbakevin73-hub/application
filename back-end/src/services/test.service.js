import { getDb } from "../config/database.js";
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

export async function getQuestionsFromDB(limit = 10) {
  const db = getDb();
  const randomFn = db.client.config.client === "mysql2" ? "RAND()" : "RANDOM()";
  const rows = await db("questions").orderByRaw(randomFn).limit(limit);

  return rows.map((q) => ({
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
  }));
}

const TEST_QUESTION_COUNT = 10;

function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions.slice(0, TEST_QUESTION_COUNT).map((q, index) => ({
    ...q,
    id: index + 1
  }));
}

export async function startTest() {
  try {
    const questions = normalizeQuestions(await generateTestQuestions());
    if (questions.length < TEST_QUESTION_COUNT) {
      throw new Error("Nombre de questions insuffisant");
    }
    await saveQuestions(questions);
    return questions;
  } catch {
    const fallback = await getQuestionsFromDB(TEST_QUESTION_COUNT);
    if (fallback.length >= TEST_QUESTION_COUNT) {
      return normalizeQuestions(fallback);
    }
    throw new Error("Aucune question disponible (ni IA ni base de données)");
  }
}
