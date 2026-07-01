import { pool } from "../db.js";


// 🔹 Sauvegarder questions
export async function saveQuestions(questions) {
  for (const q of questions) {
    await pool.query(
      `INSERT INTO questions (type, language, theme, question, options, correctAnswer)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        q.type,
        q.language,
        q.theme,
        q.question,
        q.options ? JSON.stringify(q.options) : null,
        q.correctAnswer
      ]
    );
  }
}

//  Récupérer questions (fallback)
export async function getQuestionsFromDB(limit = 10) {
  const [rows] = await pool.query(
    "SELECT * FROM questions ORDER BY RAND() LIMIT ?",
    [limit]
  );

  return rows.map(q => ({
    id: q.id,
    type: q.type,
    language: q.language,
    theme: q.theme,
    question: q.question,
    options: q.options ? JSON.parse(q.options) : null,
    correctAnswer: q.correctAnswer
  }));
}