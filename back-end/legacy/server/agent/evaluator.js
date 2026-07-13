// evaluator.js
import Groq from "groq-sdk";
import { buildEvaluationPrompt } from "./prompts.js";

const GROQ_KEY = process.env.GROQ_API_KEY;
let groq = null;

if (GROQ_KEY) {
  groq = new Groq({ apiKey: GROQ_KEY });
  console.log("✅ Groq initialisé pour l'évaluation");
} else {
  console.warn("⚠️ Pas de clé Groq, évaluation basique uniquement");
}

/**
 * Nettoie une réponse pour comparaison (ignore espaces, majuscules, etc.)
 */
function cleanAnswer(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')           // Espaces unifiés
    .replace(/[;{}()\[\]]/g, '')    // Enlève caractères spéciaux
    .trim()
    .toLowerCase();
}

/**
 * Vérifie si deux réponses sont équivalentes (tolérance)
 */
function areAnswersEquivalent(expected, actual) {
  const cleanExpected = cleanAnswer(expected);
  const cleanActual = cleanAnswer(actual);
  
  // 1. Correspondance exacte après nettoyage
  if (cleanExpected === cleanActual) return true;
  
  // 2. L'une contient l'autre (tolérance)
  if (cleanExpected.includes(cleanActual) || cleanActual.includes(cleanExpected)) {
    return true;
  }
  
  // 3. Mots clés communs (pour les réponses longues)
  const expectedWords = cleanExpected.split(' ').filter(w => w.length > 2);
  const actualWords = cleanActual.split(' ').filter(w => w.length > 2);
  
  if (expectedWords.length === 0 || actualWords.length === 0) return false;
  
  const commonWords = expectedWords.filter(word => actualWords.includes(word));
  const ratio = commonWords.length / Math.max(expectedWords.length, actualWords.length);
  
  // Si plus de 60% des mots correspondent, on considère équivalent
  return ratio > 0.6;
}

/**
 * Évalue une réponse pratique avec IA + fallback intelligent
 */
export async function evaluatePracticalAnswer(question, userAnswer, language) {
  // Cas 1 : Pas d'IA disponible → fallback amélioré
  if (!groq) {
    console.log("🔹 Utilisation du fallback (pas d'IA)");
    return fallbackEvaluation(question, userAnswer);
  }

  // Cas 2 : Réponse vide ou trop courte
  if (!userAnswer || userAnswer.trim().length < 3) {
    return {
      score: 0,
      isCorrect: false,
      feedback: "Réponse trop courte. Essaie de développer davantage ta solution.",
      criteria: {
        exactitude: 0,
        completude: 0,
        clarte: 0,
        approche: 0
      },
      strengths: [],
      improvements: ["Fournir une réponse plus détaillée"],
      suggestedSolution: question.correctAnswer || "Consulte la correction pour t'inspirer."
    };
  }

  try {
    console.log("🔹 Évaluation par IA en cours...");
    
    const prompt = buildEvaluationPrompt(question, userAnswer, language);
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: `Tu es un expert en programmation bienveillant. 
          
RÈGLES IMPORTANTES :
- Sois TOLÉRANT : accepte les variantes syntaxiques (espaces, noms de variables différents)
- Une réponse est CORRECTE si elle atteint l'objectif, même avec une approche différente
- Ne pénalise pas les différences mineures (ex: 'result' au lieu de 'res')
- Si la réponse est partiellement correcte, donne un score entre 5 et 7
- Encourage l'étudiant, même si ce n'est pas parfait

Retourne toujours du JSON valide.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4, // Augmenté pour plus de flexibilité
      max_tokens: 800
    });

    let text = completion.choices[0].message.content;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Erreur parsing JSON:", parseError.message);
      return fallbackEvaluation(question, userAnswer);
    }

    // Validation des champs
    if (!result.score && result.score !== 0) {
      result.score = calculateAverageScore(result.criteria);
    }

    // Normalisation du score (0-10)
    result.score = Math.min(Math.max(parseFloat(result.score) || 0, 0), 10);
    
    // 🔥 AMÉLIORATION : Seuil de correction abaissé à 5/10 (au lieu de 6)
    result.isCorrect = result.score >= 5;
    
    // Si le score est entre 4 et 6, on vérifie si c'est équivalent
    if (result.score >= 4 && result.score < 6) {
      // Vérification de similarité avec la réponse attendue
      const isEquivalent = areAnswersEquivalent(
        question.correctAnswer || '',
        userAnswer
      );
      
      if (isEquivalent) {
        result.score = Math.max(result.score, 6);
        result.isCorrect = true;
        result.feedback = "✅ Ta réponse est correcte ! L'IA a été un peu sévère, mais le fond est bon. Continue comme ça !";
      }
    }

    // Ajout des métadonnées
    result.questionId = question.id;
    result.language = language;
    result.evaluatedAt = new Date().toISOString();

    console.log(`✅ Évaluation terminée : ${result.score}/10`);
    return result;

  } catch (err) {
    console.error("❌ Erreur évaluation IA:", err.message);
    return fallbackEvaluation(question, userAnswer);
  }
}

/**
 * Calcule un score moyen à partir des critères
 */
function calculateAverageScore(criteria) {
  if (!criteria) return 5;
  const scores = [
    criteria.exactitude || 0,
    criteria.completude || 0,
    criteria.clarte || 0,
    criteria.approche || 0
  ];
  const validScores = scores.filter(s => s > 0);
  if (validScores.length === 0) return 5;
  return validScores.reduce((a, b) => a + b, 0) / validScores.length;
}

/**
 * Évaluation basique améliorée avec comparaison intelligente
 */
function fallbackEvaluation(question, userAnswer) {
  const clean = (str) => {
    if (!str) return '';
    return str
      .replace(/\s+/g, ' ')
      .replace(/[;{}()\[\]]/g, '')
      .trim()
      .toLowerCase();
  };

  const expected = clean(question.correctAnswer || '');
  const actual = clean(userAnswer);

  // Vérification de la longueur
  if (actual.length < 5) {
    return {
      score: 0,
      isCorrect: false,
      feedback: "Réponse trop courte. Développe davantage ta solution.",
      criteria: {
        exactitude: 0,
        completude: 0,
        clarte: 0,
        approche: 0
      },
      strengths: [],
      improvements: ["Développer la réponse", "Ajouter des explications"],
      suggestedSolution: question.correctAnswer || "Voir la correction"
    };
  }

  // Vérification d'équivalence
  const isEquivalent = areAnswersEquivalent(question.correctAnswer || '', userAnswer);
  
  if (isEquivalent) {
    return {
      score: 8,
      isCorrect: true,
      feedback: "✅ Réponse correcte ! Le raisonnement est bon.",
      criteria: {
        exactitude: 8,
        completude: 7,
        clarte: 8,
        approche: 7
      },
      strengths: ["Bonne compréhension du concept", "Réponse pertinente"],
      improvements: ["Peaufiner la syntaxe si nécessaire"],
      suggestedSolution: question.correctAnswer || "Continue comme ça !"
    };
  }

  // Similarité partielle
  const expectedWords = expected.split(' ').filter(w => w.length > 2);
  const actualWords = actual.split(' ').filter(w => w.length > 2);
  
  if (expectedWords.length > 0 && actualWords.length > 0) {
    const commonWords = expectedWords.filter(word => actualWords.includes(word));
    const ratio = commonWords.length / Math.max(expectedWords.length, actualWords.length);
    
    if (ratio > 0.4) {
      const score = Math.min(Math.round(ratio * 10), 8);
      return {
        score: score,
        isCorrect: score >= 5,
        feedback: score >= 5 
          ? "✅ Réponse partiellement correcte. Quelques détails à améliorer."
          : "⚠️ Réponse incomplète. Revois certains concepts.",
        criteria: {
          exactitude: score,
          completude: Math.min(Math.round(score * 0.8), 10),
          clarte: Math.min(Math.round(score * 0.7), 10),
          approche: Math.min(Math.round(score * 0.6), 10)
        },
        strengths: commonWords.length > 0 ? ["Quelques éléments clés sont présents"] : [],
        improvements: ["Compléter la réponse", "Ajouter plus de détails"],
        suggestedSolution: question.correctAnswer || "Consulte le cours"
      };
    }
  }

  // Réponse incorrecte
  return {
    score: 0,
    isCorrect: false,
    feedback: "❌ Réponse incorrecte ou hors sujet. Réessaie en te basant sur la correction.",
    criteria: {
      exactitude: 0,
      completude: 0,
      clarte: 0,
      approche: 0
    },
    strengths: [],
    improvements: ["Revoir les bases du concept", "Pratiquer avec des exercices similaires"],
    suggestedSolution: question.correctAnswer || "Consulte le cours"
  };
}

/**
 * Évaluation adaptative selon le type de question
 */
export async function evaluateAnswer(question, userAnswer, language = "Python") {
  // Si c'est un QCM
  if (question.type === 'qcm') {
    // Pour QCM, on accepte aussi les réponses sous forme de texte (A, B, C, D ou 1, 2, 3, 4)
    let userChoice = userAnswer;
    if (typeof userAnswer === 'string') {
      userChoice = userAnswer.trim().toUpperCase();
      // Si c'est une lettre, on la convertit en index
      if (['A', 'B', 'C', 'D'].includes(userChoice)) {
        userChoice = userChoice.charCodeAt(0) - 65; // A=0, B=1, etc.
      }
    }
    
    const isCorrect = String(question.correctAnswer) === String(userChoice);
    return {
      score: isCorrect ? 10 : 0,
      isCorrect: isCorrect,
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

  // Si c'est une question pratique
  if (question.type === 'pratique') {
    return await evaluatePracticalAnswer(question, userAnswer, language);
  }

  // Fallback générique
  return {
    score: 0,
    isCorrect: false,
    feedback: "Type de question non reconnu",
    criteria: {
      exactitude: 0,
      completude: 0,
      clarte: 0,
      approche: 0
    },
    strengths: [],
    improvements: ["Contacter le support"],
    suggestedSolution: "Question invalide"
  };
}