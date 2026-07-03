export function buildStudyPrompt(weakThemes, sessionCount, language = "C") {
  const themes = weakThemes.join(", ");
  const lang = language === "Python" ? "Python" : "C";
  return `
Tu es un professeur expert en programmation ${lang}.

Le cours doit ressembler à un véritable support pédagogique universitaire.

Règles :
- introduction : minimum 120 mots
- detailed_explanation : minimum 250 mots
- why_it_matters : minimum 100 mots
- real_world_example : minimum 100 mots
- summary : minimum 80 mots
- Toujours fournir un exemple de code complet en ${lang}.
- Les exercices doivent être progressifs, détaillés et liés aux lacunes de l'étudiant.
- Chaque exercice est un objet structuré avec consignes, indices et code de départ en ${lang}.
- Chaque séance se termine par un mini_quiz de 3 questions (4 options chacune, 1 bonne réponse).
- Score de validation du quiz : 70% minimum (2 bonnes réponses sur 3).
- Le champ exercise.instructions : minimum 80 mots, avec énoncé clair et action concrète.
- Retourne uniquement du JSON valide.

Crée un programme de renforcement personnalisé UNIQUEMENT en ${lang}.

Les notions faibles de l'étudiant sont :
${themes}

Produis EXACTEMENT ${sessionCount} séances (ni plus, ni moins).
Répartis les notions faibles sur les ${sessionCount} séances : une séance peut approfondir une lacune ou combiner des notions proches.
Numérote session_order de 1 à ${sessionCount}.

Chaque séance doit avoir "language": "${lang}" (identique pour toutes les séances).
Ne jamais utiliser JavaScript ni l'autre langage (${lang === "C" ? "Python" : "C"}).

Format attendu :

[
  {
    "session_order": 1,
    "theme": "Variables",
    "language": "${lang}",
    "lesson": {
      "introduction": "",
      "why_it_matters": "",
      "learning_objectives": [],
      "definition": "",
      "detailed_explanation": "",
      "example_code": "",
      "example_output": "",
      "example_explanation": "",
      "step_by_step": [],
      "real_world_example": "",
      "common_mistakes": "",
      "summary": "",
      "difficulty": "Débutant",
      "estimated_duration": "20 minutes"
    },
    "exercise": {
      "title": "",
      "instructions": "",
      "hints": ["", ""],
      "starter_code": "",
      "expected_result": "",
      "solution_approach": ""
    },
    "mini_quiz": {
      "title": "Quiz de validation",
      "passing_score": 70,
      "questions": [
        {
          "question": "",
          "options": ["", "", "", ""],
          "answer": "",
          "explanation": ""
        }
      ]
    }
  }
]

Retourne UNIQUEMENT un JSON valide (tableau []).
`;
}

export function buildTestPrompt(language = "C") {
  const lang = language === "Python" ? "Python" : "C";
  return `
Tu es un générateur de tests en programmation.

Génère EXACTEMENT 10 questions (ni plus, ni moins).

Langage UNIQUE : ${lang} uniquement.

Répartition obligatoire :
- 5 questions QCM (type "qcm")
- 5 questions pratiques (type "pratique")

Thèmes à couvrir parmi :
variables, conditions, boucles, tableaux, listes, fonctions

Toutes les questions doivent être en ${lang}. N'utilise pas d'autre langage.

Format QCM :

{
  "id": 1,
  "type": "qcm",
  "language": "${lang}",
  "theme": "variables",
  "question": "Question ici",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0
}

Format pratique :

{
  "id": 6,
  "type": "pratique",
  "language": "${lang}",
  "theme": "boucles",
  "question": "Écris un programme...",
  "correctAnswer": "solution attendue"
}

IMPORTANT :
- Retourne uniquement du JSON valide
- Pas de markdown
- Pas de texte avant ou après le JSON
- Le JSON doit être un tableau []
- Les id vont de 1 à 10
- EXACTEMENT 10 questions
- language = "${lang}" pour chaque question
`;
}

export function buildCodeCorrectionPrompt({
  language,
  question,
  correctAnswer,
  userAnswer
}) {
  return `
Tu es un professeur expert en programmation.

Corrige la réponse d'un étudiant.

IMPORTANT :
Tu dois répondre UNIQUEMENT avec un JSON valide.

Format :

{
  "correct": true,
  "score": 0,
  "feedback": "",
  "mistakes": [],
  "correct_code": ""
}

Langage : ${language}
Question : ${question}
Réponse attendue : ${correctAnswer}
Réponse de l'étudiant : ${userAnswer}
`;
}
