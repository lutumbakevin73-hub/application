// routes/evaluation.routes.js
import express from 'express';
import { evaluateAnswer } from '../services/evaluator.service.js';

const router = express.Router();

/**
 * POST /api/evaluate
 * Body: { question, userAnswer }
 */
router.post('/', async (req, res) => {
  try {
    const { question, userAnswer } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({
        success: false,
        error: 'question et userAnswer sont requis'
      });
    }

    const result = await evaluateAnswer(question, userAnswer);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur évaluation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;