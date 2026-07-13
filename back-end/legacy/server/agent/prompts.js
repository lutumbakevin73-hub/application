// prompts.js - Version améliorée avec tolérance

export function buildTestPrompt() {
  return `
Tu es un générateur de tests en programmation.

Génère EXACTEMENT 24 questions.

Les questions doivent être réparties entre :
- langage C
- langage Python

Le test doit contenir :

==================================
PARTIE 1 : QCM
==================================

Pour CHAQUE notion suivante :

- variables
- conditions
- boucles
- tableaux
- listes
- fonctions

Génère :
- 1 question en C
- 1 question en Python

Donc :
6 notions × 2 langages = 12 questions QCM

Format obligatoire :

{
  "id": 1,
  "type": "qcm",
  "language": "C",
  "theme": "variables",
  "question": "Question ici",
  "options": [
    "A",
    "B",
    "C",
    "D"
  ],
  "correctAnswer": 0
}

==================================
PARTIE 2 : IMPLEMENTATION
==================================

Génère ensuite 12 questions pratiques
basées sur :

- variables
- conditions
- boucles
- tableaux
- listes
- fonctions

Les exercices doivent être répartis
entre :
- C
- Python

Les exercices doivent demander :
- écriture de code
- affichage
- manipulation
- logique algorithmique

Format obligatoire :

{
  "id": 13,
  "type": "pratique",
  "language": "Python",
  "theme": "boucles",
  "question": "Écris un programme...",
  "correctAnswer": "solution attendue"
}

==================================
IMPORTANT
==================================

- Retourne uniquement du JSON valide
- Pas de markdown
- Pas de texte avant JSON
- Pas de texte après JSON
- Le JSON doit être un tableau []
- EXACTEMENT 24 questions

`;
}

/**
 * Prompt d'évaluation avec tolérance
 */
export function buildEvaluationPrompt(question, userAnswer, language) {
  return `
Tu es un évaluateur expert en programmation, BIENVEILLANT et TOLÉRANT.

Analyse la réponse suivante.

==================================
QUESTION POSÉE :
${question.question}

LANGAGE : ${language}

RÉPONSE ATTENDUE (référence, pas une vérité absolue) :
${question.correctAnswer || "Non spécifiée"}

RÉPONSE DE L'ÉTUDIANT :
${userAnswer}
==================================

🔴 RÈGLES D'ÉVALUATION (IMPORTANT) :

1. Une réponse est CORRECTE si elle atteint l'objectif principal.
2. ACCEPTE les variantes :
   - Noms de variables différents (ex: "result" au lieu de "res")
   - Espaces et sauts de ligne différents
   - Syntaxe légèrement différente (ex: for (i=0; i<n; i++) vs for i in range(n))
   - Approche alternative mais valide
3. Ne pénalise PAS les différences mineures.
4. Si la réponse est PARTIELLEMENT correcte, donne un score entre 5 et 7/10.
5. Si la réponse est globalement correcte, donne 8-10/10.
6. Sois ENCOURAGEANT dans le feedback.

==================================
CRITÈRES D'ÉVALUATION (note sur 10) :

1. EXACTITUDE (0-10) : La réponse est-elle globalement correcte ?
2. COMPLÉTUDE (0-10) : Les aspects essentiels sont-ils couverts ?
3. CLARTÉ (0-10) : La réponse est-elle compréhensible ?
4. APPROCHE (0-10) : La logique est-elle bonne ?

==================================
RETOURNE UN JSON STRICT :

{
  "score": 8,
  "isCorrect": true,
  "feedback": "👍 Bon travail ! Ta solution est correcte. Quelques petites améliorations possibles...",
  "criteria": {
    "exactitude": 9,
    "completude": 8,
    "clarte": 7,
    "approche": 8
  },
  "strengths": [
    "Bonne logique globale",
    "Syntaxe correcte"
  ],
  "improvements": [
    "Ajouter la gestion des cas limites"
  ],
  "suggestedSolution": "Voici une solution optimisée..."
}

==================================
⚠️ SOIS TOLÉRANT : Si la réponse est globalement bonne, donne un score >= 6/10.
`;
}

// prompts.js - Ajout à la fin

/**
 * Prompt pour générer un cours personnalisé
 */
export function buildCoursePrompt(language, weakThemes, studentLevel) {
  const themesList = weakThemes.join(', ');
  
  return `
Tu es un professeur de programmation expert en ${language}.

L'étudiant a passé un test de connaissances et a des difficultés sur les thèmes suivants :
**${themesList}**

Niveau de l'étudiant : ${studentLevel}

==================================
TA MISSION :
==================================

Génère un cours PERSONNALISÉ pour aider l'étudiant à maîtriser ces thèmes.

==================================
STRUCTURE DU COURS :
==================================

# 📚 Cours personnalisé - ${themesList}

## 🎯 Objectifs du cours
- Objectif 1
- Objectif 2
- Objectif 3

## 📖 1. Introduction
Explique pourquoi ces concepts sont importants.

## 📖 2. [Premier thème à renforcer]
- Définition claire
- Exemple simple
- Exemple avancé
- Pièges à éviter
- Astuces pour retenir

## 📖 3. [Deuxième thème à renforcer]
- Même structure...

## 💻 4. Exemples pratiques
- Exemple 1
- Exemple 2
- Exemple 3

## ✍️ 5. Exercices d'application
- Exercice 1 (avec solution)
- Exercice 2 (avec solution)
- Exercice 3 (avec solution)

## 📝 6. Résumé et conseils
- Points clés à retenir
- Conseils pour progresser
- Ressources supplémentaires

==================================
RÈGLES IMPORTANTES :
==================================

1. Utilise le langage ${language}
2. Sois PÉDAGOGIQUE et STRUCTURÉ
3. Donne des EXEMPLES CONCRETS
4. Explique les concepts SIMPLEMENT
5. Encourage l'étudiant
6. Utilise du MARKDOWN pour la mise en forme
7. Inclus des extraits de code (dans des blocs \`\`\`)
8. Adapte le niveau à ${studentLevel}

==================================
GÉNÈRE UN COURS COMPLET ET PERSONNALISÉ.
==================================
`;
}