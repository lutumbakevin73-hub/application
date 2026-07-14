import Groq from "groq-sdk";
import { env } from "../config/env.js";
import {
  buildCodeCorrectionPrompt,
  buildSingleSessionPrompt,
  buildStudyPrompt,
  buildTestPrompt,
  getThemeFallbackContent
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

function safeParseJsonObject(text) {
  const cleaned = cleanJson(text);
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      if (parsed.length === 1 && parsed[0] && typeof parsed[0] === "object") {
        return parsed[0];
      }
      throw new Error("Objet unique attendu");
    }
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
  }
  throw new Error("Réponse IA invalide (objet illisible)");
}

export async function generateJson(prompt, options = {}) {
  const {
    model = "llama-3.3-70b-versatile",
    temperature = 0.3,
    system = "Tu es un professeur expert en programmation. Tu réponds UNIQUEMENT avec du JSON valide, sans markdown ni texte autour.",
    timeoutMs = 45000,
    expectObject = false
  } = options;

  const client = getGroq();
  if (!client) {
    throw new Error("Clé Groq non configurée");
  }

  const completion = await withTimeout(
    client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature
    }),
    timeoutMs,
    "Délai Groq dépassé"
  );

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Réponse IA vide");
  }

  return expectObject ? safeParseJsonObject(text) : safeParseJson(text);
}

export async function generateTestQuestions(language = "C") {
  return generateJson(buildTestPrompt(language), {
    temperature: 0.35,
    timeoutMs: 90000,
    system:
      "Tu conçois des évaluations de programmation pour débutants. JSON strict : tableau de 20 questions (10 qcm + 10 pratiques), 5 par notion (variables, conditions, fonctions, tableaux/listes), syntaxe correcte pour le langage demandé."
  });
}

function buildFallbackProgram(weakThemes, sessionCount = 3, language = "C") {
  const lang = language === "Python" ? "Python" : "C";
  const themes =
    weakThemes?.length > 0
      ? weakThemes
      : ["variables", "conditions", "boucles"];

  return Array.from({ length: sessionCount }, (_, index) => {
    const themeKey = themes[index % themes.length];
    const content = getThemeFallbackContent(themeKey, lang);
    const label = content.theme || themeKey.charAt(0).toUpperCase() + themeKey.slice(1);

    const baseQuiz = content.quiz || [];
    const extraQuestions = [
      {
        question: `Quelle sortie correspond au programme exemple de la leçon « ${label} » ?`,
        options: [
          content.exampleOutput.split("\n")[0] || "Sortie A",
          "Erreur de compilation",
          "Aucune sortie",
          "0"
        ],
        answer: content.exampleOutput.split("\n")[0] || "Sortie A",
        explanation: "La sortie doit correspondre à l'exécution du code de la leçon."
      },
      {
        question: `Quelle compétence cette séance sur ${label} vous fait acquérir ?`,
        options: [
          `Appliquer ${label} dans un petit programme ${lang}`,
          "Mémoriser du texte sans pratique",
          "Changer de langage en cours de route",
          "Ignorer les erreurs fréquentes"
        ],
        answer: `Appliquer ${label} dans un petit programme ${lang}`,
        explanation: "Chaque séance vise une compétence pratique."
      }
    ];

    return {
      session_order: index + 1,
      theme: label,
      language: lang,
      lesson: {
        introduction: content.intro,
        why_it_matters: `Maîtriser ${label} permet d'écrire des programmes qui stockent des données, prennent des décisions ou automatisent des calculs. Sans cette base, les leçons suivantes deviennent incompréhensibles.`,
        learning_objectives: [
          `Expliquer le rôle de ${label} en ${lang}`,
          `Lire et exécuter l'exemple commenté`,
          `Repérer une erreur fréquente liée à ${label}`,
          `Compléter l'exercice guidé`
        ],
        definition: `${label} : notion essentielle illustrée avec une analogie concrète et un exemple exécutable en ${lang}.`,
        detailed_explanation: `Étudiez l'exemple ligne par ligne. Exécutez-le mentalement : quelles valeurs sont stockées ? quelles instructions s'enchaînent ? Reproduisez ensuite le programme en modifiant une valeur pour vérifier votre compréhension de ${label}.`,
        example_code: content.exampleCode,
        example_output: content.exampleOutput,
        example_explanation: `Ce programme illustre ${label}. Observez comment les variables évoluent et comment la sortie est produite.`,
        step_by_step: [
          "Lire l'introduction et les objectifs",
          "Analyser l'exemple de code",
          "Reproduire et modifier une valeur",
          "Réaliser l'exercice avec les indices",
          "Valider avec le quiz (5 questions)"
        ],
        real_world_example: `Application concrète : scripts de calcul, petits jeux, ou outils qui utilisent ${label} pour traiter des données réelles.`,
        common_mistakes: `Erreurs fréquentes : mauvaise syntaxe ${lang}, oubli d'initialisation, confusion entre comparaison et affectation, et avancer sans tester le programme.`,
        key_takeaways: [
          `${label} est indispensable pour la suite du parcours`,
          "Toujours tester avec plusieurs valeurs",
          "Lire les messages d'erreur du compilateur/interpréteur"
        ],
        summary: `Vous avez consolidé ${label} en ${lang}. Passez à l'exercice puis au quiz (70% minimum).`,
        next_steps: `La prochaine séance approfondira un autre point faible identifié au test d'entrée.`
      },
      exercises: [
        {
          title: `${content.exercise.title} — niveau 1`,
          instructions: content.exercise.instructions,
          hints: [
            "Relisez l'exemple de la leçon",
            "Testez avec une valeur simple",
            `Vérifiez la syntaxe ${lang} avant d'exécuter`
          ],
          starter_code: content.exampleCode,
          expected_result: content.exercise.expected_result,
          solution_approach: "Partez de l'exemple et modifiez les valeurs demandées."
        },
        {
          title: `${content.exercise.title} — niveau 2`,
          instructions: `${content.exercise.instructions}\n\nVariante : changez les valeurs de test et vérifiez que la sortie reste cohérente.`,
          hints: [
            "Identifiez les variables à modifier",
            "Comparez votre sortie à expected_result"
          ],
          starter_code: content.exampleCode,
          expected_result: content.exercise.expected_result,
          solution_approach: "Réutilisez la structure du premier exercice avec de nouvelles données."
        },
        {
          title: `${content.exercise.title} — niveau 3`,
          instructions: `${content.exercise.instructions}\n\nConsolidation : ajoutez une étape d'affichage intermédiaire avant le résultat final.`,
          hints: [
            "Ajoutez un printf/print intermédiaire",
            "Relisez les erreurs fréquentes de la leçon"
          ],
          starter_code: "",
          expected_result: content.exercise.expected_result,
          solution_approach: "Combinez les compétences vues dans les deux exercices précédents."
        }
      ],
      mini_quiz: {
        title: `Quiz — ${label}`,
        passing_score: 70,
        questions: [
          ...baseQuiz,
          ...extraQuestions,
          {
            type: "pratique",
            question: `Écrivez un petit programme en ${lang} qui illustre ${label} (comme dans la leçon).`,
            correctAnswer: content.exampleCode,
            explanation: "Votre code doit reproduire la logique de l'exemple principal."
          },
          {
            type: "pratique",
            question: `Modifiez l'exemple de la leçon sur ${label} pour afficher un résultat différent mais correct.`,
            correctAnswer: content.exampleCode,
            explanation: "La syntaxe et la structure doivent rester valides."
          },
          {
            type: "pratique",
            question: `Corrigez un programme ${lang} incomplet sur ${label} (déclarations + sortie attendue).`,
            correctAnswer: content.exampleCode,
            explanation: "Vérifiez déclarations, affectations et affichage."
          }
        ].slice(0, 8)
      }
    };
  });
}

export async function generateStudyProgram(weakThemes, sessionCount = 3, language = "C", onProgress) {
  const count = Math.max(1, Number(sessionCount) || 3);
  const lang = language === "Python" ? "Python" : "C";
  const themes =
    weakThemes?.length > 0 ? weakThemes.map(String) : ["variables", "conditions", "boucles"];

  const emit =
    typeof onProgress === "function"
      ? onProgress
      : () => {};

  emit({
    phase: "init",
    message: "Analyse de vos lacunes et préparation du programme...",
    percent: 5,
    current: 0,
    total: count
  });

  const sessions = [];

  for (let index = 0; index < count; index += 1) {
    const themeKey = themes[index % themes.length];
    const label = themeKey.charAt(0).toUpperCase() + themeKey.slice(1);

    emit({
      phase: "generating",
      current: index + 1,
      total: count,
      theme: label,
      message: `Rédaction détaillée de la leçon ${index + 1}/${count} : ${label}...`,
      percent: Math.round(8 + (index / count) * 82)
    });

    let session;
    try {
      session = await generateSingleStudySession({
        theme: themeKey,
        sessionOrder: index + 1,
        sessionCount: count,
        language: lang,
        weakThemes: themes
      });
    } catch (err) {
      console.error(`Groq séance ${index + 1} → fallback :`, err.message);
      session = buildFallbackProgram([themeKey], 1, lang)[0];
      session.session_order = index + 1;
    }

    sessions.push(session);

    emit({
      phase: "session_done",
      current: index + 1,
      total: count,
      theme: label,
      message: `Leçon ${index + 1} prête : ${label}`,
      percent: Math.round(8 + ((index + 1) / count) * 82)
    });
  }

  emit({
    phase: "sessions_ready",
    message: "Toutes les leçons ont été générées.",
    percent: 92,
    current: count,
    total: count
  });

  return sessions;
}

export async function generateSingleStudySession({
  theme,
  sessionOrder,
  sessionCount,
  language = "C",
  weakThemes = []
}) {
  const lang = language === "Python" ? "Python" : "C";

  return generateJson(
    buildSingleSessionPrompt({
      theme,
      sessionOrder,
      sessionCount,
      language: lang,
      weakThemes
    }),
    {
      temperature: 0.22,
      timeoutMs: 120000,
      expectObject: true,
      system:
        "Tu rédiges un cours de programmation long, explicite, avec de nombreux exemples commentés. JSON strict : un seul objet séance avec exercises (3) et mini_quiz (5 QCM + 3 pratiques)."
    }
  );
}

export async function generateStudyProgramBatch(weakThemes, sessionCount = 3, language = "C") {
  const count = Math.max(1, Number(sessionCount) || 3);
  const lang = language === "Python" ? "Python" : "C";
  try {
    const parsed = await generateJson(buildStudyPrompt(weakThemes, count, lang), {
      temperature: 0.25,
      system:
        "Tu rédiges des cours de programmation structurés et concrets. JSON strict : tableau de séances avec lesson, exercises (3 par séance) et mini_quiz (5 QCM + 3 pratiques). Pas de contenu générique."
    });
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Format de programme invalide");
    }
    return parsed.slice(0, count);
  } catch (err) {
    console.error("Groq programme étude → fallback local :", err.message);
    return buildFallbackProgram(weakThemes, count, lang);
  }
}

export async function correctCode(payload) {
  return generateJson(buildCodeCorrectionPrompt(payload), {
    temperature: 0.2,
    system: "Tu corriges du code étudiant avec bienveillance et précision. JSON strict uniquement."
  });
}

export function isLlmAvailable() {
  return Boolean(env.groqApiKey);
}
