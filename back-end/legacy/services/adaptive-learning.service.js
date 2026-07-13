// adaptive-learning.service.js
import { getQuestionById } from './question.service.js';

/**
 * Analyse les résultats du test et identifie les thèmes à renforcer
 */
export async function analyzeTestResults(testResults, questionMapping) {
  // Grouper les réponses par thème
  const themeResults = {};
  
  for (const result of testResults) {
    const mapping = questionMapping.find(q => q.id === result.questionId);
    
    if (!mapping) {
      console.warn(`⚠️ Aucun mapping pour la question ${result.questionId}`);
      continue;
    }
    
    const theme = mapping.theme;
    const language = mapping.language;
    const key = `${language}-${theme}`;
    
    if (!themeResults[key]) {
      themeResults[key] = {
        language,
        theme,
        totalQuestions: 0,
        correctAnswers: 0,
        scores: []
      };
    }
    
    themeResults[key].totalQuestions++;
    if (result.isCorrect) {
      themeResults[key].correctAnswers++;
    }
    themeResults[key].scores.push(result.score || 0);
  }
  
  // Calculer le taux de réussite par thème
  const analysis = {};
  const weakThemes = [];
  
  for (const [key, data] of Object.entries(themeResults)) {
    const successRate = data.totalQuestions > 0 
      ? (data.correctAnswers / data.totalQuestions) * 100 
      : 0;
    
    const averageScore = data.scores.length > 0
      ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      : 0;
    
    analysis[key] = {
      ...data,
      successRate,
      averageScore,
      mastered: successRate >= 70,
      needsReview: successRate < 70 && successRate >= 40,
      needsIntensiveReview: successRate < 40
    };
    
    if (successRate < 70) {
      weakThemes.push({
        theme: data.theme,
        language: data.language,
        successRate,
        averageScore
      });
    }
  }
  
  // Trier par ordre de priorité (du plus faible au plus fort)
  weakThemes.sort((a, b) => a.successRate - b.successRate);
  
  return {
    analysis,
    weakThemes,
    summary: {
      totalThemes: Object.keys(analysis).length,
      masteredThemes: Object.values(analysis).filter(a => a.mastered).length,
      weakThemesList: weakThemes.map(w => w.theme)
    }
  };
}

/**
 * Génère des recommandations personnalisées
 */
export function generateRecommendations(weakThemes) {
  if (weakThemes.length === 0) {
    return [
      "🎉 Félicitations ! Tu maîtrises tous les thèmes du test.",
      "📈 Tu peux passer au niveau supérieur.",
      "🚀 N'hésite pas à t'entraîner avec des exercices plus avancés."
    ];
  }
  
  const recommendations = [];
  const highPriority = weakThemes.filter(w => w.successRate < 40);
  const mediumPriority = weakThemes.filter(w => w.successRate >= 40 && w.successRate < 70);
  
  if (highPriority.length > 0) {
    recommendations.push(
      `🔴 Priorité absolue : Revois les bases de ${highPriority.map(w => w.theme).join(', ')}.`
    );
  }
  
  if (mediumPriority.length > 0) {
    recommendations.push(
      `🟡 À renforcer : Consulte les chapitres sur ${mediumPriority.map(w => w.theme).join(', ')}.`
    );
  }
  
  recommendations.push(
    "📖 Chaque chapitre contient des exercices pratiques pour consolider tes connaissances.",
    "💡 N'hésite pas à refaire le test après avoir étudié les chapitres recommandés."
  );
  
  return recommendations;
}