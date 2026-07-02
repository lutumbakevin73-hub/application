import { insertAndGetId, getDb } from "../config/database.js";

function toJsonColumn(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return value;
}

function parseStoredField(value) {
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function getUserAgenda(userId) {
  const row = await getDb()("agendas")
    .where({ user_id: userId })
    .orderBy("id", "desc")
    .first();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    phone: row.phone,
    program: row.program,
    sessions: parseStoredField(row.sessions),
    created_at: row.created_at
  };
}

export async function saveAgenda({ userId, phone, program, sessions }) {
  if (!userId) {
    throw new Error("Utilisateur non identifié");
  }
  if (!phone?.trim()) {
    throw new Error("Numéro de téléphone requis");
  }
  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw new Error("Sessions invalides");
  }
  if (sessions.some((s) => !s.date || !s.time)) {
    throw new Error("Toutes les séances doivent avoir une date et une heure");
  }

  const sessionsWithReminders = sessions.map((s) => ({
    date: s.date,
    time: s.time,
    theme: s.theme || null,
    reminded: false
  }));

  const db = getDb();
  const existing = await db("agendas")
    .where({ user_id: userId })
    .orderBy("id", "desc")
    .first();

  const payload = {
    phone: phone.trim(),
    program: program || "prog2",
    sessions: toJsonColumn(sessionsWithReminders)
  };

  if (existing) {
    await db("agendas").where({ id: existing.id }).update(payload);
    return {
      agendaId: existing.id,
      agenda: {
        phone: payload.phone,
        program: payload.program,
        sessions: sessionsWithReminders
      },
      updated: true
    };
  }

  const agendaId = await insertAndGetId("agendas", {
    user_id: userId,
    ...payload
  });

  return {
    agendaId,
    agenda: {
      phone: payload.phone,
      program: payload.program,
      sessions: sessionsWithReminders
    }
  };
}

export async function getAllAgendas() {
  const rows = await getDb()("agendas").select("*");
  return rows.map((row) => ({
    ...row,
    sessions: parseStoredField(row.sessions)
  }));
}

export async function updateAgendaSessions(id, sessions) {
  await getDb()("agendas")
    .where({ id })
    .update({ sessions: toJsonColumn(sessions) });
}
