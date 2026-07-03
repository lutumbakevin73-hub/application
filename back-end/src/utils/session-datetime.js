import { env } from "../config/env.js";

/**
 * Les horaires saisis dans l'agenda sont interprétés en heure locale UDBL
 * (Lubumbashi, UTC+2), pas en heure du serveur.
 */
export function parseSessionDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) {
    return null;
  }

  const date = String(dateStr).trim();
  const time = String(timeStr).trim().slice(0, 5);
  const offset = env.appTimezoneOffset || "+02:00";

  const parsed = new Date(`${date}T${time}:00${offset}`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function getMinutesUntilSession(dateStr, timeStr, now = new Date()) {
  const sessionDate = parseSessionDateTime(dateStr, timeStr);
  if (!sessionDate) {
    return null;
  }

  return (sessionDate.getTime() - now.getTime()) / (1000 * 60);
}

export function formatSessionDateTimeLocal(dateStr, timeStr) {
  const parsed = parseSessionDateTime(dateStr, timeStr);
  if (!parsed) {
    return "—";
  }

  return parsed.toLocaleString("fr-FR", {
    timeZone: env.appTimezone || "Africa/Lubumbashi",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}
