import { existsSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");

if (existsSync(envPath)) {
  console.log(".env existe déjà — rien à faire.");
  process.exit(0);
}

const content = `# Serveur
PORT=5000
FRONTEND_URL=http://localhost:5173

# Base de données : sqlite3 (défaut) ou mysql2
DB_CLIENT=sqlite3
DB_SQLITE_PATH=./data/udbl.db

# MySQL (si DB_CLIENT=mysql2)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=learning_app

# Auth
JWT_SECRET=ma_chaine_ultra_secrete_12345

# Groq (IA) — renseignez votre clé
GROQ_API_KEY=

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# E-mail (optionnel)
EMAIL_USER=tonemail@gmail.com
EMAIL_PASS=mot_de_passe_application_google

# Twilio SMS (optionnel)
TWILIO_SID=xxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE=+1xxxxxxxx
SMS_TEST_MODE=true
`;

writeFileSync(envPath, content, "utf8");
console.log("✓ Fichier .env créé. Copiez les valeurs depuis .env.example ou renseignez vos clés.");
