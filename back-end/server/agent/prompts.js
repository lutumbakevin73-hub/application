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