import { insertAndGetId, getDb } from "../config/database.js";
import { env } from "../config/env.js";
import { findUserById } from "./auth.service.js";
import { sendWelcomeProgramSms } from "./agenda-notification.service.js";

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

async function maybeSendWelcomeSms({
  agendaId,
  userId,
  phone,
  program,
  sessions,
  alreadySent
}) {
  if (!env.smsTestMode && alreadySent) {
    return {
      sent: false,
      skipped: true,
      reason: "SMS de programme déjà envoyé pour ce compte"
    };
  }

  const user = await findUserById(userId);
  const welcomeSms = await sendWelcomeProgramSms({
    phone,
    username: user?.username,
    program,
    sessions
  });

  if (welcomeSms.sent) {
    await getDb()("agendas").where({ id: agendaId }).update({ welcome_sms_sent: true });
    console.log(`SMS programme envoyé → ${welcomeSms.to} (agenda #${agendaId})`);
  } else if (!welcomeSms.skipped) {
    console.warn(`SMS programme non envoyé (agenda #${agendaId}) :`, welcomeSms.error || welcomeSms.reason);
  }

  return welcomeSms;
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
    welcome_sms_sent: Boolean(row.welcome_sms_sent),
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

  const db = getDb();
  const existing = await db("agendas")
    .where({ user_id: userId })
    .orderBy("id", "desc")
    .first();

  const existingSessions = existing
    ? parseStoredField(existing.sessions) || []
    : [];

  const sessionsWithReminders = sessions.map((s, index) => {
    const previous = existingSessions[index];
    const sameSlot =
      previous &&
      previous.date === s.date &&
      previous.time === s.time &&
      (previous.theme || null) === (s.theme || null);

    return {
      date: s.date,
      time: s.time,
      theme: s.theme || null,
      reminded: sameSlot ? Boolean(previous.reminded) : false
    };
  });

  const payload = {
    phone: phone.trim(),
    program: program || "prog2",
    sessions: toJsonColumn(sessionsWithReminders)
  };

  if (existing) {
    await db("agendas").where({ id: existing.id }).update(payload);

    const welcomeSms = await maybeSendWelcomeSms({
      agendaId: existing.id,
      userId,
      phone: payload.phone,
      program: payload.program,
      sessions: sessionsWithReminders,
      alreadySent: Boolean(existing.welcome_sms_sent)
    });

    return {
      agendaId: existing.id,
      agenda: {
        phone: payload.phone,
        program: payload.program,
        sessions: sessionsWithReminders
      },
      updated: true,
      welcomeSms
    };
  }

  const agendaId = await insertAndGetId("agendas", {
    user_id: userId,
    welcome_sms_sent: false,
    ...payload
  });

  const welcomeSms = await maybeSendWelcomeSms({
    agendaId,
    userId,
    phone: payload.phone,
    program: payload.program,
    sessions: sessionsWithReminders,
    alreadySent: false
  });

  return {
    agendaId,
    agenda: {
      phone: payload.phone,
      program: payload.program,
      sessions: sessionsWithReminders
    },
    welcomeSms
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
