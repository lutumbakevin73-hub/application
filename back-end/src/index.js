import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app.js";
import { initDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { isLlmAvailable } from "./services/llm.service.js";
import { isTwilioConfigured } from "./services/sms.service.js";
import { startReminderService } from "./services/reminder.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

if (env.dbClient !== "mysql2" && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

await initDatabase();

const app = createApp();

startReminderService();

app.listen(env.port, () => {
  console.log(`Serveur UDBL Learning v2.0.1 → http://localhost:${env.port}`);
  console.log(`Base de données : ${env.dbClient === "mysql2" ? "MySQL" : "SQLite"}`);
  console.log(`IA Groq : ${isLlmAvailable() ? "active" : "inactive"}`);
  console.log(`SMS Twilio : ${isTwilioConfigured() ? "active" : "inactive"}`);
  if (env.smsTestMode) {
    console.log("SMS mode test : envoi à chaque sauvegarde d'agenda (numéro non bloqué).");
  }
});
