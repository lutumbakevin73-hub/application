import { findUserById } from "../services/auth.service.js";
import * as testService from "../services/test.service.js";
import { correctCode } from "../services/llm.service.js";

export async function startTest(req, res) {
  try {
    const user = await findUserById(req.user.id);
    if (!user?.preferred_language) {
      return res.status(400).json({
        message: "Choisissez d'abord un langage (C ou Python) avant de commencer le test."
      });
    }

    const questions = await testService.startTest(user.preferred_language);
    res.json({ success: true, language: user.preferred_language, questions });
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
