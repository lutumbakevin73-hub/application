import cron from "node-cron";
import { env } from "../config/env.js";
import { getAllAgendas, updateAgendaSessions } from "./agenda.service.js";
import { isTwilioConfigured, normalizePhoneNumber, sendSMS } from "./sms.service.js";
import {
  formatSessionDateTimeLocal,
  getMinutesUntilSession
} from "../utils/session-datetime.js";

const REMINDER_MINUTES = 15;

export function startReminderService() {
  if (!isTwilioConfigured()) {
    console.log("Rappels SMS désactivés (Twilio non configuré).");
    return;
  }

  console.log(
    `Service de rappel SMS démarré (fuseau ${env.appTimezone}, rappel ${REMINDER_MINUTES} min avant).`
  );

  cron.schedule("* * * * *", async () => {
    try {
      const agendas = await getAllAgendas();
      const now = new Date();

      for (const agenda of agendas) {
        let modified = false;

        for (const session of agenda.sessions) {
          if (session.reminded || !session.date || !session.time) {
            continue;
          }

          const diffMinutes = getMinutesUntilSession(session.date, session.time, now);
          if (diffMinutes == null) {
            continue;
          }

          if (diffMinutes <= 0) {
            continue;
          }

          if (diffMinutes <= REMINDER_MINUTES) {
            try {
              const when = formatSessionDateTimeLocal(session.date, session.time);
              await sendSMS(
                normalizePhoneNumber(agenda.phone),
                `UDBL Learning — Rappel : votre seance commence dans ${Math.max(1, Math.round(diffMinutes))} min (${when}). Bon courage !`
              );
              session.reminded = true;
              modified = true;
              console.log(
                `Rappel SMS envoyé → agenda #${agenda.id}, ${when} (dans ${diffMinutes.toFixed(1)} min)`
              );
            } catch (err) {
              console.error("Erreur envoi SMS rappel :", err.message);
            }
          }
        }

        if (modified) {
          await updateAgendaSessions(agenda.id, agenda.sessions);
        }
      }
    } catch (err) {
      console.error("Erreur reminder :", err);
    }
  });
}
