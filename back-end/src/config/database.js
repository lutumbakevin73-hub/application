import knex from "knex";
import knexConfig from "../../knexfile.js";

let db;

export function getDb() {
  if (!db) {
    db = knex(knexConfig);
  }
  return db;
}

export async function insertAndGetId(table, data, trx) {
  const client = knexConfig.client;
  const query = trx || getDb();

  if (client === "mysql2") {
    const [id] = await query(table).insert(data);
    return id;
  }

  const [insertedId] = await query(table).insert(data);
  if (insertedId == null) {
    throw new Error(`Insertion impossible dans ${table}`);
  }

  return Number(insertedId);
}

export async function initDatabase() {
  const database = getDb();
  await database.migrate.latest();
  return database;
}
