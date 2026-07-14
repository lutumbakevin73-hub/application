import { getTwilioStatus, normalizePhoneNumber, sendSMS } from "../src/services/sms.service.js";
import { getDb, initDatabase } from "../src/config/database.js";

const toArg = process.argv[2];

await initDatabase();

const status = getTwilioStatus();
console.log("Twilio configuré :", status.configured ? "oui" : "non");

if (!status.configured) {
  status.issues.forEach((issue) => console.log(" -", issue));
  process.exit(1);
}

let to = toArg;

if (!to) {
  const row = await getDb()("agendas").select("phone").orderBy("id", "desc").first();
  to = row?.phone || "+243854721056";
}

const normalized = normalizePhoneNumber(to);
console.log("Destinataire :", normalized);

try {
  const result = await sendSMS(
    normalized,
    "UDBL Learning — Test SMS depuis le serveur. Si vous recevez ce message, Twilio fonctionne."
  );
  console.log("Envoi réussi — sid:", result.sid);
  console.log("Statut Twilio :", result.status);
} catch (err) {
  console.error("Échec :", err.message);
  process.exit(1);
}
