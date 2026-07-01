import { getDb } from "../config/database.js";

export async function markTestComplete(userId) {
  await getDb()("users")
    .where({ id: userId })
    .update({ has_passed_test: true });
}
