function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log("JSON invalide, fallback DB");
    return null;
  }
}

import Groq from "groq-sdk";
import { buildTestPrompt } from "./prompts.js";
import { saveQuestions, getQuestionsFromDB } from "../question.service.js";

const GROQ_KEY = process.env.GROQ_API_KEY;

let groq = null;

if (GROQ_KEY) {
  groq = new Groq({ apiKey: GROQ_KEY });
  console.log("Groq OK");
} else {
  console.warn("Pas de clé Groq");
}
/*function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log("JSON invalide");
    return null;
  }
}*/
export async function generateTestQuestions() {

  const prompt = buildTestPrompt();

  // 🔹 CAS 1 : IA dispo
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // ⚠ modèle valide
        messages: [
          { role: "user", content: prompt }
        ]
      });

      let text = completion.choices[0].message.content;

      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const questions = JSON.parse(text);

      //  SAUVEGARDE DB
      await saveQuestions(questions);

      console.log("Questions générées + sauvegardées");

      return questions;

    } catch (err) {
      console.error("Erreur LLM → fallback DB");
    }
  }

  //  CAS 2 : fallback DB
  const fallback = await getQuestionsFromDB(10);

  if (fallback.length > 0) {
    console.log("Questions chargées depuis DB");
    return fallback;
  }

  // CAS 3 : rien du tout
  throw new Error("Aucune question disponible (ni IA ni DB)");
}