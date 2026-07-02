import { initDatabase, getDb } from "../src/config/database.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: node scripts/demote-to-student.js <email>");
  process.exit(1);
}

await initDatabase();
const db = getDb();
const user = await db("users").where({ email }).first();

if (!user) {
  console.error(`Aucun utilisateur trouvé : ${email}`);
  process.exit(1);
}

await db("users").where({ id: user.id }).update({ role: "user" });
console.log(`✓ ${email} est redevenu un compte étudiant (user).`);
process.exit(0);
