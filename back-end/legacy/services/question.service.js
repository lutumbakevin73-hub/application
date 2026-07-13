// question.service.js
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
  console.log(`✅ ${questions.length} questions sauvegardées`);
}

// 🔹 Récupérer questions (fallback)
export async function getQuestionsFromDB(limit = 10) {
  const rows = await pool.query(
    "SELECT * FROM questions ORDER BY RANDOM() LIMIT ?", // SQLite utilise RANDOM() au lieu de RAND()
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

// 🔹 Récupérer une question par son ID
export async function getQuestionById(id) {
  const rows = await pool.query(
    "SELECT * FROM questions WHERE id = ?",
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const q = rows[0];
  return {
    id: q.id,
    type: q.type,
    language: q.language,
    theme: q.theme,
    question: q.question,
    options: q.options ? JSON.parse(q.options) : null,
    correctAnswer: q.correctAnswer
  };
}

// 🔹 Sauvegarder un résultat d'évaluation
export async function saveEvaluationResult(data) {
  const query = `
    INSERT INTO evaluations (
      question_id, 
      user_answer, 
      score, 
      is_correct, 
      feedback,
      criteria,
      strengths,
      improvements,
      suggested_solution,
      pedagogic_message,
      tips,
      next_step,
      encouragement,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.questionId,
    data.userAnswer,
    data.evaluation.score || 0,
    data.evaluation.isCorrect ? 1 : 0, // SQLite utilise 0/1 pour BOOLEAN
    data.evaluation.feedback || null,
    data.evaluation.criteria ? JSON.stringify(data.evaluation.criteria) : null,
    data.evaluation.strengths ? JSON.stringify(data.evaluation.strengths) : null,
    data.evaluation.improvements ? JSON.stringify(data.evaluation.improvements) : null,
    data.evaluation.suggestedSolution || null,
    data.evaluation.pedagogicMessage || null,
    data.evaluation.tips ? JSON.stringify(data.evaluation.tips) : null,
    data.evaluation.nextStep || null,
    data.evaluation.encouragement || null,
    data.timestamp || new Date().toISOString()
  ];

  await pool.query(query, values);
  console.log(`✅ Évaluation sauvegardée pour la question ${data.questionId}`);
}

// 🔹 Récupérer l'historique des évaluations pour une question
export async function getEvaluationHistory(questionId, limit = 20) {
  const rows = await pool.query(
    `SELECT 
      id,
      question_id,
      user_answer,
      score,
      is_correct,
      feedback,
      criteria,
      strengths,
      improvements,
      suggested_solution,
      pedagogic_message,
      tips,
      next_step,
      encouragement,
      created_at
    FROM evaluations 
    WHERE question_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?`,
    [questionId, limit]
  );

  return rows.map(row => ({
    id: row.id,
    questionId: row.question_id,
    userAnswer: row.user_answer,
    score: row.score,
    isCorrect: row.is_correct === 1, // SQLite retourne 1 ou 0
    feedback: row.feedback,
    criteria: row.criteria ? JSON.parse(row.criteria) : null,
    strengths: row.strengths ? JSON.parse(row.strengths) : null,
    improvements: row.improvements ? JSON.parse(row.improvements) : null,
    suggestedSolution: row.suggested_solution,
    pedagogicMessage: row.pedagogic_message,
    tips: row.tips ? JSON.parse(row.tips) : null,
    nextStep: row.next_step,
    encouragement: row.encouragement,
    createdAt: row.created_at
  }));
}

// 🔹 Récupérer les statistiques d'un utilisateur (si tu as un système d'utilisateur)
export async function getUserStats(userId) {
  const rows = await pool.query(
    `SELECT 
      COUNT(*) as total_answers,
      AVG(score) as average_score,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
      SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as wrong_answers
    FROM evaluations 
    WHERE user_id = ?`,
    [userId]
  );

  return rows[0] || {
    total_answers: 0,
    average_score: 0,
    correct_answers: 0,
    wrong_answers: 0
  };
}

// 🔹 Récupérer les questions par type
export async function getQuestionsByType(type, limit = 10) {
  const rows = await pool.query(
    "SELECT * FROM questions WHERE type = ? ORDER BY RANDOM() LIMIT ?",
    [type, limit]
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

// 🔹 Récupérer les questions par thème
export async function getQuestionsByTheme(theme, limit = 10) {
  const rows = await pool.query(
    "SELECT * FROM questions WHERE theme = ? ORDER BY RANDOM() LIMIT ?",
    [theme, limit]
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

// 🔹 Supprimer toutes les questions (utile pour régénérer)
export async function deleteAllQuestions() {
  await pool.query("DELETE FROM questions");
  console.log("🗑️ Toutes les questions ont été supprimées");
}

// 🔹 Supprimer les évaluations d'une question
export async function deleteEvaluationsByQuestion(questionId) {
  await pool.query(
    "DELETE FROM evaluations WHERE question_id = ?",
    [questionId]
  );
  console.log(`🗑️ Évaluations supprimées pour la question ${questionId}`);
}

// 🔹 Réinitialiser la base de données (supprime tout et recrée)
export async function resetDatabase() {
  await pool.query("DELETE FROM evaluations");
  await pool.query("DELETE FROM user_progress");
  await pool.query("DELETE FROM questions");
  await pool.query("DELETE FROM sqlite_sequence"); // Réinitialise les auto-increments
  console.log("🗑️ Base de données réinitialisée");
}

// 🔹 Vérifier si la base de données est vide
export async function isDatabaseEmpty() {
  const rows = await pool.query("SELECT COUNT(*) as count FROM questions");
  return rows[0].count === 0;
}