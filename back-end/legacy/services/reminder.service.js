import cron from "node-cron";
import { db } from "../config/firebase.js";
import { sendSMS } from "./sms.service.js";

export function startReminderService() {

  if (!db) {
    console.warn("Service de rappel ignoré (Firebase non configuré).");
    return;
  }

  console.log("✅ Service de rappel démarré.");

  // Vérifie toutes les minutes
  cron.schedule("* * * * *", async () => {

    console.log("⏰ Vérification des rappels...");

    try {

      const snapshot = await db.collection("agendas").get();

      const now = new Date();

      for (const doc of snapshot.docs) {

        const agenda = doc.data();

        if (!agenda.sessions || !Array.isArray(agenda.sessions)) {
          continue;
        }

        let modified = false;

        for (const session of agenda.sessions) {

          // Déjà rappelée
          if (session.reminded) {
            continue;
          }

          // Session incomplète
          if (!session.date || !session.time) {
            continue;
          }

          // Adapter ce format si nécessaire
          const sessionDate = new Date(`${session.date} ${session.time}`);

          // Date invalide
          if (isNaN(sessionDate.getTime())) {
            console.log(
              "⚠️ Date invalide :",
              session.date,
              session.time
            );
            continue;
          }

          const diffMinutes =
            (sessionDate.getTime() - now.getTime()) / (1000 * 60);

          // Entre 14 et 15 minutes avant
          if (diffMinutes <= 15 && diffMinutes > 14) {

            try {

              await sendSMS(
                agenda.phone,
                "📚 Bonjour ! Votre séance d'étude commence dans 15 minutes. Bon courage ! 💪"
              );

              console.log(
                `✅ SMS envoyé à ${agenda.phone}`
              );

              // Marquer comme déjà rappelée
              session.reminded = true;
              modified = true;

            } catch (smsError) {

              console.error(
                "❌ Erreur envoi SMS :",
                smsError
              );

            }

          }

        }

        // Mise à jour Firebase uniquement si nécessaire
        if (modified) {

          await doc.ref.update({
            sessions: agenda.sessions
          });

          console.log(
            `📝 Agenda ${doc.id} mis à jour`
          );

        }

      }

    } catch (err) {

      console.error(
        "❌ Erreur reminder :",
        err
      );

    }

  });

}