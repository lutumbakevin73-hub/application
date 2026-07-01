import express from "express";
import Groq from "groq-sdk";
import { pool } from "../../db.js";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

router.post("/register", async (req, res) => {

  try {

    const { userId, weakThemes } = req.body|| {};

    if (!userId || !weakThemes || weakThemes.length === 0) {
      return res.status(400).json({
        error: "Données manquantes"
      });
    }

    // =========================
    // 1. CREER LE PROGRAMME
    // =========================

    const [programResult] = await pool.query(
      `
      INSERT INTO study_programs
      (user_id, weak_themes)
      VALUES (?, ?)
      `,
      [
        userId,
        JSON.stringify(weakThemes)
      ]
    );

    const programId = programResult.insertId;

    // =========================
    // 2. PROMPT IA
    // =========================

    const prompt = `
Tu es un professeur expert en programmation.
Tu es un professeur expert en programmation.

Le cours doit ressembler à un véritable support pédagogique universitaire.

Règles :

- introduction : minimum 120 mots
- detailed_explanation : minimum 250 mots
- why_it_matters : minimum 100 mots
- real_world_example : minimum 100 mots
- summary : minimum 80 mots
- Toujours fournir un exemple de code complet.
- Toujours expliquer l'exemple.
- Toujours utiliser des cas concrets.
- Les exercices doivent être progressifs.
- Les quiz doivent comporter 4 choix.
- Une seule bonne réponse.
- Fournir l'explication de la bonne réponse.
- Le contenu doit être adapté à un débutant.
- Retourne uniquement du JSON valide.

Crée un programme de renforcement personnalisé.

Les notions faibles de l'étudiant sont :

${weakThemes.join(", ")}
IMPORTANT :

Chaque séance doit contenir un champ "language".

Les exemples de code doivent être écrits exclusivement
dans le langage indiqué.

Si language = "C" :
- utiliser uniquement du code C
- utiliser printf, scanf, int, float, etc.

Si language = "Python" :
- utiliser uniquement du code Python
- utiliser print(), input(), def, etc.

Ne jamais utiliser JavaScript.
IMPORTANT :
- Retourne uniquement un JSON valide.
- Ne mets aucun texte avant ou après le JSON.
- Chaque séance doit ressembler à un vrai cours.
- Les explications doivent être pédagogiques et détaillées.
-Le champ difficulty est obligatoire.
-Le champ estimated_duration est obligatoire.

Format attendu :

[
  {
    "session_order": 1,
    "theme": "Variables",
    "language": "C",

    "lesson": {
      "introduction": "",
      "why_it_matters": "",
      "learning_objectives":[],
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

Produis entre 5 et 10 séances selon le nombre de notions faibles.
IMPORTANT :
Tu dois retourner UNIQUEMENT un JSON valide.
Aucun caractère spécial non échappé.
Pas de texte autour.
Pas de backslash non échappé.
`;

    // =========================
    // 3. APPEL GROQ
    // =========================

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "user",
            content: prompt
          }
        ]

      });

    let text =
      completion.choices[0].message.content;

    text = text
  .replace(/\\n/g, "\\\\n")
  .replace(/\\t/g, "\\\\t")
  .replace(/\\r/g, "\\\\r");
/*function safeParse(text) {

  try {
    return JSON.parse(text);
  } catch (err) {

    console.log("JSON invalide généré par Groq");

    return null;
  }

}*/
    let sessions;

try {
  sessions = JSON.parse(text);
} catch (err) {
  console.error("JSON invalide retourné par l'IA :", text);

  return res.status(500).json({
    error: "Réponse IA invalide (JSON cassé)"
  });
}

console.log(
  "Sessions générées :",
  JSON.stringify(sessions, null, 2)
);

    // =========================
    // 4. SAUVEGARDE SESSIONS
    // =========================
    

    for (const session of sessions) {

      await pool.query(
        `
        INSERT INTO study_sessions
        (
          program_id,
          session_order,
          theme,
          lesson,
          exercise,
          mini_quiz
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
  programId,
  session.session_order,
  session.theme,

  JSON.stringify(session.lesson),

  JSON.stringify(session.exercise),

  JSON.stringify(session.mini_quiz)
]
      );

    }

    // =========================
    // 5. REPONSE
    // =========================

    res.json({
      success: true,
      programId,
      sessions
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur création programme"
    });

  }

});

export default router;