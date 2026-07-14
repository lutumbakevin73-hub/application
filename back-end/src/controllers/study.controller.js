import * as studyService from "../services/study.service.js";
import * as lessonProgressService from "../services/lesson-progress.service.js";

function sendProgram(res, result) {
  return res.json({
    success: true,
    programId: result.programId,
    program: result.program ?? null,
    sessions: result.sessions,
    existing: Boolean(result.existing),
    repaired: Boolean(result.repaired)
  });
}

function sendSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function createProgramStream(req, res) {
  const rawThemes = req.body.weakThemes ?? req.body.weak_themes;
  const weakThemes = Array.isArray(rawThemes)
    ? rawThemes.filter(Boolean).map(String)
    : [];
  const themes =
    weakThemes.length > 0 ? weakThemes : ["variables", "conditions", "boucles"];

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const emit = (event) => sendSse(res, event);

  try {
    const result = await studyService.createStudyProgram(
      req.user.id,
      themes,
      req.body.program || req.body.programId,
      emit
    );

    emit({
      phase: "done",
      message: "Programme prêt !",
      percent: 100,
      programId: result.programId,
      program: result.program,
      sessions: result.sessions,
      existing: Boolean(result.existing),
      repaired: Boolean(result.repaired)
    });
  } catch (err) {
    console.error("Erreur stream création programme :", err);
    emit({
      phase: "error",
      message: err.message || "Erreur création programme"
    });
  }

  res.end();
}

export async function createProgram(req, res) {
  try {
    const userId = req.user.id;
    const rawThemes = req.body.weakThemes ?? req.body.weak_themes;
    const weakThemes = Array.isArray(rawThemes)
      ? rawThemes.filter(Boolean).map(String)
      : [];

    const themes =
      weakThemes.length > 0
        ? weakThemes
        : ["variables", "conditions", "boucles"];

    const result = await studyService.createStudyProgram(
      userId,
      themes,
      req.body.program || req.body.programId
    );
    return sendProgram(res, result);
  } catch (err) {
    console.error("Erreur création programme :", err);
    return res.status(500).json({
      error: "Erreur création programme",
      message: err?.message || String(err)
    });
  }
}

export async function getMyProgram(req, res) {
  try {
    const result = await studyService.getUserProgram(req.user.id);
    if (!result) {
      return res.status(404).json({ message: "Aucun programme trouvé" });
    }
    return sendProgram(res, result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erreur récupération programme",
      message: err?.message || String(err)
    });
  }
}

export async function getProgress(req, res) {
  try {
    const program = await studyService.getUserProgram(req.user.id);
    if (!program?.programId) {
      return res.json({
        success: true,
        programId: null,
        progress: { completed: [], quizAttempts: {} }
      });
    }

    const progress = await lessonProgressService.getLessonProgress(
      req.user.id,
      program.programId
    );

    return res.json({
      success: true,
      programId: program.programId,
      progress
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur récupération progression" });
  }
}

export async function saveProgress(req, res) {
  try {
    const program = await studyService.getUserProgram(req.user.id);
    if (!program?.programId) {
      return res.status(404).json({ message: "Aucun programme trouvé" });
    }

    const progress = await lessonProgressService.saveLessonProgress(
      req.user.id,
      program.programId,
      req.body
    );

    return res.json({
      success: true,
      programId: program.programId,
      progress
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Erreur sauvegarde progression" });
  }
}
