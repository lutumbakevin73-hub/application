import * as studyService from "../services/study.service.js";

function sendProgram(res, result) {
  return res.json({
    success: true,
    programId: result.programId,
    sessions: result.sessions,
    existing: Boolean(result.existing),
    repaired: Boolean(result.repaired)
  });
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

    const result = await studyService.createStudyProgram(userId, themes);
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

export async function getSessions(req, res) {
  try {
    const sessions = await studyService.getProgramSessions(req.params.programId);
    res.json({ success: true, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération sessions" });
  }
}
