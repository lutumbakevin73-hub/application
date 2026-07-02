import { initDatabase, getDb } from "../src/config/database.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: node scripts/promote-admin.js <email>");
  process.exit(1);
}

await initDatabase();

const db = getDb();
const user = await db("users").where({ email }).first();

if (!user) {
  console.error(`Aucun utilisateur trouvé pour : ${email}`);
  process.exit(1);
}

await db("users").where({ id: user.id }).update({ role: "admin" });

console.log(`✓ ${user.username} (${email}) est maintenant administrateur.`);
process.exit(0);
