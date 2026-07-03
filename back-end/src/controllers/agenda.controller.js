import * as agendaService from "../services/agenda.service.js";

export async function getMyAgenda(req, res) {
  try {
    const agenda = await agendaService.getUserAgenda(req.user.id);
    res.json({ success: true, agenda: agenda ?? null });
  } catch (err) {
    res.status(500).json({ message: err.message || "Erreur serveur" });
  }
}

export async function saveAgenda(req, res) {
  try {
    const { phone, sessions, program } = req.body;
    const result = await agendaService.saveAgenda({
      userId: req.user.id,
      phone,
      program,
      sessions
    });
    res.json({
      success: true,
      message: result.welcomeSms?.sent
        ? "Agenda enregistré — SMS de confirmation envoyé"
        : "Agenda enregistré",
      ...result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}
