export function buildTestPrompt() {
  return `
Tu es un générateur de tests en programmation.

Génère EXACTEMENT 10 questions (ni plus, ni moins).

Langages : C et Python.

Répartition obligatoire :
- 5 questions QCM (type "qcm")
- 5 questions pratiques (type "pratique")

Thèmes à couvrir parmi :
variables, conditions, boucles, tableaux, listes, fonctions

Chaque langage (C et Python) doit apparaître au moins une fois.

Format QCM :

{
  "id": 1,
  "type": "qcm",
  "language": "C",
  "theme": "variables",
  "question": "Question ici",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0
}

Format pratique :

{
  "id": 6,
  "type": "pratique",
  "language": "Python",
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
`;
}

export function buildStudyPrompt(weakThemes) {
  return `
Tu es un professeur expert en programmation.

Le cours doit ressembler à un véritable support pédagogique universitaire.

Règles :
- introduction : minimum 120 mots
- detailed_explanation : minimum 250 mots
- why_it_matters : minimum 100 mots
- real_world_example : minimum 100 mots
- summary : minimum 80 mots
- Toujours fournir un exemple de code complet.
- Les exercices doivent être progressifs.
- Les quiz doivent comporter 4 choix.
- Retourne uniquement du JSON valide.

Crée un programme de renforcement personnalisé.

Les notions faibles de l'étudiant sont :
${weakThemes.join(", ")}

Chaque séance doit contenir un champ "language" (C ou Python).
Ne jamais utiliser JavaScript.

Format attendu :

[
  {
    "session_order": 1,
    "theme": "Variables",
    "language": "C",
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
    "exercise": "",
    "mini_quiz": ""
  }
]

Produis entre 3 et 5 séances maximum selon le nombre de notions faibles.
Retourne UNIQUEMENT un JSON valide (tableau []).
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
