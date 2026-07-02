import Groq from "groq-sdk";
import { env } from "../config/env.js";
import {
  buildCodeCorrectionPrompt,
  buildStudyPrompt,
  buildTestPrompt
} from "../agents/prompts.js";

let groq = null;
let groqKeyUsed = null;

function getGroq() {
  if (!env.groqApiKey) {
    return null;
  }
  if (!groq || groqKeyUsed !== env.groqApiKey) {
    groq = new Groq({ apiKey: env.groqApiKey });
    groqKeyUsed = env.groqApiKey;
  }
  return groq;
}

function cleanJson(text) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function safeParseJson(text) {
  try {
    return JSON.parse(cleanJson(text));
  } catch {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        // continue to throw below
      }
    }
    throw new Error("Réponse IA invalide (JSON illisible)");
  }
}

async function withTimeout(promise, ms, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateJson(prompt, model = "llama-3.3-70b-versatile") {
  const client = getGroq();
  if (!client) {
    throw new Error("Clé Groq non configurée");
  }

  const completion = await withTimeout(
    client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    }),
    25000,
    "Délai Groq dépassé"
  );

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Réponse IA vide");
  }

  return safeParseJson(text);
}

export async function generateTestQuestions() {
  return generateJson(buildTestPrompt());
}

function buildFallbackProgram(weakThemes, sessionCount = 3) {
  const themes =
    weakThemes?.length > 0
      ? weakThemes
      : ["variables", "conditions", "boucles"];

  return Array.from({ length: sessionCount }, (_, index) => {
    const theme = themes[index % themes.length];
    const label = theme.charAt(0).toUpperCase() + theme.slice(1);
    const lang = index % 2 === 0 ? "C" : "Python";

    const exampleCode =
      lang === "C"
        ? `#include <stdio.h>\n\nint main() {\n    int score = 15;\n    printf("Theme: ${label}, score = %d\\n", score);\n    return 0;\n}`
        : `# Exemple ${label}\nvaleur = 15\nprint(f"Theme: ${label}, score = {valeur}")`;

    return {
      session_order: index + 1,
      theme: label,
      language: lang,
      lesson: {
        introduction: `Bienvenue dans la leçon ${index + 1} sur ${label}. Cette séance fait partie de votre programme personnalisé de ${sessionCount} jours, conçu pour combler vos lacunes identifiées au test de niveau. Vous allez revoir les bases, comprendre pourquoi ${label} est indispensable, puis pratiquer avec un exercice guidé et un quiz de validation.`,
        why_it_matters: `Sans maîtriser ${label}, il est difficile d'écrire des programmes fiables. Cette notion revient dans presque tous les projets : applications, scripts d'automatisation, jeux simples ou outils de calcul. En consolidant ${label} maintenant, vous gagnez en autonomie pour les leçons suivantes.`,
        learning_objectives: [
          `Définir clairement le rôle de ${label} en ${lang}`,
          `Lire et comprendre un exemple commenté`,
          `Repérer les erreurs fréquentes liées à ${label}`,
          `Appliquer la notion dans un mini-projet`
        ],
        definition: `${label} : notion fondamentale de programmation abordée dans cette leçon avec des exemples concrets en ${lang}.`,
        detailed_explanation: `Dans cette leçon, nous allons décomposer ${label} étape par étape. Commencez par observer l'exemple de code : identifiez les lignes clés, exécutez mentalement le programme, puis notez ce que chaque instruction produit. Ensuite, reproduisez l'idée avec vos propres valeurs. L'objectif n'est pas seulement de copier, mais de comprendre le mécanisme pour l'adapter à de nouveaux problèmes liés à ${label}.`,
        example_code: exampleCode,
        example_output: `Theme: ${label}, score = 15`,
        example_explanation: `Ce programme illustre ${label} avec une valeur concrète (15) et affiche un message clair. Modifiez la valeur pour vérifier que vous comprenez le comportement.`,
        step_by_step: [
          "Lire l'introduction et les objectifs",
          "Analyser l'exemple ligne par ligne",
          "Reproduire l'exemple dans votre éditeur",
          "Réaliser l'exercice avec les indices fournis",
          "Valider vos acquis avec le quiz (3 questions)"
        ],
        real_world_example: `Exemple concret : un petit programme de suivi de notes ou de compteur utilise ${label} pour stocker, comparer ou répéter des actions selon le contexte.`,
        common_mistakes: `Erreurs fréquentes : oublier la syntaxe ${lang}, confondre les types de données, ne pas tester le programme avec plusieurs valeurs, ou avancer au quiz sans avoir fait l'exercice.`,
        summary: `Vous avez revu ${label} en ${lang}. Retenez l'idée principale, pratiquez l'exercice, puis obtenez au moins 70% au quiz pour débloquer la leçon suivante.`,
        difficulty: index === 0 ? "Débutant" : "Intermédiaire",
        estimated_duration: "25 minutes"
      },
      exercise: {
        title: `Exercice guidé — ${label}`,
        instructions: `Écrivez un programme en ${lang} qui met en pratique ${label}. Partez du code proposé, modifiez-le pour afficher votre prénom et une valeur numérique de votre choix, puis vérifiez que la sortie correspond à ce que vous attendez.`,
        hints: [
          `Relisez l'exemple de la leçon sur ${label}.`,
          "Testez d'abord avec une seule valeur simple (ex: 10).",
          "Vérifiez la syntaxe : parenthèses, point-virgules en C, indentation en Python."
        ],
        starter_code: exampleCode,
        expected_result: `Un message personnalisé utilisant ${label}.`,
        solution_approach: `Commencez par dupliquer l'exemple, remplacez une variable, exécutez, puis ajoutez une petite variation (calcul ou condition) liée à ${label}.`
      },
      mini_quiz: {
        title: `Quiz — ${label}`,
        passing_score: 70,
        questions: [
          {
            question: `Quel est l'objectif principal de cette leçon sur ${label} ?`,
            options: [
              `Comprendre et appliquer ${label}`,
              "Apprendre uniquement la théorie sans pratique",
              "Ignorer les erreurs fréquentes",
              "Passer directement à une leçon avancée sans quiz"
            ],
            answer: `Comprendre et appliquer ${label}`,
            explanation: `Chaque leçon vise à combler une lacune précise : ${label}.`
          },
          {
            question: `Que devez-vous faire avant de tenter le quiz ?`,
            options: [
              "Lire la leçon et faire l'exercice",
              "Passer directement au quiz",
              "Ignorer l'exemple de code",
              "Changer de langage sans lire"
            ],
            answer: "Lire la leçon et faire l'exercice",
            explanation: "La pratique renforce la mémorisation et prépare au quiz."
          },
          {
            question: `Quel score minimum faut-il pour valider la leçon ?`,
            options: ["70%", "20%", "100% sans exercice", "0%"],
            answer: "70%",
            explanation: "Il faut au moins 2 bonnes réponses sur 3 (70%)."
          }
        ]
      }
    };
  });
}

export async function generateStudyProgram(weakThemes, sessionCount = 3) {
  const count = Math.max(1, Number(sessionCount) || 3);
  try {
    const parsed = await generateJson(buildStudyPrompt(weakThemes, count));
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Format de programme invalide");
    }
    return parsed.slice(0, count);
  } catch (err) {
    console.error("Groq programme étude → fallback local :", err.message);
    return buildFallbackProgram(weakThemes, count);
  }
}

export async function correctCode(payload) {
  return generateJson(buildCodeCorrectionPrompt(payload));
}

export function isLlmAvailable() {
  return Boolean(env.groqApiKey);
}
