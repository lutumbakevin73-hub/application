import Groq from "groq-sdk";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function generateQuestions() {
  const prompt = `
Génère 20 questions de programmation.

Langages:
- Python
- C

Niveaux:
- débutant
- intermédiaire
- avancé

Types:
- QCM
- questions pratiques avec code

Retourne uniquement un JSON valide.
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }]
    });

    let text = response?.choices?.[0]?.message?.content || "";

    // Nettoyage
    text = text
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    // Validation JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("JSON invalide :", text);
      return;
    }

    // Sauvegarde
    fs.writeFileSync("questions.json", JSON.stringify(data, null, 2));

    console.log("Questions générées avec succès !");
  } catch (error) {
    console.error("Erreur API :", error);
  }
}

generateQuestions();