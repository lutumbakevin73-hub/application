import * as agendaService from "../services/agenda.service.js";

export async function saveAgenda(req, res) {
  try {
    const { phone, sessions, program, userId } = req.body;
    const result = await agendaService.saveAgenda({
      userId: userId || req.user?.id,
      phone,
      program,
      sessions
    });
    res.json({
      success: true,
      message: "Agenda enregistré",
      ...result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}
