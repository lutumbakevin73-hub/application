import * as testService from "../services/test.service.js";
import { correctCode } from "../services/llm.service.js";

export async function startTest(_req, res) {
  try {
    const questions = await testService.startTest();
    res.json({ success: true, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erreur start test" });
  }
}

export async function correctCodeAnswer(req, res) {
  try {
    const { language, question, correctAnswer, userAnswer } = req.body;
    const parsed = await correctCode({
      language,
      question,
      correctAnswer,
      userAnswer
    });
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur de correction IA" });
  }
}
