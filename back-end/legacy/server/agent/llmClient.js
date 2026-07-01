import fetch from "node-fetch";

export async function askLLM(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.AIzaSyAuUkn7vMdWldmTO56uMNIuqMyD9gh-O6c}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `SYSTEM: Tu es un agent pédagogique strict.\nUSER: ${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      })
    }
  );

  const data = await response.json();

  // Sécurité minimale
  if (!data.candidates || !data.candidates.length) {
    throw new Error("Aucune réponse Gemini");
  }

  return data.candidates[0].content.parts[0].text;
}
