import cron from "node-cron";
import { getAllAgendas, updateAgendaSessions } from "./agenda.service.js";
import { sendSMS } from "./sms.service.js";

export function startReminderService() {
  console.log("Service de rappel démarré.");

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

          const sessionDate = new Date(`${session.date} ${session.time}`);
          if (isNaN(sessionDate.getTime())) {
            continue;
          }

          const diffMinutes = (sessionDate.getTime() - now.getTime()) / (1000 * 60);

          if (diffMinutes <= 15 && diffMinutes > 14) {
            try {
              await sendSMS(
                agenda.phone,
                "Bonjour ! Votre séance d'étude commence dans 15 minutes. Bon courage !"
              );
              session.reminded = true;
              modified = true;
            } catch (err) {
              console.error("Erreur envoi SMS :", err.message);
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
