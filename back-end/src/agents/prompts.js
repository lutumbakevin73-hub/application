// agents/prompts.js — Prompts pédagogiques pour génération IA (Groq)

const THEMES = ["variables", "conditions", "boucles", "tableaux", "listes", "fonctions"];

const BANNED_PHRASES = [
  "cette notion est fondamentale",
  "cette notion est indispensable",
  "bienvenue dans la leçon",
  "on va voir un exemple",
  "voici du code",
  "c'est utilisé partout",
  "quel score minimum",
  "que devez-vous faire avant de tenter le quiz",
  "quelle est l'objectif principal de cette leçon"
];

function langLabel(language) {
  return language === "Python" ? "Python" : "C";
}

function languageSyntaxRules(language) {
  const lang = langLabel(language);
  if (lang === "Python") {
    return `
SYNTAXE PYTHON OBLIGATOIRE :
- Indentation significative (4 espaces)
- Pas de point-virgule en fin de ligne
- print() avec parenthèses
- input() pour lire une valeur
- listes : [1, 2, 3], boucles : for i in range(n):
- Types dynamiques : age = 25, prenom = "Alice"
- Commentaires avec #
`;
  }
  return `
SYNTAXE C OBLIGATOIRE :
- #include <stdio.h> pour printf/scanf
- int main() { ... return 0; }
- Types explicites : int, float, char
- Point-virgule obligatoire
- Tableaux : int notes[5];
- Boucles : for (int i = 0; i < n; i++)
- Commentaires avec //
`;
}

function bannedPhrasesBlock() {
  return BANNED_PHRASES.map((p) => `- "${p}"`).join("\n");
}

/**
 * Programme d'étude personnalisé — cours, exercice, quiz par séance
 */
export function buildStudyPrompt(weakThemes, sessionCount, language = "C") {
  const themes = weakThemes.length > 0 ? weakThemes.join(", ") : "variables, conditions, boucles";
  const lang = langLabel(language);

  return `Tu es un professeur de programmation ${lang} avec une vraie expérience en classe (lycée/université).
Tu rédiges un VRAI cours pédagogique, pas un texte générique rempli de platitudes.

==================================
CONTEXTE
==================================
- Langage : ${lang} UNIQUEMENT (aucun autre langage)
- Lacunes de l'étudiant : ${themes}
- Nombre de séances à produire : ${sessionCount}
- Niveau : débutant qui a échoué au test d'entrée sur ces thèmes
- Chaque séance = 1 thème principal, progressif (du plus simple au plus avancé)

${languageSyntaxRules(language)}

==================================
PRINCIPES PÉDAGOGIQUES (OBLIGATOIRES)
==================================
1. Commence chaque cours par un PROBLÈME CONCRET de la vie réelle (jeu, note, panier, météo…)
2. Explique POURQUOI avant le COMMENT — l'étudiant doit comprendre l'utilité
3. Donne du code COMPLET, EXÉCUTABLE et COMMENTÉ ligne par ligne en ${lang}
4. Montre ce qui se passe EN MÉMOIRE ou dans l'exécution (valeurs, étapes)
5. Liste au moins 3 ERREURS FRÉQUENTES avec code incorrect + correction
6. L'exercice doit être un VRAI mini-projet avec résultat mesurable (sortie exacte attendue)
7. Le quiz doit tester le CONTENU DU COURS (pas des questions méta sur le parcours)
8. Chaque question du quiz a 4 options PLAUSIBLES — les mauvaises réponses sont des pièges réalistes
9. Varie les exemples : pas toujours "age" et "score" — utilise prénoms, notes, températures, prix
10. Écris en français clair, phrases courtes, ton encourageant mais exigeant sur la précision

==================================
INTERDICTIONS ABSOLUES
==================================
${bannedPhrasesBlock()}
- Questions du type "Quel est l'objectif de cette leçon ?" ou "Que faut-il faire avant le quiz ?"
- Options évidentes du type "Ignorer la leçon" ou "Passer sans lire"
- Code dans un autre langage que ${lang}
- Texte vide, "...", "à compléter", ou sections copiées-collées identiques entre séances
- Quiz qui ne portent pas sur le thème de la séance

==================================
CONTENU MINIMUM PAR SÉANCE
==================================

lesson :
- introduction (120+ mots) : problème concret + ce que l'étudiant saura faire à la fin
- why_it_matters (100+ mots) : 3 exemples réels + conséquence si on ne maîtrise pas
- learning_objectives : 4 à 6 verbes d'action (Déclarer, Comprendre, Écrire, Corriger, Appliquer…)
- definition : analogie du quotidien + définition technique courte
- detailed_explanation (250+ mots) : étapes numérotées avec extrait de code à chaque étape
- example_code : programme complet ${lang} (15 à 40 lignes), commenté
- example_output : sortie EXACTE du programme (ligne par ligne)
- example_explanation : explique chaque bloc du code
- step_by_step : 4 à 6 étapes de travail pour l'étudiant
- real_world_example : cas d'usage précis (app, script, calcul…)
- common_mistakes : au moins 3 erreurs avec ❌ code faux / ✅ correction / pourquoi
- key_takeaways : 4 points à retenir
- summary (80+ mots) : synthèse + lien vers la prochaine notion
- next_steps : une phrase sur la suite logique

exercise :
- title : titre motivant et concret
- instructions (80+ mots) : énoncé précis, entrées/sorties, contraintes
- hints : 2 à 3 indices progressifs (du plus doux au plus direct)
- starter_code : squelette ${lang} (pas la solution complète)
- expected_result : sortie EXACTE attendue (copiable pour vérification)
- solution_approach : méthode en 3-5 étapes (sans donner tout le code)

exercises :
- EXACTEMENT 3 exercices progressifs par séance (facile → intermédiaire → consolidation)
- Chaque exercice a les mêmes champs que ci-dessus (title, instructions, hints, starter_code, expected_result, solution_approach)
- Les 3 exercices restent liés au thème de la leçon mais avec des énoncés DISTINCTS

mini_quiz :
- title : "Quiz — [thème]"
- passing_score : 70
- questions : EXACTEMENT 8 questions sur le thème et le contenu de la leçon :
  * 5 QCM (type "qcm") : énoncé clair, 4 options, answer = texte exact d'une option, explanation
  * 3 pratiques (type "pratique") : l'étudiant écrit du code ${lang}, correctAnswer = programme complet exécutable, explanation

==================================
FORMAT JSON (TABLEAU DE ${sessionCount} SÉANCES)
==================================

[
  {
    "session_order": 1,
    "theme": "Variables",
    "language": "${lang}",
    "lesson": { ... tous les champs ci-dessus ... },
    "exercises": [
      { "title", "instructions", "hints", "starter_code", "expected_result", "solution_approach" },
      { "title", "instructions", "hints", "starter_code", "expected_result", "solution_approach" },
      { "title", "instructions", "hints", "starter_code", "expected_result", "solution_approach" }
    ],
    "mini_quiz": {
      "title": "Quiz — Variables",
      "passing_score": 70,
      "questions": [
        { "type": "qcm", "question": "...", "options": ["...", "...", "...", "..."], "answer": "...", "explanation": "..." },
        { "type": "pratique", "question": "Écrivez...", "correctAnswer": "code complet", "explanation": "..." }
      ]
    }
  }
]

Priorise les thèmes faibles : ${themes}
Répartis-les sur les ${sessionCount} séances (répète un thème seulement si nécessaire).

RETOURNE UNIQUEMENT UN JSON VALIDE — tableau [], sans markdown, sans texte avant/après.`;
}

/**
 * Une seule séance — génération détaillée leçon par leçon (streaming)
 */
export function buildSingleSessionPrompt({
  theme,
  sessionOrder,
  sessionCount,
  language = "C",
  weakThemes = []
}) {
  const lang = langLabel(language);
  const label = String(theme).charAt(0).toUpperCase() + String(theme).slice(1);
  const lacunes = weakThemes.length > 0 ? weakThemes.join(", ") : theme;

  return `Tu es un professeur de programmation ${lang}. Tu rédiges UNE SEULE leçon ULTRA-DÉTAILLÉE, explicite, avec BEAUCOUP d'exemples.

==================================
CONTEXTE DE CETTE SÉANCE
==================================
- Séance ${sessionOrder} sur ${sessionCount}
- Thème principal : ${label}
- Lacunes de l'étudiant : ${lacunes}
- Langage : ${lang} UNIQUEMENT
- Public : débutant motivé, a besoin de clarté et de répétition par l'exemple

${languageSyntaxRules(language)}

==================================
EXIGENCES DE RICHESSE (OBLIGATOIRE)
==================================
- introduction : 250+ mots, commence par un problème concret
- why_it_matters : 180+ mots, au moins 4 exemples réels
- detailed_explanation : 500+ mots, découpé en sous-parties numérotées, avec code à chaque étape
- example_code : programme principal 40 à 70 lignes, entièrement commenté
- additional_examples : EXACTEMENT 2 exemples supplémentaires (titre, code, output, explanation chacun)
- common_mistakes : 5 erreurs minimum, format ❌ faux / ✅ corrigé / pourquoi
- exercise.instructions : 150+ mots, énoncé pas à pas
- exercises : EXACTEMENT 3 exercices pratiques progressifs (facile, intermédiaire, consolidation)
- mini_quiz : EXACTEMENT 8 questions liées au contenu de CETTE leçon :
  * 5 questions QCM (type "qcm") avec 4 options chacune
  * 3 questions pratiques (type "pratique") où l'étudiant écrit du code ${lang}

==================================
INTERDICTIONS
==================================
${bannedPhrasesBlock()}
- Texte générique ou vague
- Moins de 2 exemples supplémentaires
- Quiz méta (« avant le quiz », « objectif de la leçon »)

==================================
FORMAT JSON (UN SEUL OBJET)
==================================

{
  "session_order": ${sessionOrder},
  "theme": "${label}",
  "language": "${lang}",
  "lesson": {
    "introduction": "...",
    "why_it_matters": "...",
    "learning_objectives": ["...", "..."],
    "definition": "...",
    "detailed_explanation": "...",
    "example_code": "...",
    "example_output": "...",
    "example_explanation": "...",
    "additional_examples": [
      { "title": "Exemple 1 — ...", "code": "...", "output": "...", "explanation": "..." },
      { "title": "Exemple 2 — ...", "code": "...", "output": "...", "explanation": "..." }
    ],
    "step_by_step": ["...", "..."],
    "real_world_example": "...",
    "common_mistakes": "...",
    "key_takeaways": ["...", "..."],
    "summary": "...",
    "next_steps": "..."
  },
  "exercises": [
    {
      "title": "Exercice 1 — ...",
      "instructions": "...",
      "hints": ["...", "...", "..."],
      "starter_code": "...",
      "expected_result": "...",
      "solution_approach": "..."
    },
    {
      "title": "Exercice 2 — ...",
      "instructions": "...",
      "hints": ["...", "..."],
      "starter_code": "...",
      "expected_result": "...",
      "solution_approach": "..."
    },
    {
      "title": "Exercice 3 — ...",
      "instructions": "...",
      "hints": ["...", "..."],
      "starter_code": "...",
      "expected_result": "...",
      "solution_approach": "..."
    }
  ],
  "mini_quiz": {
    "title": "Quiz — ${label}",
    "passing_score": 70,
    "questions": [
      { "type": "qcm", "question": "...", "options": ["...", "...", "...", "..."], "answer": "...", "explanation": "..." },
      { "type": "pratique", "question": "Écrivez un programme en ${lang} qui...", "correctAnswer": "code complet exécutable", "explanation": "..." }
    ]
  }
}

RETOURNE UNIQUEMENT CET OBJET JSON, sans markdown, sans texte autour.`;
}

/**
 * Test d'entrée — 20 questions (10 QCM + 10 pratiques), 4 notions de base
 */
export function buildTestPrompt(language = "C") {
  const lang = langLabel(language);
  const arrayTheme = lang === "Python" ? "listes" : "tableaux";

  return `Tu es un professeur qui conçoit un test de positionnement en programmation ${lang}.
Le test évalue uniquement les NOTIONS DE BASE — niveau débutant absolu, sans piège ni sujet avancé.

==================================
CONTRAINTES
==================================
- EXACTEMENT 20 questions (id 1 à 20)
- Langage : ${lang} UNIQUEMENT
- 10 QCM (type "qcm") + 10 pratiques (type "pratique")
- 4 notions UNIQUEMENT — 5 questions par notion :
  * variables (id 1-5)
  * conditions (id 6-10)
  * fonctions (id 11-15)
  * ${arrayTheme} (id 16-20)
- Par notion : 2 QCM + 3 pratiques OU 3 QCM + 2 pratiques (total 5 par notion)

${languageSyntaxRules(language)}

==================================
NIVEAU DE DIFFICULTÉ (OBLIGATOIRE)
==================================
- Questions accessibles à un débutant complet
- Pas de pointeurs, pas de structures/recursion avancée, pas de fichiers, pas de librairies externes
- Pas de notions hors des 4 thèmes ci-dessus (pas de boucles comme thème isolé, pas de POO avancée)
- Les boucles simples peuvent apparaître DANS une question sur fonctions ou ${arrayTheme}, sans les rendre complexes
- Programmes courts : moins de 20 lignes pour les solutions pratiques

==================================
RÈGLES QCM (10 questions)
==================================
- Tester la COMPRÉHENSION de base : lecture de code simple, prédiction de sortie, repérage d'erreur évidente
- 4 options PLAUSIBLES — distracteurs = erreurs typiques de débutants
- correctAnswer : index 0-3 de la bonne option
- Énoncé clair avec extrait de code ${lang} dans au moins 6 questions QCM
- Mise en forme : séparer l'énoncé et le code avec \\n\\n ; chaque ligne de code sur sa propre ligne (\\n entre les lignes)

==================================
RÈGLES PRATIQUES (10 questions)
==================================
- Énoncé court et concret : "Affichez…", "Calculez…", "Écrivez une fonction qui…"
- correctAnswer : solution COMPLÈTE et EXÉCUTABLE en ${lang}
- Difficulté progressive au sein de chaque notion (id plus bas = plus facile)
- Chaque solution fait moins de 20 lignes

==================================
INTERDICTIONS
==================================
- Notions compliquées ou hors programme (pointeurs, malloc, classes, threads, etc.)
- Questions vagues sans contexte
- Options "Toutes les réponses" / "Aucune"
- Code dans un autre langage
- correctAnswer vide ou "..." pour les pratiques
- Moins ou plus de 20 questions

==================================
FORMAT JSON
==================================

[
  {
    "id": 1,
    "type": "qcm",
    "language": "${lang}",
    "theme": "variables",
    "question": "Que affiche ce programme ?\\n\\n[code ici]",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1
  },
  {
    "id": 5,
    "type": "pratique",
    "language": "${lang}",
    "theme": "variables",
    "question": "Écrivez un programme en ${lang} qui déclare deux entiers et affiche leur somme.",
    "correctAnswer": "code complet ici"
  },
  {
    "id": 16,
    "type": "qcm",
    "language": "${lang}",
    "theme": "${arrayTheme}",
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": 0
  }
]

RETOURNE UNIQUEMENT LE TABLEAU JSON, sans markdown ni commentaire.`;
}

/**
 * Correction de code (test d'entrée — questions pratiques)
 */
export function buildCodeCorrectionPrompt({
  language,
  question,
  correctAnswer,
  userAnswer
}) {
  const lang = langLabel(language);

  return `Tu es un correcteur bienveillant mais exigeant en programmation ${lang}.

Évalue le code de l'étudiant par rapport à la consigne.

CONSIGNE : ${question}
SOLUTION DE RÉFÉRENCE : ${correctAnswer}
CODE ÉTUDIANT :
${userAnswer}

CRITÈRES (dans l'ordre) :
1. Le programme résout-il le problème posé ?
2. La syntaxe ${lang} est-elle globalement correcte ?
3. La logique est-elle saine (même si la solution diffère de la référence) ?

Sois tolérant sur : noms de variables, espaces, ordre des instructions si le résultat est bon.
Sois strict sur : erreurs de syntaxe bloquantes, mauvaise logique, programme qui ne répond pas à la consigne.

RETOURNE UNIQUEMENT CE JSON :
{
  "correct": true,
  "score": 85,
  "feedback": "2-4 phrases : ce qui est bien + ce qu'il faut améliorer",
  "mistakes": ["erreur 1 si présente"],
  "correct_code": "version corrigée courte si nécessaire, sinon chaîne vide"
}

correct = true si le programme fonctionne et répond à la consigne (score >= 70).
score = 0 à 100.`;
}

/**
 * Évaluation détaillée (optionnel)
 */
export function buildEvaluationPrompt({ language, question, correctAnswer, userAnswer, type }) {
  if (type === "qcm") {
    return null;
  }

  return buildCodeCorrectionPrompt({
    language,
    question,
    correctAnswer,
    userAnswer
  });
}

/**
 * Contenu pédagogique de secours par thème (si l'IA échoue)
 */
export function getThemeFallbackContent(theme, language = "C") {
  const lang = langLabel(language);
  const key = String(theme).toLowerCase();

  const templates = {
    variables: {
      intro:
        "Imaginez une application qui affiche votre solde bancaire : le programme doit retenir un nombre quelque part. C'est le rôle des variables — des emplacements nommés en mémoire. Dans cette leçon, vous apprendrez à déclarer une variable, y stocker une valeur et l'afficher en " +
        lang +
        ".",
      exampleCode:
        lang === "C"
          ? `#include <stdio.h>\n\nint main() {\n    int points = 42;\n    char prenom[] = "Amina";\n    printf("%s a %d points\\n", prenom, points);\n    points = points + 8;\n    printf("Apres bonus : %d\\n", points);\n    return 0;\n}`
          : `points = 42\nprenom = "Amina"\nprint(f"{prenom} a {points} points")\npoints = points + 8\nprint(f"Apres bonus : {points}")`,
      exampleOutput: "Amina a 42 points\nApres bonus : 50",
      exercise: {
        title: "Carte de fidélité",
        instructions:
          "Créez un programme qui déclare une variable `achats` valant 120, ajoute un bonus de 30, puis affiche le total. Utilisez des noms de variables explicites.",
        expected_result: lang === "C" ? "Total points : 150" : "Total points : 150"
      },
      quiz: [
        {
          question: "Que fait l'instruction qui modifie une variable existante ?",
          options: [
            "Elle remplace la valeur en mémoire par une nouvelle",
            "Elle crée automatiquement une deuxième variable",
            "Elle supprime l'ancienne variable du programme",
            "Elle interdit toute lecture ultérieure"
          ],
          answer: "Elle remplace la valeur en mémoire par une nouvelle",
          explanation:
            "Modifier une variable écrase l'ancienne valeur ; le nom reste le même en mémoire."
        }
      ]
    },
    conditions: {
      intro:
        "Un thermostat allume le chauffage seulement si la température est basse — c'est une décision. Les structures conditionnelles permettent à votre programme de réagir selon les données. Vous allez écrire des tests et des branches en " +
        lang +
        ".",
      exampleCode:
        lang === "C"
          ? `#include <stdio.h>\n\nint main() {\n    int note = 11;\n    if (note >= 10) {\n        printf("Valide\\n");\n    } else {\n        printf("A revoir\\n");\n    }\n    return 0;\n}`
          : `note = 11\nif note >= 10:\n    print("Valide")\nelse:\n    print("A revoir")`,
      exampleOutput: "Valide",
      exercise: {
        title: "Accès autorisé ou refusé",
        instructions:
          "Demandez une note sur 20 (ou utilisez une variable `note`). Affichez « Admis » si note >= 10, sinon « Recalé ».",
        expected_result: "Admis (si note >= 10) ou Recalé"
      },
      quiz: [
        {
          question: "À quoi sert un bloc if / else ?",
          options: [
            "Exécuter un bloc ou un autre selon une condition",
            "Répéter une action un nombre fixe de fois",
            "Déclarer plusieurs variables d'un coup",
            "Arrêter définitivement le programme"
          ],
          answer: "Exécuter un bloc ou un autre selon une condition",
          explanation: "Les conditions choisissent quel code exécuter."
        }
      ]
    },
    boucles: {
      intro:
        "Afficher les 10 premiers numéros d'un ticket de caisse à la main serait long : une boucle le fait automatiquement. Vous allez parcourir des séries de valeurs avec une boucle adaptée à " +
        lang +
        ".",
      exampleCode:
        lang === "C"
          ? `#include <stdio.h>\n\nint main() {\n    for (int i = 1; i <= 5; i++) {\n        printf("Ticket #%d\\n", i);\n    }\n    return 0;\n}`
          : `for i in range(1, 6):\n    print(f"Ticket #{i}")`,
      exampleOutput: "Ticket #1\nTicket #2\nTicket #3\nTicket #4\nTicket #5",
      exercise: {
        title: "Compte à rebours",
        instructions: "Affichez les nombres de 5 à 1, un par ligne, en utilisant une boucle.",
        expected_result: "5\n4\n3\n2\n1"
      },
      quiz: [
        {
          question: "Quand utilise-t-on une boucle ?",
          options: [
            "Pour répéter une action plusieurs fois",
            "Pour stocker une seule valeur",
            "Pour comparer deux chaînes uniquement",
            "Pour importer une bibliothèque"
          ],
          answer: "Pour répéter une action plusieurs fois",
          explanation: "Les boucles automatisent les répétitions."
        }
      ]
    }
  };

  const arrayKey = lang === "Python" ? "listes" : "tableaux";
  templates[arrayKey] = {
    intro: `Les notes d'une classe sont plusieurs nombres : on les regroupe dans un ${lang === "C" ? "tableau" : "liste"}. Vous allez créer, parcourir et lire des éléments.`,
    exampleCode:
      lang === "C"
        ? `#include <stdio.h>\n\nint main() {\n    int notes[3] = {12, 9, 15};\n    printf("Note 2 : %d\\n", notes[1]);\n    return 0;\n}`
        : `notes = [12, 9, 15]\nprint(f"Note 2 : {notes[1]}")`,
    exampleOutput: "Note 2 : 9",
    exercise: {
      title: "Moyenne de trois notes",
      instructions: "Stockez trois notes dans un tableau/liste et affichez la somme puis la moyenne.",
      expected_result: "Somme et moyenne affichées"
    },
    quiz: [
      {
        question: `Comment accède-t-on au deuxième élément d'un ${lang === "C" ? "tableau" : "liste"} notes ?`,
        options: [lang === "C" ? "notes[1]" : "notes[1]", "notes[2]", "notes(1)", "notes.second"],
        answer: lang === "C" ? "notes[1]" : "notes[1]",
        explanation: "L'indexation commence à 0 : le 2e élément est à l'index 1."
      }
    ]
  };

  templates.fonctions = {
    intro:
      "Une fonction `carre(n)` évite de recopier le même calcul partout. Vous allez définir des fonctions réutilisables en " +
      lang +
      ".",
    exampleCode:
      lang === "C"
        ? `#include <stdio.h>\n\nint carre(int n) {\n    return n * n;\n}\n\nint main() {\n    printf("%d\\n", carre(4));\n    return 0;\n}`
        : `def carre(n):\n    return n * n\n\nprint(carre(4))`,
    exampleOutput: "16",
    exercise: {
      title: "Fonction double",
      instructions: "Écrivez une fonction qui retourne le double d'un entier et testez-la avec la valeur 7.",
      expected_result: "14"
    },
    quiz: [
      {
        question: "Quel est l'intérêt principal d'une fonction ?",
        options: [
          "Réutiliser un bloc de code avec des paramètres",
          "Remplacer toutes les variables globales",
          "Empêcher l'utilisation des boucles",
          "Supprimer les erreurs de syntaxe automatiquement"
        ],
        answer: "Réutiliser un bloc de code avec des paramètres",
        explanation: "Les fonctions factorisent la logique répétée."
      }
    ]
  };

  const match =
    templates[key] ||
    templates[key.replace(/s$/, "")] ||
    templates.variables;

  return {
    ...match,
    theme: theme.charAt(0).toUpperCase() + theme.slice(1)
  };
}

export { THEMES, BANNED_PHRASES };
