import { getProgramLabel } from "../config/programs.js";
import { isTwilioConfigured, normalizePhoneNumber, sendSMS } from "./sms.service.js";

function formatSessionDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString("fr-FR");
  } catch {
    return dateStr;
  }
}

function formatSessionTime(timeStr) {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

export function buildWelcomeProgramMessage({ username, program, sessions = [] }) {
  const name = username?.trim() || "étudiant";
  const programLabel = getProgramLabel(program);
  const lines = sessions.map((session, index) => {
    const theme = session.theme ? ` — ${session.theme}` : "";
    return `S${index + 1}: ${formatSessionDate(session.date)} ${formatSessionTime(session.time)}${theme}`;
  });

  const header = `UDBL Learning — Bonjour ${name} ! Votre programme (${programLabel}) est planifie.`;
  const footer = "Rappels SMS avant chaque seance. Bon courage !";
  const body = [header, ...lines, footer].join("\n");

  if (body.length <= 640) {
    return body;
  }

  const shortHeader = `UDBL — Bonjour ${name} ! Programme ${programLabel} : ${sessions.length} seance(s).`;
  const shortLines = sessions
    .slice(0, 4)
    .map(
      (session, index) =>
        `${index + 1}) ${formatSessionDate(session.date)} ${formatSessionTime(session.time)}`
    );
  const extra =
    sessions.length > 4 ? `\n+ ${sessions.length - 4} autre(s) seance(s)` : "";
  return [shortHeader, ...shortLines, footer, extra].filter(Boolean).join("\n");
}

export async function sendWelcomeProgramSms({ phone, username, program, sessions }) {
  if (!isTwilioConfigured()) {
    return {
      sent: false,
      skipped: true,
      reason: "Twilio non configuré"
    };
  }

  try {
    const to = normalizePhoneNumber(phone);
    const body = buildWelcomeProgramMessage({ username, program, sessions });
    await sendSMS(to, body);

    return {
      sent: true,
      to,
      preview: body
    };
  } catch (err) {
    console.error("Erreur SMS programme d'étude :", err.message);
    return {
      sent: false,
      error: err.message
    };
  }
}
