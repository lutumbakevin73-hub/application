import { insertAndGetId, getDb } from "../config/database.js";

export async function saveAgenda({ userId, phone, program, sessions }) {
  if (!phone) {
    throw new Error("Numéro de téléphone requis");
  }
  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw new Error("Sessions invalides");
  }
  if (sessions.some((s) => !s.date || !s.time)) {
    throw new Error("Toutes les séances doivent être complètes");
  }

  const sessionsWithReminders = sessions.map((s) => ({
    ...s,
    reminded: false
  }));

  const agendaId = await insertAndGetId("agendas", {
    user_id: userId || null,
    phone,
    program,
    sessions: JSON.stringify(sessionsWithReminders)
  });

  return {
    agendaId,
    agenda: {
      phone,
      program,
      sessions: sessionsWithReminders
    }
  };
}

export async function getAllAgendas() {
  const rows = await getDb()("agendas").select("*");
  return rows.map((row) => ({
    ...row,
    sessions:
      typeof row.sessions === "string"
        ? JSON.parse(row.sessions)
        : row.sessions
  }));
}

export async function updateAgendaSessions(id, sessions) {
  await getDb()("agendas")
    .where({ id })
    .update({ sessions: JSON.stringify(sessions) });
}
