import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(
  __dirname,
  "..",
  "serviceAccountKey.json"
);

let db = null;

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  db = admin.firestore();
  console.log("Firebase OK");
} else {
  console.warn(
    "Firebase désactivé : serviceAccountKey.json introuvable (agenda + SMS indisponibles)"
  );
}

export { db };
