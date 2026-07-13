// pedagogyAgent.js - Ajout de la vérification d'équivalence

import Groq from "groq-sdk";
import { buildTestPrompt, buildFeedbackPrompt } from "./prompts.js";
import { saveQuestions, getQuestionsFromDB, getQuestionById } from "../../back-end/services/question.service.js";
import { evaluateAnswer } from "./evaluator.js";

const GROQ_KEY = process.env.GROQ_API_KEY;
let groq = null;

if (GROQ_KEY) {
  groq = new Groq({ apiKey: GROQ_KEY });
  console.log("✅ Groq initialisé pour la pédagogie");
} else {
  console.warn("⚠️ Pas de clé Groq, mode dégradé");
}

/**
 * Génère des questions de test
 */
export async function generateTestQuestions() {
  const prompt = buildTestPrompt();

  if (groq) {
    try {
      console.log("🔹 Génération des questions par IA...");
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      let text = completion.choices[0].message.content;
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const questions = JSON.parse(text);
      await saveQuestions(questions);

      console.log(`✅ ${questions.length} questions générées et sauvegardées`);
      return questions;

    } catch (err) {
      console.error("❌ Erreur LLM → fallback DB:", err.message);
    }
  }

  const fallback = await getQuestionsFromDB(10);
  if (fallback.length > 0) {
    console.log(`📚 ${fallback.length} questions chargées depuis DB`);
    return fallback;
  }

  throw new Error("❌ Aucune question disponible (ni IA ni DB)");
}

/**
 * Évalue la réponse d'un utilisateur
 */
export async function evaluateUserAnswer(question, userAnswer, language = "Python") {
  console.log(`🔹 Évaluation de la réponse pour la question ${question.id}...`);
  
  if (!question) {
    throw new Error("Question manquante");
  }
  
  if (!userAnswer || userAnswer.trim().length === 0) {
    return {
      score: 0,
      isCorrect: false,
      feedback: "Tu n'as pas fourni de réponse. Essaie de répondre à la question !",
      criteria: {
        exactitude: 0,
        completude: 0,
        clarte: 0,
        approche: 0
      },
      strengths: [],
      improvements: ["Commencer par formuler une réponse"],
      suggestedSolution: question.correctAnswer || "Relis le cours pour trouver la solution"
    };
  }

  const evaluation = await evaluateAnswer(question, userAnswer, language);
  
  // Ajout de feedback pédagogique si nécessaire
  if (groq && evaluation.score < 7) {
    try {
      const feedbackPrompt = buildFeedbackPrompt(question, userAnswer, evaluation, language);
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "Tu es un tuteur pédagogique bienveillant et constructif." 
          },
          { role: "user", content: feedbackPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      let text = completion.choices[0].message.content;
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      try {
        const pedagogicFeedback = JSON.parse(text);
        evaluation.pedagogicMessage = pedagogicFeedback.message;
        evaluation.tips = pedagogicFeedback.tips;
        evaluation.nextStep = pedagogicFeedback.nextStep;
        evaluation.encouragement = pedagogicFeedback.encouragement;
      } catch (parseError) {
        console.warn("⚠️ Impossible de parser le feedback pédagogique");
      }
    } catch (err) {
      console.warn("⚠️ Erreur génération feedback pédagogique:", err.message);
    }
  }

  // Messages par défaut
  if (!evaluation.pedagogicMessage) {
    if (evaluation.score >= 7) {
      evaluation.pedagogicMessage = "Excellent travail ! Continue comme ça 💪";
    } else if (evaluation.score >= 5) {
      evaluation.pedagogicMessage = "Bon début ! Avec un peu de pratique, tu vas t'améliorer 📈";
    } else {
      evaluation.pedagogicMessage = "Ne te décourage pas ! Chaque erreur est une opportunité d'apprendre 🌱";
    }
    evaluation.tips = ["Relire le cours", "Pratiquer régulièrement"];
    evaluation.nextStep = "Essaie de refaire l'exercice en corrigeant les erreurs";
    evaluation.encouragement = "Tu vas y arriver ! 🚀";
  }

  return evaluation;
}