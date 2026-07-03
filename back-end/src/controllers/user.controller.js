import { findUserById } from "../services/auth.service.js";
import * as testResultsService from "../services/test-results.service.js";
import * as userService from "../services/user.service.js";

export async function completeTest(req, res) {
  try {
    const { userId } = req.body;
    if (userId && Number(userId) !== req.user.id) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    if (user.has_passed_test) {
      const existing = await testResultsService.getTestResult(req.user.id);
      if (existing) {
        return res.json({ success: true, testResult: existing });
      }
    }

    const testResult = await testResultsService.saveTestResult(req.user.id, req.body);
    res.json({ success: true, testResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}

export async function getMyTestResult(req, res) {
  try {
    const testResult = await testResultsService.getTestResult(req.user.id);
    res.json({ success: true, testResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function chooseLanguage(req, res) {
  try {
    const language = await userService.setPreferredLanguage(req.user.id, req.body.language);
    res.json({ success: true, preferred_language: language });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
