// course-generator.service.js
import { llmClient } from '../legacy/server/agent/llmClient.js';
import { buildCoursePrompt } from '../legacy/server/agent/prompts.js';

/**
 * Génère un cours personnalisé basé sur les thèmes faibles
 */
export async function generatePersonalizedCourse(language, weakThemes, studentLevel = 'débutant') {
  if (!weakThemes || weakThemes.length === 0) {
    return {
      title: "🎉 Félicitations !",
      content: "Tu maîtrises tous les thèmes évalués. Continue comme ça !",
      recommendations: ["Passe au niveau supérieur", "Entraîne-toi avec des exercices avancés"]
    };
  }

  try {
    console.log(`🔹 Génération d'un cours personnalisé pour : ${weakThemes.join(', ')}`);
    
    const prompt = buildCoursePrompt(language, weakThemes, studentLevel);
    
    const response = await llmClient.chatCompletion({
      messages: [
        { 
          role: "system", 
          content: `Tu es un professeur de programmation expert et pédagogue. 
          Tu génères des cours clairs, structurés et adaptés au niveau de l'étudiant.
          Utilise du Markdown pour la mise en forme.
          Inclus des exemples concrets et des exercices pratiques.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    let content = response;
    content = content.replace(/```markdown/g, "").replace(/```/g, "").trim();

    // Extraire le titre
    const lines = content.split('\n');
    const title = lines.find(line => line.startsWith('# '))?.replace('# ', '') || 'Cours personnalisé';
    
    // Extraire les exercices
    const exerciseRegex = /### Exercice \d+ : .+?(?=###|$)/gs;
    const exercises = content.match(exerciseRegex) || [];

    return {
      title,
      content,
      exercises: exercises.map(ex => ex.trim()),
      weakThemes,
      language,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erreur génération cours:', error);
    throw new Error(`Impossible de générer le cours: ${error.message}`);
  }
}

/**
 * Génère des exercices pratiques sur un thème
 */
export async function generateExercises(language, theme, count = 3) {
  try {
    const prompt = `
Génère ${count} exercices pratiques sur le thème "${theme}" en langage ${language}.

Pour chaque exercice, fournis :
- L'énoncé
- La solution attendue
- Des indices (optionnels)

Format JSON :
[
  {
    "title": "Titre de l'exercice",
    "description": "Description détaillée",
    "hints": ["Indice 1", "Indice 2"],
    "solution": "Solution complète"
  }
]
`;

    const response = await llmClient.chatCompletion({
      messages: [
        { role: "system", content: "Tu es un générateur d'exercices de programmation." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    let text = response;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);

  } catch (error) {
    console.error('❌ Erreur génération exercices:', error);
    return [];
  }
}