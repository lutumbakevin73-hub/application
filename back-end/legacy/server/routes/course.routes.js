// course.routes.js
import express from 'express';
import { generatePersonalizedCourse, generateExercises } from '../services/course-generator.service.js';
import { analyzeTestResults, generateRecommendations } from '../services/adaptive-learning.service.js';
import { getQuestionById } from '../services/question.service.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAPPING_PATH = path.join(__dirname, '../../content/mapping/question-theme-mapping.json');

const router = express.Router();

/**
 * POST /api/course/analyze
 * Analyse les résultats du test
 * Body: { language, testResults: [{ questionId, userAnswer, isCorrect, score }] }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { language, testResults } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'language est requis'
      });
    }

    if (!testResults || !Array.isArray(testResults) || testResults.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'testResults est requis et doit être un tableau non vide'
      });
    }

    // Charger le mapping questions → thèmes
    let questionMapping = [];
    try {
      const data = await fs.readFile(MAPPING_PATH, 'utf-8');
      const mapping = JSON.parse(data);
      questionMapping = mapping.questions || [];
    } catch (error) {
      console.warn('⚠️ Fichier de mapping non trouvé, utilisation du mapping par défaut');
      // Mapping par défaut (à adapter selon tes questions)
      questionMapping = testResults.map((result, index) => ({
        id: result.questionId,
        theme: ['variables', 'conditions', 'boucles', 'fonctions', 'tableaux'][index % 5],
        language: language
      }));
    }

    // Analyser les résultats
    const analysis = await analyzeTestResults(testResults, questionMapping);
    
    // Générer des recommandations
    const recommendations = generateRecommendations(analysis.weakThemes);

    res.json({
      success: true,
      data: {
        ...analysis,
        recommendations
      }
    });

  } catch (error) {
    console.error('❌ Erreur analyse:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/course/generate
 * Génère un cours personnalisé
 * Body: { language, weakThemes, studentLevel }
 */
router.post('/generate', async (req, res) => {
  try {
    const { language, weakThemes, studentLevel = 'débutant' } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'language est requis'
      });
    }

    if (!weakThemes || !Array.isArray(weakThemes) || weakThemes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'weakThemes est requis et doit être un tableau non vide'
      });
    }

    console.log(`🔹 Génération de cours pour : ${weakThemes.join(', ')}`);

    const course = await generatePersonalizedCourse(language, weakThemes, studentLevel);

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('❌ Erreur génération cours:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/course/exercises
 * Génère des exercices sur un thème
 * Body: { language, theme, count }
 */
router.post('/exercises', async (req, res) => {
  try {
    const { language, theme, count = 3 } = req.body;

    if (!language || !theme) {
      return res.status(400).json({
        success: false,
        error: 'language et theme sont requis'
      });
    }

    const exercises = await generateExercises(language, theme, count);

    res.json({
      success: true,
      data: exercises
    });

  } catch (error) {
    console.error('❌ Erreur génération exercices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;