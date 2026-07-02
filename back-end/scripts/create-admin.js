import bcrypt from "bcrypt";
import { initDatabase, getDb, insertAndGetId } from "../src/config/database.js";

const email = process.argv[2]?.trim().toLowerCase() || "admin@udbl.local";
const password = process.argv[3] || "Admin@UDBL2026";
const username = process.argv[4]?.trim() || "Administrateur UDBL";

if (password.length < 8) {
  console.error("Le mot de passe doit contenir au moins 8 caractères.");
  process.exit(1);
}

await initDatabase();
const db = getDb();

const existing = await db("users").where({ email }).first();

if (existing) {
  if (existing.role === "admin") {
    console.log(`Le compte admin existe déjà : ${email}`);
    process.exit(0);
  }
  await db("users").where({ id: existing.id }).update({ role: "admin", username });
  console.log(`✓ Compte existant promu admin : ${email}`);
  console.log(`  Connexion : ${email} / (votre mot de passe actuel)`);
  process.exit(0);
}

const hashed = await bcrypt.hash(password, 10);
await insertAndGetId("users", {
  username,
  email,
  password: hashed,
  role: "admin",
  has_passed_test: false
});

console.log("✓ Compte administrateur créé (espace admin uniquement).");
console.log(`  E-mail    : ${email}`);
console.log(`  Mot de passe : ${password}`);
console.log("  Connexion : /login → redirection automatique vers /admin");
process.exit(0);
