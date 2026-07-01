import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function test() {
  const response = await groq.chat.completions.create({
    model:  "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: "Génère 2 questions simples de C en JSON"
      }
    ]
  });

  console.log(response.choices[0].message.content);
}

test();