// routes/test.routes.js
import { Router } from "express";
import { authMiddleware, requireStudent, requireTestNotPassed } from "../middleware/auth.middleware.js";
import * as testController from "../controllers/test.controller.js";
import { analyzeTestResults, generateRecommendations } from "../services/analysis.service.js";
import { generateStudyProgram } from "../services/llm.service.js";

const router = Router();

router.post(
  "/start",
  authMiddleware,
  requireStudent,
  requireTestNotPassed,
  testController.startTest
);

router.post(
  "/correct-code",
  authMiddleware,
  requireStudent,
  testController.correctCodeAnswer
);

/**
 * POST /api/test/analyze
 * Analyse les résultats du test et génère un programme d'étude
 * Body: { language, results: [{ questionId, theme, isCorrect, score }] }
 */
router.post(
  "/analyze",
  authMiddleware,
  requireStudent,
  async (req, res) => {
    try {
      const { language, results } = req.body;

      if (!language) {
        return res.status(400).json({
          success: false,
          error: 'language est requis'
        });
      }

      if (!results || !Array.isArray(results) || results.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'results est requis et doit être un tableau non vide'
        });
      }

      // 1. Analyser les résultats
      const analysis = analyzeTestResults(results);
      const recommendations = generateRecommendations(
        analysis.weakThemes,
        analysis.summary.overallScore
      );

      // 2. Si des thèmes faibles, générer un programme d'étude
      let studyProgram = null;
      if (analysis.weakThemes.length > 0) {
        const weakThemeNames = analysis.weakThemes.map(w => w.theme);
        studyProgram = await generateStudyProgram(weakThemeNames, 3, language);
      }

      res.json({
        success: true,
        data: {
          analysis: analysis.analysis,
          weakThemes: analysis.weakThemes,
          summary: analysis.summary,
          recommendations,
          studyProgram
        }
      });

    } catch (error) {
      console.error('❌ Erreur analyse:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

export default router;