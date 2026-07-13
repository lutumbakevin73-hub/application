// services/evaluator.service.js
import { llmService } from './llm.service.js';
import { buildEvaluationPrompt } from '../agents/prompts.js';

/**
 * Évalue la réponse d'un étudiant
 */
export async function evaluateAnswer(question, userAnswer) {
  const { type, language, question: questionText, correctAnswer } = question;

  // Si c'est un QCM → comparaison simple
  if (type === 'qcm') {
    return evaluateQCM(question, userAnswer);
  }

  // Si c'est une question pratique → appel à l'IA
  if (type === 'pratique') {
    return evaluatePractical(question, userAnswer);
  }

  // Fallback
  return {
    score: 0,
    isCorrect: false,
    feedback: "Type de question non reconnu",
    criteria: { exactitude: 0, completude: 0, clarte: 0, approche: 0 },
    strengths: [],
    improvements: ["Contacter le support"]
  };
}

/**
 * Évaluation d'un QCM
 */
function evaluateQCM(question, userAnswer) {
  // Nettoyer les réponses
  const clean = (str) => String(str).trim().toUpperCase();
  const isCorrect = clean(question.correctAnswer) === clean(userAnswer);

  return {
    score: isCorrect ? 10 : 0,
    isCorrect,
    feedback: isCorrect 
      ? "✅ Bonne réponse !" 
      : "❌ Mauvaise réponse. Réessaie en relisant le cours.",
    criteria: {
      exactitude: isCorrect ? 10 : 0,
      completude: isCorrect ? 10 : 0,
      clarte: isCorrect ? 10 : 0,
      approche: isCorrect ? 10 : 0
    },
    strengths: isCorrect ? ["Bonne compréhension du concept"] : [],
    improvements: isCorrect ? [] : ["Revoir les bases du concept"],
    suggestedSolution: question.correctAnswer
  };
}

/**
 * Évaluation d'une question pratique (avec IA)
 */
async function evaluatePractical(question, userAnswer) {
  // Réponse vide ou trop courte
  if (!userAnswer || userAnswer.trim().length < 5) {
    return {
      score: 0,
      isCorrect: false,
      feedback: "Réponse trop courte. Essaie de développer davantage.",
      criteria: { exactitude: 0, completude: 0, clarte: 0, approche: 0 },
      strengths: [],
      improvements: ["Fournir une réponse plus détaillée"],
      suggestedSolution: question.correctAnswer || "Consulte la correction"
    };
  }

  try {
    const prompt = buildEvaluationPrompt({
      language: question.language || 'Python',
      question: question.question,
      correctAnswer: question.correctAnswer,
      userAnswer,
      type: question.type
    });

    // Si pas de prompt (QCM), utiliser fallback
    if (!prompt) {
      return evaluateQCM(question, userAnswer);
    }

    // Appel à l'IA
    const result = await llmService.generateJson(prompt);
    
    // Normaliser le résultat
    return {
      score: Math.min(Math.max(result.score || 0, 0), 10),
      isCorrect: result.isCorrect ?? result.score >= 6,
      feedback: result.feedback || "Évaluation terminée.",
      criteria: result.criteria || { exactitude: 0, completude: 0, clarte: 0, approche: 0 },
      strengths: result.strengths || [],
      improvements: result.improvements || [],
      suggestedSolution: result.suggestedSolution || question.correctAnswer
    };

  } catch (error) {
    console.error('❌ Erreur évaluation IA:', error.message);
    // Fallback : comparaison basique
    return fallbackEvaluation(question, userAnswer);
  }
}

/**
 * Fallback : comparaison basique (sans IA)
 */
function fallbackEvaluation(question, userAnswer) {
  const clean = (str) => {
    if (!str) return '';
    return str.replace(/\s+/g, ' ').trim().toLowerCase();
  };

  const expected = clean(question.correctAnswer);
  const actual = clean(userAnswer);

  // Correspondance exacte après nettoyage
  if (expected === actual) {
    return {
      score: 10,
      isCorrect: true,
      feedback: "✅ Réponse correcte !",
      criteria: { exactitude: 10, completude: 10, clarte: 10, approche: 10 },
      strengths: ["Réponse parfaitement conforme"],
      improvements: [],
      suggestedSolution: question.correctAnswer
    };
  }

  // Similarité partielle
  const expectedWords = expected.split(' ').filter(w => w.length > 2);
  const actualWords = actual.split(' ').filter(w => w.length > 2);
  
  if (expectedWords.length > 0 && actualWords.length > 0) {
    const common = expectedWords.filter(w => actualWords.includes(w));
    const ratio = common.length / Math.max(expectedWords.length, actualWords.length);
    
    if (ratio > 0.5) {
      const score = Math.min(Math.round(ratio * 10), 8);
      return {
        score,
        isCorrect: score >= 6,
        feedback: score >= 6 ? "✅ Réponse partiellement correcte." : "⚠️ Réponse incomplète.",
        criteria: { 
          exactitude: score, 
          completude: Math.round(score * 0.8), 
          clarte: Math.round(score * 0.7), 
          approche: Math.round(score * 0.6) 
        },
        strengths: ["Quelques éléments clés sont présents"],
        improvements: ["Compléter la réponse", "Ajouter plus de détails"],
        suggestedSolution: question.correctAnswer
      };
    }
  }

  return {
    score: 0,
    isCorrect: false,
    feedback: "❌ Réponse incorrecte. Réessaie en te basant sur la correction.",
    criteria: { exactitude: 0, completude: 0, clarte: 0, approche: 0 },
    strengths: [],
    improvements: ["Revoir les bases du concept"],
    suggestedSolution: question.correctAnswer
  };
}