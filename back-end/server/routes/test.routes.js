import express from "express";
import Groq from "groq-sdk";
import { generateTestQuestions } from "../agent/pedagogyAgent.js";
console.log("===== TEST.ROUTES.JS CHARGÉ =====");
const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// =====================
// START TEST (MANQUAIT)
// =====================
router.post("/start", async (req, res) => {
  try {

    const questions = await generateTestQuestions();

    console.log("QUESTIONS Generee", questions);

    res.json({
      success: true,
      questions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur start test" });
  }
});


// =====================
// CORRECT CODE
// =====================
router.post("/correct-code", async (req, res) => {
  try {
    const {
      language,
      question,
      correctAnswer,
      userAnswer
    } = req.body;

    const prompt = `
Tu es un professeur expert en programmation.

Corrige la réponse d'un étudiant.

IMPORTANT :
Tu dois répondre UNIQUEMENT avec un JSON valide.
Aucune explication.
Aucun texte hors JSON.

Tu dois respecter EXACTEMENT ce format :

{
  "correct": true,
  "score": 0,
  "feedback": "",
  "mistakes": [],
  "correct_code": ""
}

Règles importantes :
- Si le code est logiquement correct mais différent → correct = true
- Ne compare pas le texte, analyse la logique
- score entre 0 et 100
- mistakes = liste des erreurs si présentes
- correct_code = version améliorée si nécessaire

Langage :
${language}

Question :
${question}

Réponse attendue :
${correctAnswer}

Réponse de l'étudiant :
${userAnswer}
Retourne uniquement un JSON valide.
`;
  
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    let text = completion.choices[0].message.content;

text = text
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();
let parsed;

try {
  parsed = JSON.parse(text);
} catch (e) {
  console.error("JSON invalide:", text);
  return res.status(500).json({ error: "JSON IA invalide" });
}

return res.json(parsed);

} catch (err) {
  console.error(err);
  return res.status(500).json({
    error: "Erreur de correction IA"
  });
}

});

export default router;
