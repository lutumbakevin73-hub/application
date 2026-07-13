// services/analysis.service.js

/**
 * Analyse les résultats du test et identifie les thèmes faibles
 */
export function analyzeTestResults(results) {
  // Grouper par thème
  const themeScores = {};
  
  for (const result of results) {
    const theme = result.theme || 'general';
    if (!themeScores[theme]) {
      themeScores[theme] = { total: 0, correct: 0, scores: [] };
    }
    themeScores[theme].total++;
    if (result.isCorrect) themeScores[theme].correct++;
    themeScores[theme].scores.push(result.score || 0);
  }

  // Calculer les stats par thème
  const analysis = {};
  const weakThemes = [];

  for (const [theme, data] of Object.entries(themeScores)) {
    const successRate = (data.correct / data.total) * 100;
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    
    analysis[theme] = {
      theme,
      totalQuestions: data.total,
      correctAnswers: data.correct,
      successRate: Math.round(successRate),
      averageScore: Math.round(avgScore * 10) / 10,
      mastered: successRate >= 70,
      needsReview: successRate < 70 && successRate >= 40,
      needsIntensiveReview: successRate < 40
    };

    if (successRate < 70) {
      weakThemes.push({
        theme,
        successRate: Math.round(successRate),
        averageScore: Math.round(avgScore * 10) / 10
      });
    }
  }

  // Trier par priorité (du plus faible au plus fort)
  weakThemes.sort((a, b) => a.successRate - b.successRate);

  return {
    analysis,
    weakThemes,
    summary: {
      totalThemes: Object.keys(analysis).length,
      masteredThemes: Object.values(analysis).filter(a => a.mastered).length,
      weakThemesList: weakThemes.map(w => w.theme),
      overallScore: Object.values(analysis).length > 0
        ? Math.round(
            Object.values(analysis).reduce((sum, a) => sum + a.successRate, 0) / 
            Object.values(analysis).length
          )
        : 0
    }
  };
}

/**
 * Génère des recommandations personnalisées
 */
export function generateRecommendations(weakThemes, overallScore) {
  const recommendations = [];

  if (weakThemes.length === 0) {
    recommendations.push("🎉 Félicitations ! Tu maîtrises tous les thèmes du test.");
    recommendations.push("📈 Tu peux passer au niveau supérieur.");
    recommendations.push("🚀 N'hésite pas à t'entraîner avec des exercices plus avancés.");
    return recommendations;
  }

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

  if (overallScore < 50) {
    recommendations.push("📖 Reprends les bases depuis le début.");
  } else if (overallScore < 70) {
    recommendations.push("📖 Concentre-toi sur les thèmes identifiés comme faibles.");
  } else {
    recommendations.push("📖 Continue à t'entraîner pour consolider tes connaissances.");
  }

  recommendations.push("💡 Après avoir étudié, refais le test pour valider ta progression.");
  
  return recommendations;
}