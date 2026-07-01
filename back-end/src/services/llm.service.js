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

function buildFallbackProgram(weakThemes) {
  const themes =
    weakThemes?.length > 0
      ? weakThemes
      : ["variables", "conditions", "boucles"];

  return themes.slice(0, 5).map((theme, index) => ({
    session_order: index + 1,
    theme: theme.charAt(0).toUpperCase() + theme.slice(1),
    language: index % 2 === 0 ? "C" : "Python",
    lesson: {
      introduction: `Cette séance vous aide à renforcer vos connaissances en ${theme}.`,
      why_it_matters: `Maîtriser ${theme} est essentiel pour progresser en programmation.`,
      learning_objectives: [`Comprendre ${theme}`, `Pratiquer ${theme}`],
      definition: `Notion : ${theme}.`,
      detailed_explanation: `Nous revisiterons ${theme} avec des exemples simples et progressifs.`,
      example_code:
        index % 2 === 0
          ? '#include <stdio.h>\nint main() {\n  printf("Hello\\n");\n  return 0;\n}'
          : 'print("Hello")',
      example_output: "Hello",
      example_explanation: "Exemple minimal pour illustrer la notion.",
      step_by_step: ["Lire le cours", "Analyser l'exemple", "Faire l'exercice"],
      real_world_example: `Utilisation concrète de ${theme} dans un petit programme.`,
      common_mistakes: "Relire l'énoncé avant de coder.",
      summary: `Résumé de la séance sur ${theme}.`,
      difficulty: "Débutant",
      estimated_duration: "20 minutes"
    },
    exercise: `Exercice pratique sur ${theme}.`,
    mini_quiz: {
      question: `Question de révision sur ${theme}`,
      options: ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
      answer: "Réponse A"
    }
  }));
}

export async function generateStudyProgram(weakThemes) {
  try {
    const parsed = await generateJson(buildStudyPrompt(weakThemes));
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Format de programme invalide");
    }
    return parsed;
  } catch (err) {
    console.error("Groq programme étude → fallback local :", err.message);
    return buildFallbackProgram(weakThemes);
  }
}

export async function correctCode(payload) {
  return generateJson(buildCodeCorrectionPrompt(payload));
}

export function isLlmAvailable() {
  return Boolean(env.groqApiKey);
}
